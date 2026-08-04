import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { listReservations } from "./internals/reservations_repo.ts";
import { queueFor } from "./internals/waitlist_repo.ts";
import { statusMsg } from "./internals/messages.ts";
import { postEphemeral } from "./internals/slack_api.ts";
import type { WaitlistEntry } from "./internals/types.ts";
import { t } from "./internals/i18n/mod.ts";

export const GetStatusDefinition = DefineFunction({
  callback_id: "get_status",
  title: t("fn.getStatus"),
  source_file: "functions/get_status.ts",
  input_parameters: {
    properties: {
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["channel", "user"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

interface Inputs {
  channel: string;
  user: string;
}

export async function handleGetStatus(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: Inputs,
): Promise<{ status: string }> {
  const reservations = await listReservations(client);
  const queues: Record<string, WaitlistEntry[]> = {};
  for (const r of reservations) queues[r.resource] = await queueFor(client, r.resource);

  await postEphemeral(client, {
    channel: inputs.channel,
    user: inputs.user,
    text: statusMsg(reservations, queues),
  });

  return { status: `${reservations.length} reservas` };
}

export default SlackFunction(
  GetStatusDefinition,
  async ({ inputs, client }) => {
    try {
      const status = await handleGetStatus(client, inputs as Inputs);
      return { outputs: status };
    } catch (e) {
      return { error: `get_status falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
