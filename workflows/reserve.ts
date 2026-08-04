import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateReservationDefinition } from "../functions/create_reservation.ts";
import { t } from "../functions/internals/i18n/mod.ts";

export const ReserveWorkflow = DefineWorkflow({
  callback_id: "reserve_workflow",
  title: t("action.reserve"),
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = ReserveWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: t("action.reserve"),
  interactivity: ReserveWorkflow.inputs.interactivity,
  submit_label: t("action.reserve.submit"),
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
        name: "duration",
        title: t("field.duration"),
        type: Schema.types.string,
        enum: ["30m", "1h", "2h", "4h", "eob"],
        choices: [
          { value: "30m", title: t("duration.30m") },
          { value: "1h", title: t("duration.1h") },
          { value: "2h", title: t("duration.2h") },
          { value: "4h", title: t("duration.4h") },
          { value: "eob", title: t("duration.eob") },
        ],
        default: "2h",
      },
      { name: "note", title: t("field.note"), type: Schema.types.string, long: true },
    ],
    required: ["service", "environment", "duration"],
  },
});

ReserveWorkflow.addStep(CreateReservationDefinition, {
  service: form.outputs.fields.service,
  environment: form.outputs.fields.environment,
  duration: form.outputs.fields.duration,
  note: form.outputs.fields.note,
  owner: ReserveWorkflow.inputs.user,
  channel: ReserveWorkflow.inputs.channel,
});
