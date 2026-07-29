// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleExtendReservation } from "./extend_reservation.ts";

function client(existing: any) {
  const posts: string[] = [];
  const puts: any[] = [];
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
        delete: () => Promise.resolve({ ok: true }),
        query: () => Promise.resolve({ ok: true, items: [] }),
      },
    },
    workflows: {
      triggers: {
        create: (a: any) => {
          created.push(a);
          return Promise.resolve({ ok: true, trigger: { id: "T2" } });
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
  return { c, posts, puts, created };
}

Deno.test("dono estende +1h", async () => {
  const r = {
    resource: "cards-stg",
    service: "cards",
    environment: "staging",
    owner: "U1",
    started_at: 0,
    expires_at: 8000,
    note: "",
    reminders_sent: [60],
    token: "t",
    pending_trigger_id: "T1",
  };
  const { c, posts, puts } = client(r);
  const out = await handleExtendReservation(c as any, {
    service: "cards",
    environment: "staging",
    extra: "1h",
    requester: "U1",
    channel: "C1",
  }, { nowSec: 7700 });
  assertEquals(puts[0].expires_at, 8000 + 3600);
  assertStringIncludes(posts[0], "estendeu");
  assertStringIncludes(out.status, "estendido");
});

Deno.test("nao-dono nao estende", async () => {
  const r = {
    resource: "cards-stg",
    owner: "U1",
    token: "t",
    expires_at: 8000,
    reminders_sent: [],
    service: "cards",
    environment: "staging",
    pending_trigger_id: "",
  };
  const { c, posts } = client(r);
  await handleExtendReservation(c as any, {
    service: "cards",
    environment: "staging",
    extra: "1h",
    requester: "U2",
    channel: "C1",
  }, { nowSec: 7700 });
  assertStringIncludes(posts[0], "Apenas quem reservou");
});
