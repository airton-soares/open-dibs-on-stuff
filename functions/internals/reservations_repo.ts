import { assertOk } from "./slack_api.ts";
import type { Reservation } from "./types.ts";

// deno-lint-ignore no-explicit-any
export type DatastoreClient = any;

export async function getReservation(
  client: DatastoreClient,
  resource: string,
): Promise<Reservation | null> {
  const res = await client.apps.datastore.get({ datastore: "reservations", id: resource });
  assertOk(res, "apps.datastore.get(reservations)");
  const item = res.item;
  if (!item || !item.resource) return null;
  return item as Reservation;
}

export async function putReservation(client: DatastoreClient, r: Reservation): Promise<void> {
  const res = await client.apps.datastore.put({ datastore: "reservations", item: r });
  assertOk(res, "apps.datastore.put(reservations)");
}

export async function deleteReservation(client: DatastoreClient, resource: string): Promise<void> {
  const res = await client.apps.datastore.delete({ datastore: "reservations", id: resource });
  assertOk(res, "apps.datastore.delete(reservations)");
}

export async function listReservations(client: DatastoreClient): Promise<Reservation[]> {
  const res = await client.apps.datastore.query({ datastore: "reservations" });
  assertOk(res, "apps.datastore.query(reservations)");
  return (res.items ?? []) as Reservation[];
}
