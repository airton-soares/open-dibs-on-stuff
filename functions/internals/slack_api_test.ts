import { assertThrows } from "@std/assert";
import { assertOk } from "./slack_api.ts";

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
