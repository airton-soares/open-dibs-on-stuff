import { BUSINESS_END_HOUR, TZ } from "./types.ts";

export interface DibsConfig {
  tz: string;
  businessEndHour: number;
}

export interface EnvReader {
  get(key: string): string | undefined;
}

export function loadConfig(env: EnvReader = Deno.env): DibsConfig {
  const tz = env.get("DIBS_TIMEZONE") ?? TZ;
  const raw = env.get("DIBS_BUSINESS_END_HOUR");
  const parsed = raw === undefined ? NaN : Number(raw);
  const businessEndHour = Number.isInteger(parsed) && parsed >= 0 && parsed <= 23
    ? parsed
    : BUSINESS_END_HOUR;
  return { tz, businessEndHour };
}
