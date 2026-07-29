import { assertEquals, assertThrows } from "@std/assert";
import { computeExpiresAt, DURATION_SECONDS } from "./time.ts";

Deno.test("computeExpiresAt soma duracao fixa", () => {
  assertEquals(computeExpiresAt(1000, "30m"), 1000 + 1800);
  assertEquals(computeExpiresAt(1000, "1h"), 1000 + 3600);
  assertEquals(computeExpiresAt(1000, "2h"), 1000 + 7200);
  assertEquals(computeExpiresAt(1000, "4h"), 1000 + 14400);
});

Deno.test("computeExpiresAt rejeita duracao invalida", () => {
  assertThrows(() => computeExpiresAt(1000, "3h"));
});

Deno.test("eob: antes das 18:00 expira as 18:00 do mesmo dia (America/Sao_Paulo, UTC-3)", () => {
  const noonSP = Date.UTC(2026, 6, 29, 15, 0, 0) / 1000;
  const eob = computeExpiresAt(noonSP, "eob");
  assertEquals(eob, Date.UTC(2026, 6, 29, 21, 0, 0) / 1000);
});

Deno.test("eob: depois das 18:00 expira as 18:00 do dia seguinte", () => {
  const eveningSP = Date.UTC(2026, 6, 29, 22, 0, 0) / 1000;
  const eob = computeExpiresAt(eveningSP, "eob");
  assertEquals(eob, Date.UTC(2026, 6, 30, 21, 0, 0) / 1000);
});

Deno.test("eob respeita endHour e tz configurados", () => {
  const noonSP = Date.UTC(2026, 6, 29, 15, 0, 0) / 1000;
  assertEquals(
    computeExpiresAt(noonSP, "eob", "America/Sao_Paulo", 17),
    Date.UTC(2026, 6, 29, 20, 0, 0) / 1000,
  );
});

Deno.test("DURATION_SECONDS mapeia as opcoes fixas", () => {
  assertEquals(Object.keys(DURATION_SECONDS).sort(), ["1h", "2h", "30m", "4h"]);
});
