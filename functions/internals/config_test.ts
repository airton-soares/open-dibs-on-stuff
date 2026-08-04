import { assertEquals } from "@std/assert";
import { loadConfig } from "./config.ts";
import { BUSINESS_END_HOUR, TZ } from "./types.ts";

Deno.test("loadConfig usa defaults quando env vazio", () => {
  const c = loadConfig({});
  assertEquals(c.tz, TZ);
  assertEquals(c.businessEndHour, BUSINESS_END_HOUR);
});

Deno.test("loadConfig usa defaults quando env omitido", () => {
  const c = loadConfig();
  assertEquals(c.tz, TZ);
  assertEquals(c.businessEndHour, BUSINESS_END_HOUR);
});

Deno.test("loadConfig le env vars sobrepostas", () => {
  const c = loadConfig({ DIBS_TIMEZONE: "America/New_York", DIBS_BUSINESS_END_HOUR: "17" });
  assertEquals(c.tz, "America/New_York");
  assertEquals(c.businessEndHour, 17);
});

Deno.test("loadConfig ignora hora invalida e usa default", () => {
  assertEquals(
    loadConfig({ DIBS_BUSINESS_END_HOUR: "abc" }).businessEndHour,
    BUSINESS_END_HOUR,
  );
  assertEquals(
    loadConfig({ DIBS_BUSINESS_END_HOUR: "25" }).businessEndHour,
    BUSINESS_END_HOUR,
  );
  assertEquals(
    loadConfig({ DIBS_BUSINESS_END_HOUR: "-1" }).businessEndHour,
    BUSINESS_END_HOUR,
  );
});
