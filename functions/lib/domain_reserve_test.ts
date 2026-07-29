import { assertEquals } from "@std/assert";
import { applyExtend, buildReservation, canManage, EXTEND_SECONDS, resourceKey } from "./domain.ts";
import type { Reservation } from "./types.ts";

Deno.test("resourceKey usa sufixo curto do ambiente e normaliza", () => {
  assertEquals(resourceKey("Cards", "staging"), "cards-stg");
  assertEquals(resourceKey(" billing ", "production"), "billing-prod");
  assertEquals(resourceKey("cards", "development"), "cards-dev");
});

Deno.test("buildReservation monta a reserva com token e reminders vazio", () => {
  const r = buildReservation({
    service: "cards",
    environment: "staging",
    owner: "U1",
    startedAt: 1000,
    duration: "2h",
    note: "teste",
    token: "tok-1",
  });
  assertEquals(r.resource, "cards-stg");
  assertEquals(r.expires_at, 1000 + 7200);
  assertEquals(r.reminders_sent, []);
  assertEquals(r.token, "tok-1");
  assertEquals(r.pending_trigger_id, "");
  assertEquals(r.note, "teste");
});

Deno.test("buildReservation com eob respeita tz e endHour", () => {
  const noonSP = Date.UTC(2026, 6, 29, 15, 0, 0) / 1000;
  const r = buildReservation({
    service: "cards",
    environment: "staging",
    owner: "U1",
    startedAt: noonSP,
    duration: "eob",
    token: "t",
    tz: "America/Sao_Paulo",
    endHour: 17,
  });
  assertEquals(r.expires_at, Date.UTC(2026, 6, 29, 20, 0, 0) / 1000);
});

Deno.test("canManage so aprova o dono", () => {
  const r = { owner: "U1" } as Reservation;
  assertEquals(canManage(r, "U1"), true);
  assertEquals(canManage(r, "U2"), false);
  assertEquals(canManage(null, "U1"), false);
});

Deno.test("applyExtend soma tempo e recalcula reminders_sent", () => {
  const r = {
    expires_at: 10_000,
    reminders_sent: [60, 30, 10],
  } as Reservation;
  const extended = applyExtend(r, 3600, 10_000 - 5 * 60);
  assertEquals(extended.expires_at, 13_600);
  assertEquals(extended.reminders_sent, []);
});

Deno.test("EXTEND_SECONDS tem as opcoes de extensao", () => {
  assertEquals(EXTEND_SECONDS["30m"], 1800);
  assertEquals(EXTEND_SECONDS["1h"], 3600);
  assertEquals(EXTEND_SECONDS["2h"], 7200);
});
