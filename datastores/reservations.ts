import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export default DefineDatastore({
  name: "reservations",
  primary_key: "resource",
  attributes: {
    resource: { type: Schema.types.string },
    service: { type: Schema.types.string },
    environment: { type: Schema.types.string },
    owner: { type: Schema.slack.types.user_id },
    started_at: { type: Schema.types.number },
    expires_at: { type: Schema.types.number },
    note: { type: Schema.types.string },
    reminders_sent: { type: Schema.types.array, items: { type: Schema.types.number } },
    token: { type: Schema.types.string },
    pending_trigger_id: { type: Schema.types.string },
  },
});
