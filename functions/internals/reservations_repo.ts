import type { Reservation } from "./types.ts";

// deno-lint-ignore no-explicit-any
export type DatastoreClient = any;

export async function getReservation(
  client: DatastoreClient,
  resource: string,
): Promise<Reservation | null> {
  const res = await client.apps.datastore.get({ datastore: "reservations", id: resource });
  const item = res.item;
  if (!item || !item.resource) return null;
  return item as Reservation;
}

export async function putReservation(client: DatastoreClient, r: Reservation): Promise<void> {
  await client.apps.datastore.put({ datastore: "reservations", item: r });
}

export async function deleteReservation(client: DatastoreClient, resource: string): Promise<void> {
  await client.apps.datastore.delete({ datastore: "reservations", id: resource });
}

export async function listReservations(client: DatastoreClient): Promise<Reservation[]> {
  const res = await client.apps.datastore.query({ datastore: "reservations" });
  return (res.items ?? []) as Reservation[];
}
