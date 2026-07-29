import { buildReservation, ENV_SHORT, nextEventDelaySec } from "./domain.ts";
import { promotedMsg } from "./messages.ts";
import { putReservation } from "./reservations_repo.ts";
import { dequeue, queueFor } from "./waitlist_repo.ts";
import { scheduleTick } from "./scheduling.ts";
import { BUSINESS_END_HOUR, DEFAULT_DURATION, type Reservation, TZ } from "./types.ts";

export interface Ctx {
  // deno-lint-ignore no-explicit-any
  client: any;
  channel: string;
  nowSec: number;
  genId: () => string;
  postMessage: (text: string) => Promise<void>;
  tz?: string;
  businessEndHour?: number;
}

export async function promoteNext(ctx: Ctx, resource: string): Promise<Reservation | null> {
  const queue = await queueFor(ctx.client, resource);
  if (queue.length === 0) return null;
  const next = queue[0];
  await dequeue(ctx.client, next.id);

  const { service, environment } = splitResource(resource);
  const reservation = buildReservation({
    service,
    environment,
    owner: next.user,
    startedAt: ctx.nowSec,
    duration: DEFAULT_DURATION,
    token: ctx.genId(),
    tz: ctx.tz ?? TZ,
    endHour: ctx.businessEndHour ?? BUSINESS_END_HOUR,
  });

  const delay = nextEventDelaySec(reservation.expires_at, ctx.nowSec, reservation.reminders_sent);
  reservation.pending_trigger_id = await scheduleTick(ctx.client, {
    resource,
    token: reservation.token,
    channel: ctx.channel,
    nowSec: ctx.nowSec,
    delaySec: delay ?? 60,
  });
  await putReservation(ctx.client, reservation);
  await ctx.postMessage(promotedMsg(reservation));
  return reservation;
}

function splitResource(resource: string): { service: string; environment: string } {
  const idx = resource.lastIndexOf("-");
  const service = resource.slice(0, idx);
  const short = resource.slice(idx + 1);
  const environment = Object.entries(ENV_SHORT).find(([, s]) => s === short)?.[0] ?? "staging";
  return { service, environment };
}
