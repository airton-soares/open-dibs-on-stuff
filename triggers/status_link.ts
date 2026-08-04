import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { StatusWorkflow } from "../workflows/status.ts";
import { t } from "../functions/internals/i18n/mod.ts";

const trigger: Trigger<typeof StatusWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: t("action.status"),
  description: t("action.status.description"),
  workflow: "#/workflows/status_workflow",
  inputs: {
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
