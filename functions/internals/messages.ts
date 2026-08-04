import type { Reservation, WaitlistEntry } from "./types.ts";
import { LOCALE, type Locale, t } from "./i18n/mod.ts";

function when(epoch: number): string {
  return `<!date^${epoch}^{date_short_pretty} {time}|${new Date(epoch * 1000).toISOString()}>`;
}

function queuePosition(position: number, total: number, locale: Locale): string {
  return t("msg.queue.position", { position, total }, locale);
}

export function reservedMsg(r: Reservation, locale: Locale = LOCALE): string {
  return t("msg.reserved", {
    owner: r.owner,
    resource: r.resource,
    when: when(r.expires_at),
    note: r.note ? ` (${r.note})` : "",
  }, locale);
}

export function enqueuedMsg(
  resource: string,
  user: string,
  position: number,
  total: number,
  locale: Locale = LOCALE,
): string {
  return t("msg.queue.joined", {
    user,
    resource,
    position: queuePosition(position, total, locale),
  }, locale);
}

export function alreadyOwnerMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.queue.alreadyOwner", { resource }, locale);
}

export function alreadyQueuedMsg(
  resource: string,
  position: number,
  total: number,
  locale: Locale = LOCALE,
): string {
  return t("msg.queue.alreadyQueued", {
    resource,
    position: queuePosition(position, total, locale),
  }, locale);
}

export function leftQueueMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.queue.left", { resource }, locale);
}

export function notInQueueMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.queue.notIn", { resource }, locale);
}

export function releasedMsg(resource: string, user: string, locale: Locale = LOCALE): string {
  return t("msg.released", { resource, user }, locale);
}

export function expiredMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.expired", { resource }, locale);
}

export function promotedMsg(r: Reservation, locale: Locale = LOCALE): string {
  return t("msg.promoted", {
    owner: r.owner,
    resource: r.resource,
    when: when(r.expires_at),
  }, locale);
}

export function reminderMsg(r: Reservation, marker: number, locale: Locale = LOCALE): string {
  return t("msg.reminder", {
    resource: r.resource,
    minutes: marker,
    shortcut: t("action.extend", {}, locale),
    service: r.service,
    environment: r.environment,
  }, locale);
}

export function extendedMsg(r: Reservation, locale: Locale = LOCALE): string {
  return t("msg.extended", {
    owner: r.owner,
    resource: r.resource,
    when: when(r.expires_at),
  }, locale);
}

export function notOwnerMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.notOwner", { resource }, locale);
}

export function notFoundMsg(resource: string, locale: Locale = LOCALE): string {
  return t("msg.notFound", { resource }, locale);
}

export function statusMsg(
  reservations: Reservation[],
  queues: Record<string, WaitlistEntry[]>,
  locale: Locale = LOCALE,
): string {
  if (reservations.length === 0) return t("msg.status.empty", {}, locale);
  const lines = reservations
    .slice()
    .sort((a, b) => a.resource.localeCompare(b.resource))
    .map((r) => {
      const q = queues[r.resource] ?? [];
      const queue = q.length
        ? t("msg.status.queue", { users: q.map((e) => `<@${e.user}>`).join(", ") }, locale)
        : "";
      return t("msg.status.line", {
        resource: r.resource,
        owner: r.owner,
        when: when(r.expires_at),
        queue,
      }, locale);
    });
  return `${t("msg.status.header", {}, locale)}\n${lines.join("\n")}`;
}
