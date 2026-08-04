import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { canManage, resourceKey } from "./internals/domain.ts";
import { deleteReservation, getReservation } from "./internals/reservations_repo.ts";
import { cancelTrigger } from "./internals/scheduling.ts";
import { promoteNext } from "./internals/promote.ts";
import { notFoundMsg, notOwnerMsg, releasedMsg } from "./internals/messages.ts";
import { assertOk } from "./internals/slack_api.ts";
import { type DibsConfig, type EnvVars, loadConfig } from "./internals/config.ts";

export const ReleaseReservationDefinition = DefineFunction({
  callback_id: "release_reservation",
  title: "Liberar reserva",
  source_file: "functions/release_reservation.ts",
  input_parameters: {
    properties: {
      service: { type: Schema.types.string },
      environment: { type: Schema.types.string },
      requester: { type: Schema.slack.types.user_id },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["service", "environment", "requester", "channel"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

interface Inputs {
  service: string;
  environment: string;
  requester: string;
  channel: string;
}

export async function handleReleaseReservation(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: Inputs,
  opts?: { nowSec?: number; genId?: () => string; config?: DibsConfig; env?: EnvVars },
): Promise<{ status: string }> {
  const nowSec = opts?.nowSec ?? Math.floor(Date.now() / 1000);
  const genId = opts?.genId ?? (() => crypto.randomUUID());
  const config = opts?.config ?? loadConfig(opts?.env);
  const resource = resourceKey(inputs.service, inputs.environment);
  const post = async (text: string) => {
    const res = await client.chat.postMessage({ channel: inputs.channel, text });
    assertOk(res, "chat.postMessage");
  };

  const reservation = await getReservation(client, resource);
  if (!reservation) {
    await post(notFoundMsg(resource));
    return { status: `${resource} inexistente` };
  }
  if (!canManage(reservation, inputs.requester)) {
    await post(notOwnerMsg(resource));
    return { status: `${resource} nao pertence a ${inputs.requester}` };
  }

  await cancelTrigger(client, reservation.pending_trigger_id);
  await deleteReservation(client, resource);
  await post(releasedMsg(resource, inputs.requester));
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
    resource,
  );
  return { status: `${resource} liberado` };
}

export default SlackFunction(
  ReleaseReservationDefinition,
  async ({ inputs, client, env }) => {
    try {
      const status = await handleReleaseReservation(client, inputs as Inputs, { env });
      return { outputs: status };
    } catch (e) {
      return { error: `release_reservation falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
