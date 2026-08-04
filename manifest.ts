import { Manifest } from "deno-slack-sdk/mod.ts";
import ReservationsDatastore from "./datastores/reservations.ts";
import WaitlistDatastore from "./datastores/waitlist.ts";
import { CreateReservationDefinition } from "./functions/create_reservation.ts";
import { ReleaseReservationDefinition } from "./functions/release_reservation.ts";
import { ExtendReservationDefinition } from "./functions/extend_reservation.ts";
import { GetStatusDefinition } from "./functions/get_status.ts";
import { LeaveQueueDefinition } from "./functions/leave_queue.ts";
import { TickDefinition } from "./functions/tick.ts";
import { ReserveWorkflow } from "./workflows/reserve.ts";
import { ReleaseWorkflow } from "./workflows/release.ts";
import { ExtendWorkflow } from "./workflows/extend.ts";
import { StatusWorkflow } from "./workflows/status.ts";
import { LeaveQueueWorkflow } from "./workflows/leave_queue.ts";
import { TickWorkflow } from "./workflows/tick.ts";
import { t } from "./functions/internals/i18n/mod.ts";

export default Manifest({
  name: "open-dibs-on-stuff",
  description: t("app.description"),
  icon: "assets/icon.png",
  datastores: [ReservationsDatastore, WaitlistDatastore],
  functions: [
    CreateReservationDefinition,
    ReleaseReservationDefinition,
    ExtendReservationDefinition,
    GetStatusDefinition,
    LeaveQueueDefinition,
    TickDefinition,
  ],
  workflows: [
    ReserveWorkflow,
    ReleaseWorkflow,
    ExtendWorkflow,
    StatusWorkflow,
    LeaveQueueWorkflow,
    TickWorkflow,
  ],
  botScopes: [
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
    "triggers:write",
    "triggers:read",
  ],
  outgoingDomains: [],
});
