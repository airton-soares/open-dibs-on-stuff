import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { listReservations } from "./internals/reservations_repo.ts";
import { queueFor } from "./internals/waitlist_repo.ts";
import { statusMsg } from "./internals/messages.ts";
import type { WaitlistEntry } from "./internals/types.ts";

export const GetStatusDefinition = DefineFunction({
  callback_id: "get_status",
  title: "Status das reservas",
  source_file: "functions/get_status.ts",
  input_parameters: {
    properties: { channel: { type: Schema.slack.types.channel_id } },
    required: ["channel"],
  },
  output_parameters: {
    properties: { status: { type: Schema.types.string } },
    required: ["status"],
  },
});

export async function handleGetStatus(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: { channel: string },
): Promise<{ status: string }> {
  const reservations = await listReservations(client);
  const queues: Record<string, WaitlistEntry[]> = {};
  for (const r of reservations) queues[r.resource] = await queueFor(client, r.resource);
  await client.chat.postMessage({ channel: inputs.channel, text: statusMsg(reservations, queues) });
  return { status: `${reservations.length} reservas` };
}

export default SlackFunction(
  GetStatusDefinition,
  async ({ inputs, client }) => {
    try {
      const status = await handleGetStatus(client, inputs as { channel: string });
      return { outputs: status };
    } catch (e) {
      return { error: `get_status falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
