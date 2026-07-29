import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { ExtendWorkflow } from "../workflows/extend.ts";

const trigger: Trigger<typeof ExtendWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Estender recurso",
  description: "Estende o tempo de uma reserva sua",
  workflow: "#/workflows/extend_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
