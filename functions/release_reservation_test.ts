// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleReleaseReservation } from "./release_reservation.ts";
import { endOfBusinessDaySec } from "./internals/time.ts";

const config = { tz: "America/Sao_Paulo", businessEndHour: 18 };

function client(existing: any, queue: any[] = []) {
  const posts: string[] = [];
  const deletes: string[] = [];
  const puts: any[] = [];
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
        create: () => Promise.resolve({ ok: true, trigger: { id: "T" } }),
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
  return { c, posts, deletes, puts };
}

Deno.test("dono libera o recurso", async () => {
  const r = { resource: "cards-stg", owner: "U1", token: "t", pending_trigger_id: "T1" };
  const { c, posts, deletes } = client(r, []);
  const out = await handleReleaseReservation(c as any, {
    service: "cards",
    environment: "staging",
    requester: "U1",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "x", config });
  assertEquals(deletes.includes("cards-stg"), true);
  assertStringIncludes(posts[0], "liberou");
  assertStringIncludes(out.status, "liberado");
});

Deno.test("nao-dono nao libera", async () => {
  const r = { resource: "cards-stg", owner: "U1", token: "t", pending_trigger_id: "" };
  const { c, posts } = client(r, []);
  await handleReleaseReservation(c as any, {
    service: "cards",
    environment: "staging",
    requester: "U2",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "x", config });
  assertStringIncludes(posts[0], "Apenas quem reservou");
});

Deno.test("promocao usa o env do contexto quando config nao e informado", async () => {
  const r = { resource: "cards-stg", owner: "U1", token: "t", pending_trigger_id: "T1" };
  const q = [{ id: "w1", resource: "cards-stg", user: "U2", requested_at: 10 }];
  const { c, puts } = client(r, q);
  await handleReleaseReservation(c as any, {
    service: "cards",
    environment: "staging",
    requester: "U1",
    channel: "C1",
  }, {
    nowSec: 1000,
    genId: () => "x",
    env: { DIBS_TIMEZONE: "America/New_York", DIBS_BUSINESS_END_HOUR: "20" },
  });
  assertEquals(puts[0].owner, "U2");
  assertEquals(puts[0].expires_at, endOfBusinessDaySec(1000, "America/New_York", 20));
});

Deno.test("recurso inexistente avisa", async () => {
  const { c, posts } = client(null, []);
  await handleReleaseReservation(c as any, {
    service: "cards",
    environment: "staging",
    requester: "U2",
    channel: "C1",
  }, { nowSec: 1000, genId: () => "x", config });
  assertStringIncludes(posts[0], "Não há reserva");
});
