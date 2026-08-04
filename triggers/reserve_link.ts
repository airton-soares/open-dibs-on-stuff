import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { ReserveWorkflow } from "../workflows/reserve.ts";

const trigger: Trigger<typeof ReserveWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Reservar recurso",
  description: "Reserva um serviço em staging/production",
  workflow: "#/workflows/reserve_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
