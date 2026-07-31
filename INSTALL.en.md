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
4 shortcuts (Reserve, Release, Extend, Status), printing the links at the end.

## Option 2: manual steps

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
slack login
slack deploy
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

Each `trigger create` returns a shortcut link.

## After deploying

Take the 4 returned links and pin them in the channel your team will use the app in. From there,
it's just clicking the shortcut. Nobody else needs to install anything.

Optional: timezone and end-of-business-hour have defaults (`America/Sao_Paulo`, 18:00). To change
them:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

## Common issues

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
- **App stopped working after a code change**: run `slack deploy` again and recreate the 4 triggers
  (commands above). The link changes every time you run `trigger create`, so you'll need to re-pin
  it in the channel.
