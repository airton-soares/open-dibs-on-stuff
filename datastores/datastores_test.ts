import { assertEquals } from "@std/assert";
import ReservationsDatastore from "./reservations.ts";
import WaitlistDatastore from "./waitlist.ts";

Deno.test("reservations datastore", () => {
  assertEquals(ReservationsDatastore.definition.name, "reservations");
  assertEquals(ReservationsDatastore.definition.primary_key, "resource");
  assertEquals(Object.keys(ReservationsDatastore.definition.attributes).sort(), [
    "environment",
    "expires_at",
    "note",
    "owner",
    "pending_trigger_id",
    "reminders_sent",
    "resource",
    "service",
    "started_at",
    "token",
  ]);
});

Deno.test("waitlist datastore", () => {
  assertEquals(WaitlistDatastore.definition.name, "waitlist");
  assertEquals(WaitlistDatastore.definition.primary_key, "id");
  assertEquals(Object.keys(WaitlistDatastore.definition.attributes).sort(), [
    "id",
    "requested_at",
    "resource",
    "user",
  ]);
});
