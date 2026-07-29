import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { CreateReservationDefinition } from "../functions/create_reservation.ts";

export const ReserveWorkflow = DefineWorkflow({
  callback_id: "reserve_workflow",
  title: "Reservar recurso",
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
  title: "Reservar recurso",
  interactivity: ReserveWorkflow.inputs.interactivity,
  submit_label: "Reservar",
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
        name: "duration",
        title: "Duracao",
        type: Schema.types.string,
        enum: ["30m", "1h", "2h", "4h", "eob"],
        choices: [
          { value: "30m", title: "30 min" },
          { value: "1h", title: "1 hora" },
          { value: "2h", title: "2 horas" },
          { value: "4h", title: "4 horas" },
          { value: "eob", title: "Ate o fim do expediente" },
        ],
        default: "2h",
      },
      { name: "note", title: "Nota (opcional)", type: Schema.types.string, long: true },
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
