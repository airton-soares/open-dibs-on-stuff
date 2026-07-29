import { BUSINESS_END_HOUR, TZ } from "./types.ts";

export const DURATION_SECONDS: Record<string, number> = {
  "30m": 30 * 60,
  "1h": 60 * 60,
  "2h": 2 * 60 * 60,
  "4h": 4 * 60 * 60,
};

export function localSecondsOfDay(epochSec: number, tz: string = TZ): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(epochSec * 1000)).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) % 24;
  return hour * 3600 + Number(parts.minute) * 60 + Number(parts.second);
}

export function endOfBusinessDaySec(
  nowSec: number,
  tz: string = TZ,
  endHour: number = BUSINESS_END_HOUR,
): number {
  const target = endHour * 3600;
  const deltaToday = target - localSecondsOfDay(nowSec, tz);
  return deltaToday > 0 ? nowSec + deltaToday : nowSec + deltaToday + 86400;
}

export function computeExpiresAt(
  startedAtSec: number,
  duration: string,
  tz: string = TZ,
  endHour: number = BUSINESS_END_HOUR,
): number {
  if (duration === "eob") return endOfBusinessDaySec(startedAtSec, tz, endHour);
  const secs = DURATION_SECONDS[duration];
  if (secs === undefined) throw new Error(`invalid duration: ${duration}`);
  return startedAtSec + secs;
}
