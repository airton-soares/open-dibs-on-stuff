import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetStatusDefinition } from "../functions/get_status.ts";
import { t } from "../functions/internals/i18n/mod.ts";

export const StatusWorkflow = DefineWorkflow({
  callback_id: "status_workflow",
  title: t("action.status"),
  input_parameters: {
    properties: {
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["channel", "user"],
  },
});

StatusWorkflow.addStep(GetStatusDefinition, {
  channel: StatusWorkflow.inputs.channel,
  user: StatusWorkflow.inputs.user,
});
