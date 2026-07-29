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
  return res.trigger.id as string;
}

export async function cancelTrigger(client: TriggerClient, triggerId: string): Promise<void> {
  if (!triggerId) return;
  await client.workflows.triggers.delete({ trigger_id: triggerId });
}
