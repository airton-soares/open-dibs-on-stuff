import type { DatastoreClient } from "./reservations_repo.ts";
import type { WaitlistEntry } from "./types.ts";

export async function enqueue(client: DatastoreClient, entry: WaitlistEntry): Promise<void> {
  await client.apps.datastore.put({ datastore: "waitlist", item: entry });
}

export async function queueFor(
  client: DatastoreClient,
  resource: string,
): Promise<WaitlistEntry[]> {
  const res = await client.apps.datastore.query({
    datastore: "waitlist",
    expression: "#r = :r",
    expression_attributes: { "#r": "resource" },
    expression_values: { ":r": resource },
  });
  const items = (res.items ?? []) as WaitlistEntry[];
  return items.sort((a, b) => a.requested_at - b.requested_at);
}

export async function dequeue(client: DatastoreClient, id: string): Promise<void> {
  await client.apps.datastore.delete({ datastore: "waitlist", id });
}
