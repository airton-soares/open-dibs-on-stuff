// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleTick } from "./tick.ts";

const config = { tz: "America/Sao_Paulo", businessEndHour: 18 };

function client(existing: any, queue: any[] = []) {
  const posts: string[] = [];
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
    },
  };
  return { c, posts, puts, deletes, created };
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

Deno.test("tick envia lembrete e reagenda", async () => {
  const { c, posts, puts, created } = client(res({ expires_at: 7200 }));
  await handleTick(c as any, { resource: "cards-stg", token: "tok", channel: "C1" }, {
    nowSec: 7200 - 30 * 60,
    config,
  });
  assertStringIncludes(posts[0], "expira em");
  assertEquals(puts[0].reminders_sent.includes(30), true);
  assertEquals(created.length, 1);
});
