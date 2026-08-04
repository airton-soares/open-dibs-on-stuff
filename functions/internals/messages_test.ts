import { assertEquals, assertStringIncludes } from "@std/assert";
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
import type { Reservation, WaitlistEntry } from "./types.ts";

function entry(user: string, requested_at: number): WaitlistEntry {
  return { id: `w-${user}`, resource: "cards-stg", user, requested_at };
}

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

Deno.test("reminderMsg cita minutos restantes sem mencionar o dono", () => {
  const m = reminderMsg(res(), 10);
  assertStringIncludes(m, "10");
  assertStringIncludes(m, "Sua reserva");
  assertEquals(m.includes("<@U1>"), false);
});

Deno.test("statusMsg lista reservas e diz quando nao ha nada", () => {
  assertStringIncludes(statusMsg([], {}), "Nenhum");
  assertStringIncludes(statusMsg([res()], {}), "cards-stg");
});

Deno.test("statusMsg mostra o tamanho da fila e quem esta nela, na ordem de chegada", () => {
  const m = statusMsg([res()], {
    "cards-stg": [entry("U3", 20), entry("U2", 10), entry("U4", 30)],
  });
  assertStringIncludes(m, "fila (3)");
  assertStringIncludes(m, "1. <@U2> · 2. <@U3> · 3. <@U4>");
});

Deno.test("statusMsg avisa quando o recurso reservado nao tem ninguem na fila", () => {
  assertStringIncludes(statusMsg([res()], { "cards-stg": [] }), "fila vazia");
  assertStringIncludes(statusMsg([res()], {}), "fila vazia");
});

Deno.test("statusMsg mostra a fila de cada recurso separadamente", () => {
  const m = statusMsg(
    [res(), res({ resource: "billing-prod", owner: "U9" })],
    {
      "cards-stg": [entry("U2", 10)],
      "billing-prod": [entry("U5", 5), entry("U6", 6)],
    },
  );
  assertStringIncludes(m, "*billing-prod*: <@U9>");
  assertStringIncludes(m, "fila (2): 1. <@U5> · 2. <@U6>");
  assertStringIncludes(m, "fila (1): 1. <@U2>");
});

Deno.test("as mensagens saem no idioma pedido", () => {
  assertStringIncludes(enqueuedMsg("cards-stg", "U2", 1, 2, "en"), "joined the queue");
  assertStringIncludes(leftQueueMsg("cards-stg", "en"), "You left the queue");
  assertStringIncludes(alreadyOwnerMsg("cards-stg", "en"), "You already hold");
  assertStringIncludes(statusMsg([res()], {}, "en"), "Active reservations");
  assertStringIncludes(statusMsg([res()], {}, "en"), "empty queue");
  assertStringIncludes(
    statusMsg([res()], { "cards-stg": [entry("U2", 10)] }, "en"),
    "queue (1): 1. <@U2>",
  );
  assertStringIncludes(reminderMsg(res(), 10, "en"), "expires in 10 min");
});

Deno.test("notOwnerMsg avisa que so o dono libera", () => {
  assertStringIncludes(notOwnerMsg("cards-stg"), "cards-stg");
});
