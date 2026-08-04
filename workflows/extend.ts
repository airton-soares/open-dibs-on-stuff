import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ExtendReservationDefinition } from "../functions/extend_reservation.ts";
import { t } from "../functions/internals/i18n/mod.ts";

export const ExtendWorkflow = DefineWorkflow({
  callback_id: "extend_workflow",
  title: t("action.extend"),
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = ExtendWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: t("action.extend"),
  interactivity: ExtendWorkflow.inputs.interactivity,
  submit_label: t("action.extend.submit"),
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
      {
        name: "extra",
        title: t("field.extraTime"),
        type: Schema.types.string,
        enum: ["30m", "1h", "2h"],
        choices: [
          { value: "30m", title: t("extra.30m") },
          { value: "1h", title: t("extra.1h") },
          { value: "2h", title: t("extra.2h") },
        ],
        default: "1h",
      },
    ],
    required: ["service", "environment", "extra"],
  },
});

ExtendWorkflow.addStep(ExtendReservationDefinition, {
  service: form.outputs.fields.service,
  environment: form.outputs.fields.environment,
  extra: form.outputs.fields.extra,
  requester: ExtendWorkflow.inputs.user,
  channel: ExtendWorkflow.inputs.channel,
});
