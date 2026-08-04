import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ReleaseReservationDefinition } from "../functions/release_reservation.ts";
import { t } from "../functions/internals/i18n/mod.ts";

export const ReleaseWorkflow = DefineWorkflow({
  callback_id: "release_workflow",
  title: t("action.release"),
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const form = ReleaseWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: t("action.release"),
  interactivity: ReleaseWorkflow.inputs.interactivity,
  submit_label: t("action.release.submit"),
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

ReleaseWorkflow.addStep(ReleaseReservationDefinition, {
  service: form.outputs.fields.service,
  environment: form.outputs.fields.environment,
  requester: ReleaseWorkflow.inputs.user,
  channel: ReleaseWorkflow.inputs.channel,
});
