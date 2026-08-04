import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { LeaveQueueDefinition } from "../functions/leave_queue.ts";
import { t } from "../functions/internals/i18n/mod.ts";

export const LeaveQueueWorkflow = DefineWorkflow({
  callback_id: "leave_queue_workflow",
  title: t("action.leaveQueue"),
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
  title: t("action.leaveQueue"),
  interactivity: LeaveQueueWorkflow.inputs.interactivity,
  submit_label: t("action.leaveQueue.submit"),
  fields: {
    elements: [
      { name: "service", title: t("field.service"), type: Schema.types.string },
      {
        name: "environment",
        title: t("field.environment"),
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
