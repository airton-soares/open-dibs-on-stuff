import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export default DefineDatastore({
  name: "waitlist",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    resource: { type: Schema.types.string },
    user: { type: Schema.slack.types.user_id },
    requested_at: { type: Schema.types.number },
  },
});
