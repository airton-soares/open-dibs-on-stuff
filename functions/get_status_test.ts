// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { handleGetStatus } from "./get_status.ts";

function client(reservations: any[], waitlist: any[] = [], postResult: any = { ok: true }) {
  const ephemeral: any[] = [];
  const posts: string[] = [];
  const c = {
    apps: {
      datastore: {
        query: (a: any) =>
          a.datastore === "reservations"
            ? Promise.resolve({ ok: true, items: reservations })
            : Promise.resolve({ ok: true, items: waitlist }),
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
  return { c, ephemeral, posts };
}

Deno.test("status lista reservas ativas so para quem pediu", async () => {
  const { c, ephemeral, posts } = client([{
    resource: "cards-stg",
    owner: "U1",
    expires_at: 7200,
  }]);
  const out = await handleGetStatus(c as any, { channel: "C1", user: "U9" });
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].channel, "C1");
  assertEquals(ephemeral[0].user, "U9");
  assertStringIncludes(ephemeral[0].text, "cards-stg");
  assertEquals(posts.length, 0);
  assertStringIncludes(out.status, "1 reservas");
});

Deno.test("status responde mesmo sem nenhum recurso reservado", async () => {
  const { c, ephemeral } = client([]);
  const out = await handleGetStatus(c as any, { channel: "C1", user: "U9" });
  assertEquals(ephemeral.length, 1);
  assertEquals(ephemeral[0].user, "U9");
  assertStringIncludes(ephemeral[0].text, "Nenhum recurso reservado");
  assertStringIncludes(out.status, "0 reservas");
});

Deno.test("status mostra quantas e quais pessoas estao na fila de cada recurso", async () => {
  const { c, ephemeral } = client(
    [{ resource: "cards-stg", owner: "U1", expires_at: 7200 }],
    [
      { id: "w2", resource: "cards-stg", user: "U3", requested_at: 20 },
      { id: "w1", resource: "cards-stg", user: "U2", requested_at: 10 },
    ],
  );
  await handleGetStatus(c as any, { channel: "C1", user: "U9" });
  assertStringIncludes(ephemeral[0].text, "fila (2)");
  assertStringIncludes(ephemeral[0].text, "1. <@U2> · 2. <@U3>");
});

Deno.test("status diz que a fila esta vazia quando ninguem espera o recurso", async () => {
  const { c, ephemeral } = client([{ resource: "cards-stg", owner: "U1", expires_at: 7200 }]);
  await handleGetStatus(c as any, { channel: "C1", user: "U9" });
  assertStringIncludes(ephemeral[0].text, "fila vazia");
});

Deno.test("status falha alto quando a API recusa a mensagem", async () => {
  const { c } = client([], [], { ok: false, error: "ratelimited" });
  await assertRejects(
    () => handleGetStatus(c as any, { channel: "C1", user: "U9" }),
    Error,
    "ratelimited",
  );
});

Deno.test("status explica como resolver quando o app nao esta no canal", async () => {
  for (const error of ["channel_not_found", "not_in_channel"]) {
    const { c } = client([], [], { ok: false, error });
    await assertRejects(
      () => handleGetStatus(c as any, { channel: "C1", user: "U9" }),
      Error,
      "/invite @open-dibs-on-stuff",
    );
  }
});
