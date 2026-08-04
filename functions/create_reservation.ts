import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { buildReservation, nextEventDelaySec, resourceKey } from "./internals/domain.ts";
import { getReservation, putReservation } from "./internals/reservations_repo.ts";
import { enqueue, queueFor } from "./internals/waitlist_repo.ts";
import { scheduleTick } from "./internals/scheduling.ts";
import {
  alreadyOwnerMsg,
  alreadyQueuedMsg,
  enqueuedMsg,
  reservedMsg,
} from "./internals/messages.ts";
import { assertOk, postEphemeral } from "./internals/slack_api.ts";
import { type DibsConfig, type EnvVars, loadConfig } from "./internals/config.ts";

export const CreateReservationDefinition = DefineFunction({
  callback_id: "create_reservation",
  title: "Criar reserva",
  source_file: "functions/create_reservation.ts",
  input_parameters: {
    properties: {
      service: { type: Schema.types.string },
      environment: { type: Schema.types.string },
      duration: { type: Schema.types.string },
      note: { type: Schema.types.string },
      owner: { type: Schema.slack.types.user_id },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["service", "environment", "duration", "owner", "channel"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

interface Inputs {
  service: string;
  environment: string;
  duration: string;
  note?: string;
  owner: string;
  channel: string;
}

export async function handleCreateReservation(
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

  const existing = await getReservation(client, resource);
  if (existing) {
    const tellRequester = (text: string) =>
      postEphemeral(client, { channel: inputs.channel, user: inputs.owner, text });

    if (existing.owner === inputs.owner) {
      await tellRequester(alreadyOwnerMsg(resource));
      return { status: `${resource} ja reservado por ${inputs.owner}` };
    }

    const queue = await queueFor(client, resource);
    const queued = queue.findIndex((e) => e.user === inputs.owner);
    if (queued >= 0) {
      await tellRequester(alreadyQueuedMsg(resource, queued + 1, queue.length));
      return { status: `${inputs.owner} ja esta na fila de ${resource}` };
    }

    await enqueue(client, {
      id: genId(),
      resource,
      user: inputs.owner,
      requested_at: nowSec,
    });
    const updated = await queueFor(client, resource);
    const position = updated.findIndex((e) => e.user === inputs.owner) + 1;
    await post(enqueuedMsg(resource, inputs.owner, position, updated.length));
    return { status: `${resource} ocupado; ${inputs.owner} na fila` };
  }

  const reservation = buildReservation({
    service: inputs.service,
    environment: inputs.environment,
    owner: inputs.owner,
    startedAt: nowSec,
    duration: inputs.duration,
    note: inputs.note,
    token: genId(),
    tz: config.tz,
    endHour: config.businessEndHour,
  });
  const delay = nextEventDelaySec(reservation.expires_at, nowSec, reservation.reminders_sent);
  reservation.pending_trigger_id = await scheduleTick(client, {
    resource,
    token: reservation.token,
    channel: inputs.channel,
    nowSec,
    delaySec: delay ?? 60,
  });
  await putReservation(client, reservation);
  await post(reservedMsg(reservation));
  return { status: `${resource} reservado` };
}

export default SlackFunction(
  CreateReservationDefinition,
  async ({ inputs, client, env }) => {
    try {
      const status = await handleCreateReservation(client, inputs as Inputs, { env });
      return { outputs: status };
    } catch (e) {
      return { error: `create_reservation falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
