// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { assertOk, postEphemeral } from "./slack_api.ts";

Deno.test("assertOk passa quando ok e true", () => {
  assertOk({ ok: true }, "chat.postEphemeral");
});

Deno.test("assertOk lanca com o erro da API", () => {
  assertThrows(
    () => assertOk({ ok: false, error: "channel_not_found" }, "chat.postEphemeral"),
    Error,
    "channel_not_found",
  );
});

Deno.test("assertOk lanca quando a resposta nao tem ok", () => {
  assertThrows(() => assertOk({}, "chat.postEphemeral"), Error, "resposta sem ok");
  assertThrows(() => assertOk(undefined, "chat.postEphemeral"), Error, "resposta sem ok");
});

Deno.test("assertOk anexa a dica do erro correspondente", () => {
  assertThrows(
    () =>
      assertOk({ ok: false, error: "channel_not_found" }, "chat.postEphemeral", {
        channel_not_found: "Convide o app no canal.",
      }),
    Error,
    "channel_not_found. Convide o app no canal.",
  );
});

Deno.test("assertOk ignora dicas de outros erros", () => {
  assertThrows(
    () =>
      assertOk({ ok: false, error: "ratelimited" }, "chat.postEphemeral", {
        channel_not_found: "Convide o app no canal.",
      }),
    Error,
    "chat.postEphemeral falhou: ratelimited",
  );
});

Deno.test("postEphemeral envia a mensagem para o canal e usuario informados", async () => {
  const sent: any[] = [];
  const client = {
    chat: {
      postEphemeral: (a: any) => {
        sent.push(a);
        return Promise.resolve({ ok: true });
      },
    },
  };
  await postEphemeral(client, { channel: "C1", user: "U1", text: "oi" });
  assertEquals(sent, [{ channel: "C1", user: "U1", text: "oi" }]);
});

Deno.test("postEphemeral sugere o convite quando o app nao esta no canal", async () => {
  for (const error of ["channel_not_found", "not_in_channel"]) {
    const client = { chat: { postEphemeral: () => Promise.resolve({ ok: false, error }) } };
    await assertRejects(
      () => postEphemeral(client, { channel: "C1", user: "U1", text: "oi" }),
      Error,
      "/invite @open-dibs-on-stuff",
    );
  }
});
