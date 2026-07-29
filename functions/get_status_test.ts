// deno-lint-ignore-file no-explicit-any
import { assertStringIncludes } from "@std/assert";
import { handleGetStatus } from "./get_status.ts";

Deno.test("status posta reservas ativas", async () => {
  const posts: string[] = [];
  const c = {
    apps: {
      datastore: {
        query: (a: any) =>
          a.datastore === "reservations"
            ? Promise.resolve({
              ok: true,
              items: [{ resource: "cards-stg", owner: "U1", expires_at: 7200 }],
            })
            : Promise.resolve({ ok: true, items: [] }),
      },
    },
    chat: {
      postMessage: (a: any) => {
        posts.push(a.text);
        return Promise.resolve({ ok: true });
      },
    },
  };
  await handleGetStatus(c as any, { channel: "C1" });
  assertStringIncludes(posts[0], "cards-stg");
});
