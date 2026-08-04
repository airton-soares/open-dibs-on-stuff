import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { LeaveQueueDefinition } from "../functions/leave_queue.ts";

export const LeaveQueueWorkflow = DefineWorkflow({
  callback_id: "leave_queue_workflow",
  title: "Sair da fila",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = LeaveQueueWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Sair da fila",
  interactivity: LeaveQueueWorkflow.inputs.interactivity,
  submit_label: "Sair da fila",
  fields: {
    elements: [
      { name: "service", title: "Serviço", type: Schema.types.string },
      {
        name: "environment",
        title: "Ambiente",
        type: Schema.types.string,
        enum: ["development", "staging", "production"],
        choices: [
          { value: "development", title: "development" },
          { value: "staging", title: "staging" },
          { value: "production", title: "production" },
        ],
      },
    ],
    required: ["service", "environment"],
  },
});

LeaveQueueWorkflow.addStep(LeaveQueueDefinition, {
  service: form.outputs.fields.service,
  environment: form.outputs.fields.environment,
  requester: LeaveQueueWorkflow.inputs.user,
  channel: LeaveQueueWorkflow.inputs.channel,
});
