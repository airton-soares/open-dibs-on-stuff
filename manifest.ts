import { Manifest } from "deno-slack-sdk/mod.ts";

export default Manifest({
  name: "open-dibs-on-stuff",
  description: "Reserva de servicos em staging/production",
  botScopes: [
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "triggers:write",
    "triggers:read",
  ],
  functions: [],
  workflows: [],
  datastores: [],
  outgoingDomains: [],
});
