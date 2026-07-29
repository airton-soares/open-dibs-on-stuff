export interface Reservation {
  resource: string;
  service: string;
  environment: string;
  owner: string;
  started_at: number;
  expires_at: number;
  note: string;
  reminders_sent: number[];
  token: string;
  pending_trigger_id: string;
}

export interface WaitlistEntry {
  id: string;
  resource: string;
  user: string;
  requested_at: number;
}

export const REMINDER_MARKERS = [60, 30, 10] as const;
export const TZ = "America/Sao_Paulo";
export const BUSINESS_END_HOUR = 18;
export const DEFAULT_DURATION = "eob";
export const ENVIRONMENTS = ["development", "staging", "production"] as const;
