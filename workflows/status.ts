import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetStatusDefinition } from "../functions/get_status.ts";

export const StatusWorkflow = DefineWorkflow({
  callback_id: "status_workflow",
  title: "Status das reservas",
  input_parameters: {
    properties: { channel: { type: Schema.slack.types.channel_id } },
    required: ["channel"],
  },
});

StatusWorkflow.addStep(GetStatusDefinition, {
  channel: StatusWorkflow.inputs.channel,
});
