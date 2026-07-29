import { assertEquals } from "@std/assert";
import { loadConfig } from "./config.ts";
import { BUSINESS_END_HOUR, TZ } from "./types.ts";

function env(vars: Record<string, string>) {
  return { get: (k: string) => vars[k] };
}

Deno.test("loadConfig usa defaults quando env vazio", () => {
  const c = loadConfig(env({}));
  assertEquals(c.tz, TZ);
  assertEquals(c.businessEndHour, BUSINESS_END_HOUR);
});

Deno.test("loadConfig le env vars sobrepostas", () => {
  const c = loadConfig(env({ DIBS_TIMEZONE: "America/New_York", DIBS_BUSINESS_END_HOUR: "17" }));
  assertEquals(c.tz, "America/New_York");
  assertEquals(c.businessEndHour, 17);
});

Deno.test("loadConfig ignora hora invalida e usa default", () => {
  assertEquals(
    loadConfig(env({ DIBS_BUSINESS_END_HOUR: "abc" })).businessEndHour,
    BUSINESS_END_HOUR,
  );
  assertEquals(
    loadConfig(env({ DIBS_BUSINESS_END_HOUR: "25" })).businessEndHour,
    BUSINESS_END_HOUR,
  );
  assertEquals(
    loadConfig(env({ DIBS_BUSINESS_END_HOUR: "-1" })).businessEndHour,
    BUSINESS_END_HOUR,
  );
});
