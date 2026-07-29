import { computeExpiresAt } from "./time.ts";
import { BUSINESS_END_HOUR, type Reservation, TZ } from "./types.ts";

export const EXTEND_SECONDS: Record<string, number> = {
  "30m": 30 * 60,
  "1h": 60 * 60,
  "2h": 2 * 60 * 60,
};

export const ENV_SHORT: Record<string, string> = {
  development: "dev",
  staging: "stg",
  production: "prod",
};

export function resourceKey(service: string, environment: string): string {
  const short = ENV_SHORT[environment.trim().toLowerCase()] ?? "stg";
  return `${service.trim().toLowerCase()}-${short}`;
}

export function buildReservation(p: {
  service: string;
  environment: string;
  owner: string;
  startedAt: number;
  duration: string;
  note?: string;
  token: string;
  tz?: string;
  endHour?: number;
}): Reservation {
  return {
    resource: resourceKey(p.service, p.environment),
    service: p.service.trim(),
    environment: p.environment,
    owner: p.owner,
    started_at: p.startedAt,
    expires_at: computeExpiresAt(
      p.startedAt,
      p.duration,
      p.tz ?? TZ,
      p.endHour ?? BUSINESS_END_HOUR,
    ),
    note: p.note ?? "",
    reminders_sent: [],
    token: p.token,
    pending_trigger_id: "",
  };
}

export function canManage(r: Reservation | null, userId: string): boolean {
  return !!r && r.owner === userId;
}

export function applyExtend(r: Reservation, extraSec: number, nowSec: number): Reservation {
  const expires_at = r.expires_at + extraSec;
  const reminders_sent = r.reminders_sent.filter((m) => expires_at - nowSec <= m * 60);
  return { ...r, expires_at, reminders_sent };
}
