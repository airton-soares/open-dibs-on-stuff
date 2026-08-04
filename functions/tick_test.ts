// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { handleTick } from "./tick.ts";
import { endOfBusinessDaySec } from "./internals/time.ts";

const config = { tz: "America/Sao_Paulo", businessEndHour: 18 };

function client(existing: any, queue: any[] = []) {
  const posts: string[] = [];
  const ephemeral: any[] = [];
  const puts: any[] = [];
  const deletes: string[] = [];
  const created: any[] = [];
  const c = {
    apps: {
      datastore: {
        get: (a: any) =>
          Promise.resolve({
            ok: true,
            item: existing && existing.resource === a.id ? existing : {},
          }),
        put: (a: any) => {
          puts.push(a.item);
          return Promise.resolve({ ok: true });
        },
        delete: (a: any) => {
          deletes.push(a.id);
          return Promise.resolve({ ok: true });
        },
        query: () => Promise.resolve({ ok: true, items: queue }),
      },
    },
    workflows: {
      triggers: {
        create: (a: any) => {
          created.push(a);
          return Promise.resolve({ ok: true, trigger: { id: "Tn" } });
        },
        delete: () => Promise.resolve({ ok: true }),
      },
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
  return { c, posts, ephemeral, puts, deletes, created };
}

function res(over: any = {}) {
  return {
    resource: "cards-stg",
    service: "cards",
    environment: "staging",
    owner: "U1",
    started_at: 0,
    expires_at: 7200,
    note: "",
    reminders_sent: [],
    token: "tok",
    pending_trigger_id: "T1",
    ...over,
  };
}

Deno.test("tick obsoleto (token diferente) nao faz nada", async () => {
  const { c, posts, puts } = client(res({ token: "outro" }));
  const out = await handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
    nowSec: 100,
    config,
  });
  assertEquals(posts.length, 0);
  assertEquals(puts.length, 0);
  assertStringIncludes(out.status, "obsoleto");
});

Deno.test("tick expira e promove", async () => {
  const q = [{ id: "w1", resource: "cards-stg", user: "U2", requested_at: 10 }];
  const { c, posts, deletes } = client(res({ expires_at: 100 }), q);
  await handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
    nowSec: 100,
    genId: () => "id2",
    config,
  });
  assertEquals(deletes.includes("cards-stg"), true);
  assertStringIncludes(posts.join("\n"), "expirou");
  assertStringIncludes(posts.join("\n"), "assumiu");
});

Deno.test("promocao no tick usa o env do contexto quando config nao e informado", async () => {
  const q = [{ id: "w1", resource: "cards-stg", user: "U2", requested_at: 10 }];
  const { c, puts } = client(res({ expires_at: 100 }), q);
  await handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
    nowSec: 100,
    genId: () => "id2",
    env: { DIBS_TIMEZONE: "America/New_York", DIBS_BUSINESS_END_HOUR: "20" },
  });
  assertEquals(puts[0].owner, "U2");
  assertEquals(puts[0].expires_at, endOfBusinessDaySec(100, "America/New_York", 20));
});

Deno.test("tick envia lembrete so para o dono e reagenda", async () => {
  const { c, posts, ephemeral, puts, created } = client(res({ expires_at: 7200 }));
  await handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
    nowSec: 7200 - 30 * 60,
    config,
  });
  assertEquals(posts.length, 0);
  assertEquals(ephemeral.length, 2);
  assertEquals(ephemeral.map((e: any) => e.channel), ["C1", "C1"]);
  assertEquals(ephemeral.map((e: any) => e.user), ["U1", "U1"]);
  assertStringIncludes(ephemeral[0].text, "expira em");
  assertEquals(puts[0].reminders_sent.includes(30), true);
  assertEquals(created.length, 1);
});

Deno.test("reagenda o tick antes do lembrete, entao o dono fora do canal nao trava a reserva", async () => {
  const { c, puts, created } = client(res({ expires_at: 7200 }));
  c.chat.postEphemeral = () => Promise.resolve({ ok: false, error: "user_not_in_channel" } as any);
  await assertRejects(
    () =>
      handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
        nowSec: 7200 - 30 * 60,
        config,
      }),
    Error,
    "user_not_in_channel",
  );
  assertEquals(created.length, 1);
  assertEquals(puts[0].reminders_sent.includes(30), true);
});
