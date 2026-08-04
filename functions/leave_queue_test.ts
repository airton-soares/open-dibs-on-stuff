// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { handleLeaveQueue } from "./leave_queue.ts";

function client(queue: any[] = [], postResult: any = { ok: true }) {
  const ephemeral: any[] = [];
  const posts: string[] = [];
  const deleted: string[] = [];
  const c = {
    apps: {
      datastore: {
        query: () => Promise.resolve({ ok: true, items: queue.slice() }),
        delete: (a: any) => {
          deleted.push(a.id);
          return Promise.resolve({ ok: true });
        },
      },
    },
    chat: {
      postEphemeral: (a: any) => {
        ephemeral.push(a);
        return Promise.resolve(postResult);
      },
      postMessage: (a: any) => {
        posts.push(a.text);
        return Promise.resolve({ ok: true });
      },
    },
  };
  return { c, ephemeral, posts, deleted };
}

const inputs = {
  service: "cards",
  environment: "staging",
  requester: "U1",
  channel: "C1",
};

Deno.test("sai da fila e avisa so quem pediu", async () => {
  const { c, ephemeral, posts, deleted } = client([
    { id: "w1", resource: "cards-stg", user: "U2", requested_at: 500 },
    { id: "w2", resource: "cards-stg", user: "U1", requested_at: 600 },
  ]);
  const out = await handleLeaveQueue(c as any, inputs);
  assertEquals(deleted, ["w2"]);
  assertEquals(posts.length, 0);
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].channel, "C1");
  assertEquals(ephemeral[0].user, "U1");
  assertStringIncludes(ephemeral[0].text, "saiu da fila");
  assertStringIncludes(ephemeral[0].text, "cards-stg");
  assertStringIncludes(out.status, "saiu da fila de cards-stg");
});

Deno.test("avisa quem nao esta na fila e nao remove nada", async () => {
  const { c, ephemeral, posts, deleted } = client([
    { id: "w1", resource: "cards-stg", user: "U2", requested_at: 500 },
  ]);
  const out = await handleLeaveQueue(c as any, inputs);
  assertEquals(deleted.length, 0);
  assertEquals(posts.length, 0);
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].user, "U1");
  assertStringIncludes(ephemeral[0].text, "não está na fila");
  assertStringIncludes(out.status, "nao esta na fila de cards-stg");
});

Deno.test("avisa quando a fila do recurso esta vazia", async () => {
  const { c, ephemeral, deleted } = client([]);
  await handleLeaveQueue(c as any, inputs);
  assertEquals(deleted.length, 0);
  assertStringIncludes(ephemeral[0].text, "não está na fila");
});

Deno.test("falha alto quando a leitura da fila falha", async () => {
  const { c, deleted } = client([]);
  c.apps.datastore.query = () => Promise.resolve({ ok: false, error: "datastore_error" } as any);
  await assertRejects(() => handleLeaveQueue(c as any, inputs), Error, "datastore_error");
  assertEquals(deleted.length, 0);
});

Deno.test("falha alto quando a remocao da fila falha", async () => {
  const { c } = client([{ id: "w2", resource: "cards-stg", user: "U1", requested_at: 600 }]);
  c.apps.datastore.delete = () => Promise.resolve({ ok: false, error: "datastore_error" } as any);
  await assertRejects(() => handleLeaveQueue(c as any, inputs), Error, "datastore_error");
});

Deno.test("explica como resolver quando o app nao esta no canal", async () => {
  for (const error of ["channel_not_found", "not_in_channel"]) {
    const { c } = client([], { ok: false, error });
    await assertRejects(
      () => handleLeaveQueue(c as any, inputs),
      Error,
      "/invite @open-dibs-on-stuff",
    );
  }
});
