import { assertOk } from "./slack_api.ts";
import { TZ } from "./types.ts";

// deno-lint-ignore no-explicit-any
export type TriggerClient = any;

export function isoFromDelay(nowSec: number, delaySec: number): string {
  return new Date((nowSec + delaySec) * 1000).toISOString();
}

export async function scheduleTick(
  client: TriggerClient,
  p: { resource: string; token: string; channel: string; nowSec: number; delaySec: number },
): Promise<string> {
  const res = await client.workflows.triggers.create({
    type: "scheduled",
    name: `open-dibs-on-stuff tick ${p.resource}`,
    workflow: "#/workflows/tick_workflow",
    inputs: {
      resource: { value: p.resource },
      token: { value: p.token },
      channel: { value: p.channel },
    },
    schedule: {
      start_time: isoFromDelay(p.nowSec, p.delaySec),
      timezone: TZ,
      frequency: { type: "once" },
    },
  });
  assertOk(res, "workflows.triggers.create");
  return res.trigger.id as string;
}

export async function cancelTrigger(client: TriggerClient, triggerId: string): Promise<void> {
  if (!triggerId) return;
  const res = await client.workflows.triggers.delete({ trigger_id: triggerId });
  // Best-effort cleanup: a tick that already fired leaves a stale id behind, and failing the
  // whole release over an already-gone trigger would be worse than ignoring it.
  if (typeof res?.error === "string" && res.error.includes("not_found")) return;
  assertOk(res, "workflows.triggers.delete");
}
