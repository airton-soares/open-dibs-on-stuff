# Installation

🇺🇸 English | 🇧🇷 [Português](INSTALL.md)

Quick guide to get `open-dibs-on-stuff` running on your Slack workspace. This isn't an App Directory
install (see why in the [README](README.en.md#architecture)): it's you, or someone on your team,
running a one-time deploy. After that, everyone else just uses the shortcuts, no install needed.

Takes about 10 minutes.

## Prerequisites

- A Slack workspace with Run on Slack enabled (paid plan) or a sandbox from the
  [Slack Developer Program](https://api.slack.com/developer-program).
- [Deno](https://deno.com/) 2.x installed.
- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) installed.

## Option 1: automated script

Linux and macOS:

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
./setup.sh
```

Windows (PowerShell):

```powershell
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
.\setup.ps1
```

The script checks prerequisites, opens Slack login in your browser, deploys the app, and creates the
5 shortcuts (Reserve, Release, Extend, Leave queue, Status), printing the links at the end.

Re-run it as often as you like: it skips the login if you're already authenticated and **updates**
the existing shortcuts instead of creating new ones, so links already pinned in the channel keep
working. Optional flags:

- `--app <APP_ID>` (`-App` on PowerShell): pick the app when the Slack CLI knows more than one.
- `--yes` / `-y` (`-Yes` on PowerShell): delete duplicate shortcuts without asking.

## Option 2: manual steps

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
slack login
slack deploy
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/leave_queue_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

Each `trigger create` returns a shortcut link.

## After deploying

Invite the app to the channel your team will use:

```
/invite @open-dibs-on-stuff
```

This is required: **Status** and **Leave queue** reply with an ephemeral message (only the person
who clicked sees it), and Slack only allows ephemeral messages in channels the app belongs to.
Without the invite, those actions fail with `channel_not_found`.

Take the 5 returned links and pin them in that channel. From there, it's just clicking the shortcut.
Nobody else needs to install anything.

Optional: timezone and end-of-business-hour have defaults (`America/Sao_Paulo`, 18:00). To change
them:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

## Upgrading to a new version

```sh
git pull
./setup.sh
```

The script redeploys the current code and reuses the existing shortcuts (`slack trigger update`),
which keep the same ID and therefore the same link. Nothing to re-pin, nobody to notify.

When it finishes, open one of the shortcuts and make a reservation to confirm the new version is
live.

If an earlier run was interrupted halfway and left duplicate shortcuts behind, the script lists the
leftovers and offers to delete them. By hand:

```sh
slack trigger list --app <APP_ID>
slack trigger delete --trigger-id <ID> --app <APP_ID>
```

## Common issues

- **`get_status failed: chat.postEphemeral failed: channel_not_found`**: the app isn't a member of
  the channel. Run `/invite @open-dibs-on-stuff` there. Same goes for `leave_queue` and for the
  Reserve notices sent to whoever already holds the resource or is already on its waitlist, which
  are ephemeral. The rest works without the invite because it posts regular messages.
- **`slack: command not found`**: install the Slack CLI. Linux/macOS:
  `curl -fsSL
  https://downloads.slack-edge.com/slack-cli/install.sh | bash`. Windows (PowerShell):
  `irm
  https://downloads.slack-edge.com/slack-cli/install-windows.ps1 | iex`.
- **Windows refuses to run `setup.ps1` (execution policy)**: run
  `powershell -ExecutionPolicy
  Bypass -File .\setup.ps1` instead of `.\setup.ps1` directly.
- **`runtime_not_found` / `invalid peer certificate: UnknownIssuer` on deploy**: your network
  intercepts TLS (a corporate proxy like Zscaler/Netskope) and Deno doesn't trust the CA that
  re-signed HTTPS, so it can't download the SDK hooks. Run with the system store:
  `DENO_TLS_CA_STORE=system slack deploy` (`setup.sh`/`setup.ps1` already do this). To make it
  permanent, add `export DENO_TLS_CA_STORE=system` to your shell (`~/.zshrc`/`~/.bashrc`).
- **Workspace doesn't have Run on Slack**: ask your workspace admin to enable it, or use a sandbox
  from the [Slack Developer Program](https://api.slack.com/developer-program) to try it for free.
- **App stopped working after a code change**: run `slack deploy` again and recreate the 5 triggers
  (commands above). The link changes every time you run `trigger create`, so you'll need to re-pin
  it in the channel.
