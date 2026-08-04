import { assertStringIncludes } from "@std/assert";
import {
  alreadyOwnerMsg,
  alreadyQueuedMsg,
  enqueuedMsg,
  leftQueueMsg,
  notInQueueMsg,
  notOwnerMsg,
  reminderMsg,
  reservedMsg,
  statusMsg,
} from "./messages.ts";
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

Deno.test("enqueuedMsg informa a posicao e o tamanho da fila", () => {
  const m = enqueuedMsg("cards-stg", "U2", 2, 3);
  assertStringIncludes(m, "<@U2>");
  assertStringIncludes(m, "cards-stg");
  assertStringIncludes(m, "sua posição é a 2 em uma fila de tamanho 3");
});

Deno.test("alreadyOwnerMsg diz que o recurso ja e de quem pediu", () => {
  assertStringIncludes(alreadyOwnerMsg("cards-stg"), "cards-stg");
  assertStringIncludes(alreadyOwnerMsg("cards-stg"), "já está com");
});

Deno.test("alreadyQueuedMsg repete a posicao na fila", () => {
  const m = alreadyQueuedMsg("cards-stg", 1, 2);
  assertStringIncludes(m, "já está na fila");
  assertStringIncludes(m, "sua posição é a 1 em uma fila de tamanho 2");
});

Deno.test("leftQueueMsg confirma a saida da fila", () => {
  assertStringIncludes(leftQueueMsg("cards-stg"), "saiu da fila");
  assertStringIncludes(leftQueueMsg("cards-stg"), "cards-stg");
});

Deno.test("notInQueueMsg avisa que a pessoa nao esta na fila", () => {
  assertStringIncludes(notInQueueMsg("cards-stg"), "não está na fila");
  assertStringIncludes(notInQueueMsg("cards-stg"), "cards-stg");
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
