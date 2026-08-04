#!/usr/bin/env bash
# Install or update open-dibs-on-stuff in a Slack workspace.
# Safe to re-run: it deploys the current working tree and syncs the link triggers in place,
# so the shortcut links already pinned in your channel keep working across updates.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

APP_ID=""
ASSUME_YES=0
LOCALE=""

LOCALE_FILE="functions/internals/i18n/locale.ts"
LOCALE_DIR="functions/internals/i18n/locales"

usage() {
  cat <<'USAGE'
Usage: ./setup.sh [--app <APP_ID>] [--locale <CODE>] [--yes]

  --app <APP_ID>   target a specific app; only needed when the Slack CLI knows more than one
  --locale <CODE>  language of messages, forms and shortcut names (default: pt-BR, kept between
                   runs). Run with an unknown code to list what is available.
  -y, --yes        delete leftover duplicate triggers without asking
  -h, --help       show this help
USAGE
}

available_locales() {
  ls "$LOCALE_DIR" | sed -n 's/\.ts$//p' | sort
}

current_locale() {
  sed -n 's/^export const LOCALE: Locale = "\(.*\)";$/\1/p' "$LOCALE_FILE" | head -n1
}

set_locale() {
  want="$1"
  if ! available_locales | grep -qx -- "$want"; then
    echo "Unknown locale: $want" >&2
    echo "Available: $(available_locales | tr '\n' ' ')" >&2
    echo "Adding a language takes one file plus one line; see CONTRIBUTING.md." >&2
    exit 1
  fi
  sed 's|^export const LOCALE: Locale = ".*";$|export const LOCALE: Locale = "'"$want"'";|' \
    "$LOCALE_FILE" >"$LOCALE_FILE.new"
  mv "$LOCALE_FILE.new" "$LOCALE_FILE"
  if [ "$(current_locale)" != "$want" ]; then
    echo "Error: could not write the locale into $LOCALE_FILE." >&2
    exit 1
  fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --app)
      APP_ID="${2:-}"
      shift 2
      ;;
    --app=*)
      APP_ID="${1#*=}"
      shift
      ;;
    --locale)
      LOCALE="${2:-}"
      shift 2
      ;;
    --locale=*)
      LOCALE="${1#*=}"
      shift
      ;;
    -y | --yes)
      ASSUME_YES=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ ! -f manifest.ts ]; then
  echo "Error: run this from the root of the open-dibs-on-stuff repo." >&2
  exit 1
fi

echo "== Checking prerequisites =="

if ! command -v slack >/dev/null 2>&1; then
  echo "Slack CLI not found. Install it first:" >&2
  echo "  curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash" >&2
  exit 1
fi
echo "- Slack CLI: found ($(slack --version 2>/dev/null || echo installed))"

if ! command -v deno >/dev/null 2>&1; then
  echo "Deno not found. Install it first (see README.md 'Pre-requisitos' / Prerequisites)." >&2
  exit 1
fi
echo "- Deno: found ($(deno --version | head -n1))"

# Corporate networks that intercept TLS re-sign HTTPS with a root CA that Deno's bundled store
# doesn't trust, which breaks downloading the Slack SDK hooks (get-manifest -> runtime_not_found).
# Trusting the OS store fixes it and is harmless on networks without interception.
export DENO_TLS_CA_STORE=system

echo
echo "== Language =="
# The locale is baked in at deploy time: one constant drives messages, form labels and shortcut
# names, so there is a single place to change and no env var to keep in sync.
if [ -n "$LOCALE" ]; then
  set_locale "$LOCALE"
  echo "- set to $LOCALE"
else
  echo "- keeping $(current_locale) (change with --locale <CODE>)"
fi
echo "- available: $(available_locales | tr '\n' ' ')"

echo
echo "== Logging in to Slack =="
if slack auth list --no-color --skip-update 2>/dev/null | grep -q "Team ID:"; then
  echo "- already logged in; skipping (run 'slack login' by hand to add another workspace)"
else
  echo "A browser window will open. Pick the workspace where you want to install the app."
  slack login
fi

echo
echo "== Deploying the app =="
echo "Updates an existing installation in place; creates it on the first run."
if [ -n "$APP_ID" ]; then
  slack deploy --hide-triggers --app "$APP_ID"
else
  slack deploy --hide-triggers
fi

if [ -z "$APP_ID" ]; then
  found="$(sed -n 's/.*"app_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' .slack/apps.json 2>/dev/null | sort -u || true)"
  count="$(printf '%s\n' "$found" | grep -c . || true)"
  if [ "$count" = "1" ]; then
    APP_ID="$found"
  else
    echo >&2
    echo "Could not tell which app to use (found $count in .slack/apps.json)." >&2
    echo "Re-run picking one explicitly:  ./setup.sh --app <APP_ID>" >&2
    exit 1
  fi
fi
echo "- App: $APP_ID"

echo
echo "== Syncing link triggers =="
echo "Existing shortcuts are updated in place, so their links stay valid."
echo

TRIGGER_FILES="reserve_link.ts release_link.ts extend_link.ts leave_queue_link.ts status_link.ts"

# The shortcut name comes from the message catalog now, so it can't be read out of the file with
# sed. Asking Deno for it also gives the name in every other locale, which is what lets a language
# switch update the installed shortcut in place instead of creating a second one.
trigger_names() {
  deno run -q --allow-read scripts/trigger_names.ts "$1"
}

# Literal (non-regex) match, since a translated name may contain characters sed would treat as
# syntax.
trigger_ids_named() {
  printf '%s\n' "$INSTALLED" | awk -v n="$1" '
    { line = $0; sub(/^[[:space:]]+/, "", line) }
    index(line, n " ") == 1 {
      rest = substr(line, length(n) + 2)
      if (rest ~ /^Ft[A-Z0-9]+ \(shortcut\)/) { split(rest, a, " "); print a[1] }
    }'
}

trigger_list() {
  slack trigger list --app "$APP_ID" --limit 200 --no-color --skip-update
}

# A failure here must abort: an empty list would read as "nothing installed" and the sync
# below would create a second copy of every trigger instead of updating the existing ones.
INSTALLED="$(trigger_list)"
DUPES=""

for file in $TRIGGER_FILES; do
  names="$(trigger_names "$file")" || names=""
  title="$(printf '%s\n' "$names" | head -n1)"
  if [ -z "$title" ]; then
    echo "Error: could not read the trigger name for triggers/$file." >&2
    exit 1
  fi

  # Look the shortcut up by its name in any registered language, so switching locale renames the
  # existing one instead of leaving a duplicate behind.
  ids=""
  while IFS= read -r name; do
    [ -z "$name" ] && continue
    ids="$(printf '%s\n%s' "$ids" "$(trigger_ids_named "$name")")"
  done <<EOF
$names
EOF
  ids="$(printf '%s\n' "$ids" | grep . | awk '!seen[$0]++' || true)"

  if [ -z "$ids" ]; then
    echo "--- $title: creating ---"
    slack trigger create --trigger-def "triggers/$file" --app "$APP_ID"
  else
    keep="$(printf '%s\n' "$ids" | head -n1)"
    echo "--- $title: updating $keep ---"
    slack trigger update --trigger-id "$keep" --trigger-def "triggers/$file" --app "$APP_ID"
    extra="$(printf '%s\n' "$ids" | tail -n +2)"
    if [ -n "$extra" ]; then
      DUPES="$DUPES $extra"
    fi
  fi
  echo
done

DUPES="$(printf '%s\n' $DUPES | grep . || true)"
if [ -n "$DUPES" ]; then
  echo "== Duplicate triggers =="
  echo "These extra shortcuts point at the same workflows, left over from an earlier run."
  echo "The one kept per action is the first the API lists; these are the leftovers:"
  printf '  %s\n' $DUPES
  echo
  echo "Deleting one breaks that specific link if somebody pinned it. The kept links above still work."
  if [ "$ASSUME_YES" = "1" ]; then
    reply=y
  else
    printf 'Delete the leftovers? [y/N] '
    read -r reply || reply=n
  fi
  case "$reply" in
    y | Y | yes | YES)
      for id in $DUPES; do
        slack trigger delete --trigger-id "$id" --app "$APP_ID" --force
      done
      ;;
    *)
      echo "Kept. Delete later with: slack trigger delete --trigger-id <id> --app $APP_ID"
      ;;
  esac
  echo
fi

echo "== Your links =="
trigger_list || echo "(could not list triggers; run: slack trigger list --app $APP_ID)"

cat <<EOF
== Done ==

Invite the app to your team's channel, then pin the 5 links above there:

  /invite @open-dibs-on-stuff

The invite is required: Status, Leave queue and the expiration reminders use ephemeral messages,
which Slack only allows in channels the app belongs to. Anyone in the workspace can then use the
links, no further setup needed on their end. Re-running this script keeps those links valid.

To ship a new version later: pull the latest code and run ./setup.sh again.

To switch language: ./setup.sh --locale en (messages, forms and shortcut names all follow it, and
the pinned links keep working because the shortcuts are renamed in place).

Optional: set a different timezone or end-of-business-hour default (defaults are
America/Sao_Paulo and 18:00):

  slack env add DIBS_TIMEZONE America/Sao_Paulo
  slack env add DIBS_BUSINESS_END_HOUR 18

Last step, by hand: open one of the links in Slack and make a reservation to confirm
the deploy is live.

See INSTALL.md for details and troubleshooting.
EOF
