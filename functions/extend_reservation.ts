import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  applyExtend,
  canManage,
  EXTEND_SECONDS,
  nextEventDelaySec,
  resourceKey,
} from "./internals/domain.ts";
import { getReservation, putReservation } from "./internals/reservations_repo.ts";
import { cancelTrigger, scheduleTick } from "./internals/scheduling.ts";
import { extendedMsg, notFoundMsg, notOwnerMsg } from "./internals/messages.ts";
import { assertOk } from "./internals/slack_api.ts";
import { t } from "./internals/i18n/mod.ts";

export const ExtendReservationDefinition = DefineFunction({
  callback_id: "extend_reservation",
  title: t("fn.extendReservation"),
  source_file: "functions/extend_reservation.ts",
  input_parameters: {
    properties: {
      service: { type: Schema.types.string },
      environment: { type: Schema.types.string },
      extra: { type: Schema.types.string },
      requester: { type: Schema.slack.types.user_id },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["service", "environment", "extra", "requester", "channel"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

interface Inputs {
  service: string;
  environment: string;
  extra: string;
  requester: string;
  channel: string;
}

export async function handleExtendReservation(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: Inputs,
  opts?: { nowSec?: number },
): Promise<{ status: string }> {
  const nowSec = opts?.nowSec ?? Math.floor(Date.now() / 1000);
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

  const extraSec = EXTEND_SECONDS[inputs.extra];
  if (extraSec === undefined) return { status: `extra invalido: ${inputs.extra}` };

  const extended = applyExtend(reservation, extraSec, nowSec);
  await cancelTrigger(client, reservation.pending_trigger_id);
  const delay = nextEventDelaySec(extended.expires_at, nowSec, extended.reminders_sent);
  extended.pending_trigger_id = await scheduleTick(client, {
    resource,
    token: extended.token,
    channel: inputs.channel,
    nowSec,
    delaySec: delay ?? 60,
  });
  await putReservation(client, extended);
  await post(extendedMsg(extended));
  return { status: `${resource} estendido` };
}

export default SlackFunction(
  ExtendReservationDefinition,
  async ({ inputs, client }) => {
    try {
      const status = await handleExtendReservation(client, inputs as Inputs);
      return { outputs: status };
    } catch (e) {
      return { error: `extend_reservation falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
