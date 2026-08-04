import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { ExtendWorkflow } from "../workflows/extend.ts";
import { t } from "../functions/internals/i18n/mod.ts";

const trigger: Trigger<typeof ExtendWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: t("action.extend"),
  description: t("action.extend.description"),
  workflow: "#/workflows/extend_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
