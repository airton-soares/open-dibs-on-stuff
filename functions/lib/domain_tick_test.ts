import { assertEquals } from "@std/assert";
import { decideTick, dueReminders, nextEventDelaySec } from "./domain.ts";
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
    token: "tok",
    pending_trigger_id: "",
    ...over,
  };
}

Deno.test("dueReminders retorna marcos atingidos e nao enviados", () => {
  assertEquals(dueReminders(7200, 7200 - 25 * 60, []), [60, 30]);
  assertEquals(dueReminders(7200, 7200 - 25 * 60, [60]), [30]);
  assertEquals(dueReminders(7200, 7200 - 65 * 60, []), []);
});

Deno.test("nextEventDelaySec pega o proximo evento futuro e faz clamp em 60s", () => {
  assertEquals(nextEventDelaySec(7200, 7200 - 90 * 60, []), 1800);
  assertEquals(nextEventDelaySec(7200, 7200 - 5 * 60, [60, 30, 10]), 300);
  assertEquals(nextEventDelaySec(7200, 7200 - 10, [60, 30, 10]), 60);
  assertEquals(nextEventDelaySec(7200, 7200, [60, 30, 10]), null);
});

Deno.test("decideTick: stale quando reserva ausente ou token diferente", () => {
  assertEquals(decideTick(null, "tok", 0).kind, "stale");
  assertEquals(decideTick(res({ token: "outro" }), "tok", 0).kind, "stale");
});

Deno.test("decideTick: expira quando now >= expires_at", () => {
  assertEquals(decideTick(res({ expires_at: 100 }), "tok", 100).kind, "expire");
});

Deno.test("decideTick: lembra e reagenda", () => {
  const d = decideTick(res({ expires_at: 7200 }), "tok", 7200 - 30 * 60);
  assertEquals(d.kind, "remind");
  if (d.kind === "remind") {
    assertEquals(d.markers, [60, 30]);
    assertEquals(d.remindersSentAfter, [60, 30]);
    assertEquals(d.nextDelaySec, 20 * 60);
  }
});
