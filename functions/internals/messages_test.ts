import { assertStringIncludes } from "@std/assert";
import { enqueuedMsg, notOwnerMsg, reminderMsg, reservedMsg, statusMsg } from "./messages.ts";
import type { Reservation } from "./types.ts";

function res(over: Partial<Reservation> = {}): Reservation {
  return {
    resource: "cards-stg",
    service: "cards",
    environment: "staging",
    owner: "U1",
    started_at: 0,
    expires_at: 7200,
    note: "",
    reminders_sent: [],
    token: "t",
    pending_trigger_id: "",
    ...over,
  };
}

Deno.test("reservedMsg menciona dono e recurso", () => {
  const m = reservedMsg(res());
  assertStringIncludes(m, "<@U1>");
  assertStringIncludes(m, "cards-stg");
});

Deno.test("enqueuedMsg informa a posicao", () => {
  assertStringIncludes(enqueuedMsg("cards-stg", "U2", 2), "2");
});

Deno.test("reminderMsg cita minutos restantes e como estender", () => {
  const m = reminderMsg(res(), 10);
  assertStringIncludes(m, "10");
  assertStringIncludes(m, "<@U1>");
});

Deno.test("statusMsg lista reservas e diz quando nao ha nada", () => {
  assertStringIncludes(statusMsg([], {}), "Nenhum");
  assertStringIncludes(statusMsg([res()], {}), "cards-stg");
});

Deno.test("notOwnerMsg avisa que so o dono libera", () => {
  assertStringIncludes(notOwnerMsg("cards-stg"), "cards-stg");
});
