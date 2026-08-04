import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { resourceKey } from "./internals/domain.ts";
import { dequeue, queueFor } from "./internals/waitlist_repo.ts";
import { leftQueueMsg, notInQueueMsg } from "./internals/messages.ts";
import { postEphemeral } from "./internals/slack_api.ts";

export const LeaveQueueDefinition = DefineFunction({
  callback_id: "leave_queue",
  title: "Sair da fila",
  source_file: "functions/leave_queue.ts",
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

export async function handleLeaveQueue(
  // deno-lint-ignore no-explicit-any
  client: any,
  inputs: Inputs,
): Promise<{ status: string }> {
  const resource = resourceKey(inputs.service, inputs.environment);
  const tellRequester = (text: string) =>
    postEphemeral(client, { channel: inputs.channel, user: inputs.requester, text });

  const queue = await queueFor(client, resource);
  const entry = queue.find((e) => e.user === inputs.requester);
  if (!entry) {
    await tellRequester(notInQueueMsg(resource));
    return { status: `${inputs.requester} nao esta na fila de ${resource}` };
  }

  await dequeue(client, entry.id);
  await tellRequester(leftQueueMsg(resource));
  return { status: `${inputs.requester} saiu da fila de ${resource}` };
}

export default SlackFunction(
  LeaveQueueDefinition,
  async ({ inputs, client }) => {
    try {
      const status = await handleLeaveQueue(client, inputs as Inputs);
      return { outputs: status };
    } catch (e) {
      return { error: `leave_queue falhou: ${e}`, outputs: { status: "erro" } };
    }
  },
);
