# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Overview

Open source Slack app (Deno, running entirely on Run on Slack/ROSI, no server or database of its
own) for reserving shared resources: services in `development`, `staging`, or `production`
environments, with a waitlist, reminders, and auto-expiration. Works for any development team or IT
group that needs to coordinate access to shared environments. Interaction happens through link
triggers pinned in the channel (Reserve, Release, Extend, Status).

## Commands

```sh
deno task test      # deno test --allow-read
deno task lint      # deno lint
deno task fmt       # deno fmt
deno task fmt:check # deno fmt --check (used in CI)
```

Run a single test:

```sh
deno test --allow-read functions/internals/domain_reserve_test.ts
```

CI (GitHub Actions) runs, in this order: `deno fmt --check`, `deno lint`,
`deno check manifest.ts triggers/*.ts`, `deno test --allow-read`.

Local dev (hot reload against real Slack): `slack run`. Deploy: `slack deploy`. After adding a new
function, workflow, or trigger, recreate the link triggers with
`slack trigger create --trigger-def triggers/<x>_link.ts`, both locally and again after deploy.

## Architecture: pure core + thin shell

All business decisions live in `functions/internals/`, pure modules with no network access and no
Slack client, exhaustively tested with `deno test`. The custom functions in `functions/*.ts` are
thin shells: they read and write the Datastore, call the core to decide what to do, and post
messages. Each one exports a `handleX(client, inputs, opts?)` function that's testable with a stub
`client`, on top of the default `SlackFunction` that Slack actually invokes.

Registration flow: `manifest.ts` lists datastores, functions, and workflows. `workflows/*.ts`
assembles the steps (form + function). `triggers/*_link.ts` exposes the workflow as a shortcut that
can be pinned in a channel.

Key modules in `functions/internals/`:

- `types.ts`: `Reservation`, `WaitlistEntry`, and constants (`REMINDER_MARKERS`, `TZ`,
  `BUSINESS_END_HOUR`, `ENVIRONMENTS`).
- `domain.ts`: the decision core. `resourceKey`, `buildReservation`, `canManage`, `applyExtend`,
  `dueReminders`, `nextEventDelaySec`, `decideTick`.
- `scheduling.ts`: `scheduleTick`/`cancelTrigger`, wrapping the ROSI trigger API. ROSI only supports
  recurring triggers with hourly-or-coarser granularity, so reminders and expiration use one-off
  `once` triggers rescheduled in a chain (see "Tick cycle" below).
- `promote.ts`: `promoteNext` dequeues the next person in the waitlist and creates a new reservation
  for them, valid until end of business day.
- `config.ts`: `loadConfig` reads `DIBS_TIMEZONE`/`DIBS_BUSINESS_END_HOUR` from the `env` record the
  Slack runtime passes to each function, falling back to defaults. Never read `Deno.env` — ROSI runs
  functions without `--allow-env`.
- `messages.ts`: builders for the text posted to Slack.
- `reservations_repo.ts` / `waitlist_repo.ts`: CRUD wrappers over the Datastore (reservations: PK
  `resource`; waitlist: PK `id`).

### Tick cycle

Each reservation schedules a `once` trigger via `scheduleTick`. When it fires, the `tick` workflow
calls `decideTick()` in `domain.ts`, which picks between `stale` (the token no longer matches, so
ignore it), `expire` (expire the reservation and promote the next person in the waitlist through
`promote.ts`), or `remind` (post a reminder and reschedule the next tick, 60/30/10 minutes before
the end). The `token` field on each `Reservation` exists specifically to invalidate old triggers
once the state changes, such as after an extend or a release.

Resource identification: `service-suffix`, where suffix is one of `dev`, `stg`, or `prod`, mapped
through `ENV_SHORT` in `domain.ts` (e.g. `cards-stg`, `billing-prod`).

## Configuration (ROSI env vars, with defaults)

| Variable                 | Default             | Description                              |
| ------------------------ | ------------------- | ---------------------------------------- |
| `DIBS_TIMEZONE`          | `America/Sao_Paulo` | Timezone used to compute "end of day".   |
| `DIBS_BUSINESS_END_HOUR` | `18`                | Hour (0-23) marking end of business day. |
