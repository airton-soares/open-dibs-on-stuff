// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { cancelTrigger, isoFromDelay, scheduleTick } from "./scheduling.ts";

Deno.test("isoFromDelay soma o delay e gera ISO", () => {
  const iso = isoFromDelay(0, 3600);
  assertEquals(new Date(iso).getTime(), 3600 * 1000);
});

Deno.test("scheduleTick cria trigger once e retorna id", async () => {
  const calls: any[] = [];
  const client = {
    workflows: {
      triggers: {
        create: (a: any) => {
          calls.push(a);
          return Promise.resolve({ ok: true, trigger: { id: "T1" } });
        },
        delete: () => Promise.resolve({ ok: true }),
      },
    },
  };
  const id = await scheduleTick(client as any, {
    resource: "cards-stg",
    token: "tok",
    channel: "C1",
    nowSec: 0,
    delaySec: 600,
  });
  assertEquals(id, "T1");
  assertEquals(calls[0].type, "scheduled");
  assertEquals(calls[0].workflow, "#/workflows/tick_workflow");
  assertEquals(calls[0].inputs.resource.value, "cards-stg");
  assertEquals(calls[0].schedule.frequency.type, "once");
  assertStringIncludes(calls[0].schedule.start_time, "T");
});

Deno.test("scheduleTick lanca com o erro da API, nao com trigger undefined", async () => {
  const client = {
    workflows: {
      triggers: { create: () => Promise.resolve({ ok: false, error: "trigger_limit_exceeded" }) },
    },
  };
  await assertRejects(
    () =>
      scheduleTick(client as any, {
        resource: "cards-stg",
        token: "tok",
        channel: "C1",
        nowSec: 0,
        delaySec: 600,
      }),
    Error,
    "trigger_limit_exceeded",
  );
});

Deno.test("cancelTrigger ignora trigger que ja nao existe", async () => {
  const client = {
    workflows: {
      triggers: { delete: () => Promise.resolve({ ok: false, error: "trigger_not_found" }) },
    },
  };
  await cancelTrigger(client as any, "T9");
});

Deno.test("cancelTrigger lanca nos demais erros", async () => {
  const client = {
    workflows: { triggers: { delete: () => Promise.resolve({ ok: false, error: "ratelimited" }) } },
  };
  await assertRejects(() => cancelTrigger(client as any, "T9"), Error, "ratelimited");
});

Deno.test("cancelTrigger chama delete com o id", async () => {
  const calls: any[] = [];
  const client = {
    workflows: {
      triggers: {
        delete: (a: any) => {
          calls.push(a);
          return Promise.resolve({ ok: true });
        },
      },
    },
  };
  await cancelTrigger(client as any, "T9");
  assertEquals(calls[0].trigger_id, "T9");
});
