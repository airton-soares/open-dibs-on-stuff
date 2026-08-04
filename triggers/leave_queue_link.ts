import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { LeaveQueueWorkflow } from "../workflows/leave_queue.ts";
import { t } from "../functions/internals/i18n/mod.ts";

const trigger: Trigger<typeof LeaveQueueWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: t("action.leaveQueue"),
  description: t("action.leaveQueue.description"),
  workflow: "#/workflows/leave_queue_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
