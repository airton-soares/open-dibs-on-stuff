import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ExtendReservationDefinition } from "../functions/extend_reservation.ts";

export const ExtendWorkflow = DefineWorkflow({
  callback_id: "extend_workflow",
  title: "Estender recurso",
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
  title: "Estender recurso",
  interactivity: ExtendWorkflow.inputs.interactivity,
  submit_label: "Estender",
  fields: {
    elements: [
      { name: "service", title: "Servico", type: Schema.types.string },
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
      {
        name: "extra",
        title: "Tempo extra",
        type: Schema.types.string,
        enum: ["30m", "1h", "2h"],
        choices: [
          { value: "30m", title: "+30 min" },
          { value: "1h", title: "+1 hora" },
          { value: "2h", title: "+2 horas" },
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
