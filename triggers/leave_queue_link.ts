import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { LeaveQueueWorkflow } from "../workflows/leave_queue.ts";

const trigger: Trigger<typeof LeaveQueueWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Sair da fila",
  description: "Tira você da fila de espera de um serviço",
  workflow: "#/workflows/leave_queue_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
