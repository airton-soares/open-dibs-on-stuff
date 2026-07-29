// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "@std/assert";
import { promoteNext } from "./promote.ts";
import type { WaitlistEntry } from "./types.ts";

function makeCtx(queue: WaitlistEntry[]) {
  const puts: any[] = [];
  const deletes: any[] = [];
  const posts: string[] = [];
  const created: any[] = [];
  const client = {
    apps: {
      datastore: {
        put: (a: any) => {
          puts.push(a.item);
          return Promise.resolve({ ok: true });
        },
        delete: (a: any) => {
          deletes.push(a.id);
          return Promise.resolve({ ok: true });
        },
        query: () => Promise.resolve({ ok: true, items: queue }),
        get: () => Promise.resolve({ ok: true, item: {} }),
      },
    },
    workflows: {
      triggers: {
        create: (a: any) => {
          created.push(a);
          return Promise.resolve({ ok: true, trigger: { id: "T" } });
        },
      },
    },
  };
  const ctx = {
    client,
    channel: "C1",
    nowSec: 1000,
    genId: () => "id-1",
    postMessage: (t: string) => {
      posts.push(t);
      return Promise.resolve();
    },
  };
  return { ctx, puts, deletes, posts, created };
}

Deno.test("promoteNext promove o primeiro da fila", async () => {
  const q: WaitlistEntry[] = [
    { id: "w1", resource: "cards-stg", user: "U2", requested_at: 100 },
    { id: "w2", resource: "cards-stg", user: "U3", requested_at: 200 },
  ];
  const { ctx, puts, deletes, posts } = makeCtx(q);
  const promoted = await promoteNext(ctx as any, "cards-stg");
  assertEquals(promoted?.owner, "U2");
  assertEquals(promoted?.resource, "cards-stg");
  assertEquals(deletes, ["w1"]);
  assertEquals(puts[0].owner, "U2");
  assertEquals(posts.length, 1);
});

Deno.test("promoteNext reverte o short para o ambiente correto", async () => {
  const q: WaitlistEntry[] = [
    { id: "w1", resource: "cards-prod", user: "U2", requested_at: 100 },
  ];
  const { ctx } = makeCtx(q);
  const promoted = await promoteNext(ctx as any, "cards-prod");
  assertEquals(promoted?.environment, "production");
  assertEquals(promoted?.resource, "cards-prod");
});

Deno.test("promoteNext retorna null com fila vazia", async () => {
  const { ctx } = makeCtx([]);
  assertEquals(await promoteNext(ctx as any, "cards-stg"), null);
});
