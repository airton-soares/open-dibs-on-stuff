import { BUSINESS_END_HOUR, TZ } from "./types.ts";

export interface DibsConfig {
  tz: string;
  businessEndHour: number;
}

export type EnvVars = Record<string, string | undefined>;

export function loadConfig(env: EnvVars = {}): DibsConfig {
  const tz = env["DIBS_TIMEZONE"] ?? TZ;
  const raw = env["DIBS_BUSINESS_END_HOUR"];
  const parsed = raw === undefined ? NaN : Number(raw);
  const businessEndHour = Number.isInteger(parsed) && parsed >= 0 && parsed <= 23
    ? parsed
    : BUSINESS_END_HOUR;
  return { tz, businessEndHour };
}
