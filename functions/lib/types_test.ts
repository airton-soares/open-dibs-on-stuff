import { assertEquals } from "@std/assert";
import {
  BUSINESS_END_HOUR,
  DEFAULT_DURATION,
  ENVIRONMENTS,
  REMINDER_MARKERS,
  TZ,
} from "./types.ts";

Deno.test("constantes de dominio", () => {
  assertEquals([...REMINDER_MARKERS], [60, 30, 10]);
  assertEquals(TZ, "America/Sao_Paulo");
  assertEquals(BUSINESS_END_HOUR, 18);
  assertEquals(DEFAULT_DURATION, "eob");
  assertEquals([...ENVIRONMENTS], ["development", "staging", "production"]);
});
