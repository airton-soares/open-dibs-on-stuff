#!/usr/bin/env bash
# One-time setup: deploy open-dibs-on-stuff to a Slack workspace and create the link triggers.
# Run this once, from the repo root, as whoever is setting the app up for their team.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

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

echo
echo "== Logging in to Slack =="
echo "A browser window will open. Pick the workspace where you want to install the app."
slack login

echo
echo "== Deploying the app =="
slack deploy

echo
echo "== Creating link triggers =="
echo "Creating one shortcut per action. Copy each link below and pin it in the channel"
echo "your team will use (Slack: pin a message with the link, or just share it)."
echo

declare -A trigger_labels=(
  ["reserve_link.ts"]="Reserve"
  ["release_link.ts"]="Release"
  ["extend_link.ts"]="Extend"
  ["status_link.ts"]="Status"
)

for file in reserve_link.ts release_link.ts extend_link.ts status_link.ts; do
  echo "--- ${trigger_labels[$file]} ---"
  slack trigger create --trigger-def "triggers/$file"
  echo
done

cat <<'EOF'
== Done ==

Pin the 4 links above in your team's channel. Anyone in the workspace can then use them,
no further setup needed on their end.

Optional: set a different timezone or end-of-business-hour default (defaults are
America/Sao_Paulo and 18:00):

  slack env add DIBS_TIMEZONE America/Sao_Paulo
  slack env add DIBS_BUSINESS_END_HOUR 18

See INSTALL.md for details and troubleshooting.
EOF
