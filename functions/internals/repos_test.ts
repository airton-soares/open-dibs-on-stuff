// deno-lint-ignore-file no-explicit-any
import { assertEquals } from "@std/assert";
import { getReservation, putReservation } from "./reservations_repo.ts";
import { queueFor } from "./waitlist_repo.ts";
import type { Reservation, WaitlistEntry } from "./types.ts";

function stub(items: Record<string, any[]>) {
  const calls: any[] = [];
  const client = {
    apps: {
      datastore: {
        put: (a: any) => {
          calls.push(["put", a]);
          return Promise.resolve({ ok: true, item: a.item });
        },
        get: (a: any) => {
          const found = (items[a.datastore] ?? []).find((i: any) =>
            i.resource === a.id || i.id === a.id
          );
          return Promise.resolve({ ok: true, item: found ?? {} });
        },
        delete: (a: any) => {
          calls.push(["delete", a]);
          return Promise.resolve({ ok: true });
        },
        query: (a: any) => Promise.resolve({ ok: true, items: items[a.datastore] ?? [] }),
      },
    },
  };
  return { client, calls };
}

Deno.test("putReservation grava no datastore reservations", async () => {
  const { client, calls } = stub({});
  await putReservation(client as any, { resource: "cards-stg" } as Reservation);
  assertEquals(calls[0][1].datastore, "reservations");
  assertEquals(calls[0][1].item.resource, "cards-stg");
});

Deno.test("getReservation retorna null quando vazio", async () => {
  const { client } = stub({ reservations: [] });
  assertEquals(await getReservation(client as any, "x-stg"), null);
});

Deno.test("queueFor ordena por requested_at asc", async () => {
  const entries: WaitlistEntry[] = [
    { id: "b", resource: "cards-stg", user: "U2", requested_at: 200 },
    { id: "a", resource: "cards-stg", user: "U1", requested_at: 100 },
  ];
  const { client } = stub({ waitlist: entries });
  const q = await queueFor(client as any, "cards-stg");
  assertEquals(q.map((e) => e.id), ["a", "b"]);
});
