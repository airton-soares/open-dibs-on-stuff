import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { ReleaseWorkflow } from "../workflows/release.ts";

const trigger: Trigger<typeof ReleaseWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Liberar recurso",
  description: "Libera uma reserva sua de um servico",
  workflow: "#/workflows/release_workflow",
  inputs: {
    interactivity: { value: TriggerContextData.Shortcut.interactivity },
    channel: { value: TriggerContextData.Shortcut.channel_id },
    user: { value: TriggerContextData.Shortcut.user_id },
  },
};

export default trigger;
