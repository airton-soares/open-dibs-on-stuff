import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { decideTick } from "./internals/domain.ts";
import {
  deleteReservation,
  getReservation,
  putReservation,
} from "./internals/reservations_repo.ts";
import { cancelTrigger, scheduleTick } from "./internals/scheduling.ts";
import { promoteNext } from "./internals/promote.ts";
import { expiredMsg, reminderMsg } from "./internals/messages.ts";
import { assertOk } from "./internals/slack_api.ts";
import { type DibsConfig, type EnvVars, loadConfig } from "./internals/config.ts";

export const TickDefinition = DefineFunction({
  callback_id: "tick",
  title: "Tick de reserva",
  source_file: "functions/tick.ts",
  input_parameters: {
    properties: {
      resource: { type: Schema.types.string },
      token: { type: Schema.types.string },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["resource", "token", "channel"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

interface Inputs {
  resource: string;
  token: string;
  channel: string;
}

export async function handleTick(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: Inputs,
  opts?: { nowSec?: number; genId?: () => string; config?: DibsConfig; env?: EnvVars },
): Promise<{ status: string }> {
  const nowSec = opts?.nowSec ?? Math.floor(Date.now() / 1000);
  const genId = opts?.genId ?? (() => crypto.randomUUID());
  const config = opts?.config ?? loadConfig(opts?.env);
  const post = async (text: string) => {
    const res = await client.chat.postMessage({ channel: inputs.channel, text });
    assertOk(res, "chat.postMessage");
  };

  const reservation = await getReservation(client, inputs.resource);
  const decision = decideTick(reservation, inputs.token, nowSec);

  if (decision.kind === "stale") return { status: "tick obsoleto" };

  if (decision.kind === "expire") {
    await cancelTrigger(client, reservation!.pending_trigger_id);
    await deleteReservation(client, inputs.resource);
    await post(expiredMsg(inputs.resource));
    await promoteNext(
      {
        client,
        channel: inputs.channel,
        nowSec,
        genId,
        postMessage: post,
        tz: config.tz,
        businessEndHour: config.businessEndHour,
      },
      inputs.resource,
    );
    return { status: `${inputs.resource} expirado` };
  }

  const r = reservation!;
  for (const marker of decision.markers) await post(reminderMsg(r, marker));
  r.reminders_sent = decision.remindersSentAfter;
  r.pending_trigger_id = await scheduleTick(client, {
    resource: inputs.resource,
    token: r.token,
    channel: inputs.channel,
    nowSec,
    delaySec: decision.nextDelaySec,
  });
  await putReservation(client, r);
  return { status: `${inputs.resource} lembrete(s): ${decision.markers.join(",")}` };
}

export default SlackFunction(
  TickDefinition,
  async ({ inputs, client, env }) => {
    try {
      const status = await handleTick(client, inputs as Inputs, { env });
      return { outputs: status };
    } catch (e) {
      return { error: `tick falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
