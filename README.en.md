# open-dibs-on-stuff

[![CI](https://github.com/airton-soares/open-dibs-on-stuff/actions/workflows/ci.yml/badge.svg)](https://github.com/airton-soares/open-dibs-on-stuff/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/airton-soares/open-dibs-on-stuff)](https://github.com/airton-soares/open-dibs-on-stuff/releases/latest)

🇺🇸 English | 🇧🇷 [Português](README.md)

**Open source** Slack app for reserving the use of shared resources (services in `development`,
`staging`, or `production` environments), with a waitlist, auto-expiration, and reminders. Helps
development teams and IT folks in general share environments without stepping on each other's toes.
Runs 100% on Slack's infrastructure (Run on Slack / ROSI): Slack hosts the code (Deno) and the
database (Datastore), with no server or cloud cost of its own.

**Just want to install it on your workspace, no code involved?** Go straight to the
[installation guide](INSTALL.en.md).

## How it works

Interaction happens through **link triggers** (shortcuts pinned in the channel) that open a form:

- **Reserve**: service + environment + duration (30m, 1h, 2h, 4h, until end of business day) +
  optional note. If the resource is free, creates the reservation; if it's taken, puts you on the
  waitlist and tells you your position. Whoever already holds the resource or is already on its
  waitlist doesn't get queued again — they just get an ephemeral notice.
- **Release**: service + environment. Only the owner can release. On release, the next person in the
  waitlist is automatically promoted.
- **Extend**: service + environment + extra time (+30m, +1h, +2h). Only the owner.
- **Leave queue**: service + environment. Takes you off that resource's waitlist; the confirmation
  is ephemeral (only you see it). If you're not on the waitlist, the app just says so.
- **Status**: lists what's reserved, by whom, until when, and the waitlists.

The resource is identified by `service-suffix`, where the suffix is `dev`, `stg`, or `prod` (e.g.
`cards-stg`, `billing-prod`).

Each reservation schedules a one-off (`once`) trigger that fires reminders to the owner at 60, 30,
and 10 minutes before the end and, on expiration, expires the reservation and promotes the next
person in the waitlist. Whoever gets promoted from the waitlist receives the resource **until the
end of the business day**.

## Configuration

Timezone and end-of-business-day hour are configurable via ROSI environment variables (with
defaults):

| Variable                 | Default             | Description                            |
| ------------------------ | ------------------- | -------------------------------------- |
| `DIBS_TIMEZONE`          | `America/Sao_Paulo` | Timezone used to compute "end of day". |
| `DIBS_BUSINESS_END_HOUR` | `18`                | Hour (0-23) of end of business day.    |

Set on the published app:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

## Prerequisites

- [Deno](https://deno.com/) 2.x. Recommended via [asdf](https://asdf-vm.com/):

  ```sh
  asdf plugin add deno https://github.com/asdf-community/asdf-deno.git
  asdf install deno 2.1.4
  asdf local deno 2.1.4
  ```

- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) logged in (`slack login`).
- A workspace with Run on Slack enabled (paid plan) or a sandbox from the
  [Slack Developer Program](https://api.slack.com/developer-program).

## Development

Run locally (hot reload against Slack):

```sh
slack run
```

Create the link triggers (copy the returned shortcut link and pin it in whichever channel your team
will use the app in):

```sh
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/leave_queue_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

## Deploy

```sh
slack deploy
```

After deploying, recreate the triggers on the published app (same command as above) and set the
environment variables (Configuration section).

## Tests and quality

```sh
deno task test      # unit tests (deno test --allow-read)
deno task lint      # deno lint
deno task fmt       # formats
deno task fmt:check # checks formatting (used in CI)
```

CI (GitHub Actions) runs `deno fmt --check`, `deno lint`, `deno check manifest.ts triggers/*.ts`,
and `deno test --allow-read`.

## Structure

```text
manifest.ts            # datastores, functions, workflows, scopes, and icon
slack.json             # Slack CLI hooks
datastores/            # reservations (PK resource) and waitlist (PK id)
functions/             # custom functions (thin shells) + co-located tests
  internals/           # pure domain core + IO (tested without network)
workflows/             # reserve, release, extend, status, tick
triggers/              # link triggers for the shortcuts
assets/icon.png        # app icon (referenced by the manifest)
assets/icon.svg        # vector source for the icon
```

## Architecture

"Pure core + thin shell": all decision logic lives in pure modules in `functions/internals/`
(receive plain data and return decisions, exhaustively tested with `deno test` without network). The
custom functions are thin shells that read/write the Datastore and post messages, delegating
decisions to the core. Each function exposes a `handleX(client, inputs, opts?)` testable with a stub
`client`, in addition to the standard `SlackFunction`.

ROSI only offers recurring triggers with hourly-or-coarser granularity, so reminders and expiration
use one-off `once` triggers rescheduled in a chain, with a `token` per reservation to ignore stale
firings.
