// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { handleCreateReservation } from "./create_reservation.ts";
import { endOfBusinessDaySec } from "./internals/time.ts";

const config = { tz: "America/Sao_Paulo", businessEndHour: 18 };

function client(existing: Record<string, any> = {}, queue: any[] = []) {
  const posts: string[] = [];
  const ephemeral: any[] = [];
  const puts: any[] = [];
  const c = {
    apps: {
      datastore: {
        get: (a: any) => Promise.resolve({ ok: true, item: existing[a.id] ?? {} }),
        put: (a: any) => {
          puts.push(a.item);
          if (a.datastore === "waitlist") queue.push(a.item);
          return Promise.resolve({ ok: true });
        },
        query: () => Promise.resolve({ ok: true, items: queue.slice() }),
        delete: () => Promise.resolve({ ok: true }),
      },
    },
    workflows: {
      triggers: { create: () => Promise.resolve({ ok: true, trigger: { id: "T" } }) },
    },
    chat: {
      postMessage: (a: any) => {
        posts.push(a.text);
        return Promise.resolve({ ok: true });
      },
      postEphemeral: (a: any) => {
        ephemeral.push(a);
        return Promise.resolve({ ok: true });
      },
    },
  };
  return { c, posts, ephemeral, puts };
}

Deno.test("cria reserva quando o recurso esta livre", async () => {
  const { c, posts, puts } = client();
  const out = await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "2h",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "tok", config });
  assertEquals(puts[0].resource, "cards-stg");
  assertEquals(puts[0].owner, "U1");
  assertStringIncludes(posts[0], "reservou");
  assertStringIncludes(out.status, "cards-stg");
});

Deno.test("usa o env do contexto quando config nao e informado", async () => {
  const { c, puts } = client();
  await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "eob",
    note: "",
    owner: "U1",
    channel: "C1",
  }, {
    nowSec: 1000,
    genId: () => "tok",
    env: { DIBS_TIMEZONE: "America/New_York", DIBS_BUSINESS_END_HOUR: "20" },
  });
  assertEquals(puts[0].expires_at, endOfBusinessDaySec(1000, "America/New_York", 20));
});

Deno.test("cai nos defaults quando o env do contexto vem vazio", async () => {
  const { c, puts } = client();
  await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "eob",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "tok", env: {} });
  assertEquals(puts[0].expires_at, endOfBusinessDaySec(1000));
});

Deno.test("nao reserva por cima quando a leitura do datastore falha", async () => {
  const puts: any[] = [];
  const posts: string[] = [];
  const c = {
    apps: {
      datastore: {
        get: () => Promise.resolve({ ok: false, error: "datastore_error" }),
        put: (a: any) => {
          puts.push(a.item);
          return Promise.resolve({ ok: true });
        },
        query: () => Promise.resolve({ ok: true, items: [] }),
        delete: () => Promise.resolve({ ok: true }),
      },
    },
    workflows: {
      triggers: { create: () => Promise.resolve({ ok: true, trigger: { id: "T" } }) },
    },
    chat: {
      postMessage: (a: any) => {
        posts.push(a.text);
        return Promise.resolve({ ok: true });
      },
    },
  };

  await assertRejects(
    () =>
      handleCreateReservation(c as any, {
        service: "cards",
        environment: "staging",
        duration: "2h",
        note: "",
        owner: "U1",
        channel: "C1",
      }, { nowSec: 1000, genId: () => "tok", config }),
    Error,
    "datastore_error",
  );
  assertEquals(puts.length, 0);
  assertEquals(posts.length, 0);
});

Deno.test("falha quando o Slack recusa a mensagem", async () => {
  const { c } = client();
  c.chat.postMessage = () => Promise.resolve({ ok: false, error: "not_in_channel" } as any);
  await assertRejects(
    () =>
      handleCreateReservation(c as any, {
        service: "cards",
        environment: "staging",
        duration: "2h",
        note: "",
        owner: "U1",
        channel: "C1",
      }, { nowSec: 1000, genId: () => "tok", config }),
    Error,
    "not_in_channel",
  );
});

Deno.test("entra na fila quando ocupado", async () => {
  const { c, posts, puts } = client(
    { "cards-stg": { resource: "cards-stg", owner: "U9", token: "x" } },
    [{ id: "w1", resource: "cards-stg", user: "U2", requested_at: 500 }],
  );
  const out = await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "2h",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "id", config });
  assertEquals(puts[0], { id: "id", resource: "cards-stg", user: "U1", requested_at: 1000 });
  assertStringIncludes(posts[0], "sua posição é a 2 em uma fila de tamanho 2");
  assertStringIncludes(out.status, "na fila");
});

Deno.test("nao entra na fila quem ja e dono do recurso", async () => {
  const { c, posts, ephemeral, puts } = client(
    { "cards-stg": { resource: "cards-stg", owner: "U1", token: "x" } },
    [],
  );
  const out = await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "2h",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "id", config });
  assertEquals(puts.length, 0);
  assertEquals(posts.length, 0);
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].user, "U1");
  assertStringIncludes(ephemeral[0].text, "já está com");
  assertStringIncludes(out.status, "ja reservado por U1");
});

Deno.test("nao entra na fila duas vezes no mesmo recurso", async () => {
  const { c, posts, ephemeral, puts } = client(
    { "cards-stg": { resource: "cards-stg", owner: "U9", token: "x" } },
    [
      { id: "w1", resource: "cards-stg", user: "U2", requested_at: 500 },
      { id: "w2", resource: "cards-stg", user: "U1", requested_at: 600 },
    ],
  );
  const out = await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "2h",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "id", config });
  assertEquals(puts.length, 0);
  assertEquals(posts.length, 0);
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].user, "U1");
  assertStringIncludes(ephemeral[0].text, "já está na fila");
  assertStringIncludes(ephemeral[0].text, "sua posição é a 2 em uma fila de tamanho 2");
  assertStringIncludes(out.status, "ja esta na fila");
});
