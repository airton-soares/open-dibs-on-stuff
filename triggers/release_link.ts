import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { ReleaseWorkflow } from "../workflows/release.ts";
import { t } from "../functions/internals/i18n/mod.ts";

const trigger: Trigger<typeof ReleaseWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: t("action.release"),
  description: t("action.release.description"),
  workflow: "#/workflows/release_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
