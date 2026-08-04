// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleCreateReservation } from "./create_reservation.ts";
import { endOfBusinessDaySec } from "./internals/time.ts";

const config = { tz: "America/Sao_Paulo", businessEndHour: 18 };

function client(existing: Record<string, any> = {}, queue: any[] = []) {
  const posts: string[] = [];
  const puts: any[] = [];
  const c = {
    apps: {
      datastore: {
        get: (a: any) => Promise.resolve({ ok: true, item: existing[a.id] ?? {} }),
        put: (a: any) => {
          puts.push(a.item);
          return Promise.resolve({ ok: true });
        },
        query: () => Promise.resolve({ ok: true, items: queue }),
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
  return { c, posts, puts };
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

Deno.test("entra na fila quando ocupado", async () => {
  const { c, posts } = client(
    { "cards-stg": { resource: "cards-stg", owner: "U9", token: "x" } },
    [],
  );
  await handleCreateReservation(c as any, {
    service: "cards",
    environment: "staging",
    duration: "2h",
    note: "",
    owner: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "id", config });
  assertStringIncludes(posts[0], "fila");
});
