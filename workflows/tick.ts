import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { TickDefinition } from "../functions/tick.ts";

export const TickWorkflow = DefineWorkflow({
  callback_id: "tick_workflow",
  title: "Tick de reserva",
  input_parameters: {
    properties: {
      resource: { type: Schema.types.string },
      token: { type: Schema.types.string },
      channel: { type: Schema.slack.types.channel_id },
    },
    required: ["resource", "token", "channel"],
  },
});

TickWorkflow.addStep(TickDefinition, {
  resource: TickWorkflow.inputs.resource,
  token: TickWorkflow.inputs.token,
  channel: TickWorkflow.inputs.channel,
});
