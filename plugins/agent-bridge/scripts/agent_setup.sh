#!/usr/bin/env bash
set -euo pipefail

API_URL="${AGENT_BRIDGE_API_URL:-http://localhost:3001}"
PROJECT_NAME="${AGENT_BRIDGE_PROJECT_NAME:-agent-bridge}"
AGENT_NAME="${AGENT_BRIDGE_AGENT_NAME:-codex}"
CHANNEL_TYPE="${AGENT_BRIDGE_CHANNEL_TYPE:-telegram}"

usage() {
  cat <<EOF
Usage:
  agent_setup.sh create-session
  agent_setup.sh check-responses <session_id>
  agent_setup.sh mark-read <session_id>
  agent_setup.sh notify <session_id> <event_type> <summary>
  agent_setup.sh poll-telegram <session_id>

Environment variables (optional):
  AGENT_BRIDGE_API_URL       Default: http://localhost:3001
  AGENT_BRIDGE_PROJECT_NAME  Default: agent-bridge
  AGENT_BRIDGE_AGENT_NAME    Default: codex
  AGENT_BRIDGE_CHANNEL_TYPE  Default: telegram

Examples:
  AGENT_BRIDGE_PROJECT_NAME=my-repo AGENT_BRIDGE_AGENT_NAME=codex ./agent_setup.sh create-session
  ./agent_setup.sh check-responses 123e4567-e89b-12d3-a456-426614174000
  ./agent_setup.sh notify 123e4567-e89b-12d3-a456-426614174000 task_started "Starting implementation"
  ./agent_setup.sh poll-telegram 123e4567-e89b-12d3-a456-426614174000
EOF
}

create_session() {
  curl -sS -X POST "${API_URL}/agent-sessions" \
    -H "Content-Type: application/json" \
    -d "{\"projectName\":\"${PROJECT_NAME}\",\"agentName\":\"${AGENT_NAME}\",\"channelType\":\"${CHANNEL_TYPE}\",\"channelConfig\":{}}"
}

check_responses() {
  local session_id="$1"
  curl -sS "${API_URL}/agent-sessions/${session_id}/responses"
}

mark_read() {
  local session_id="$1"
  curl -sS -X POST "${API_URL}/agent-sessions/${session_id}/mark-read" \
    -H "Content-Type: application/json"
}

notify() {
  local session_id="$1"
  local event_type="$2"
  local summary="$3"
  curl -sS -X POST "${API_URL}/agent-events" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"${session_id}\",\"type\":\"${event_type}\",\"payload\":{\"summary\":\"${summary}\"}}"
}

poll_telegram() {
  local session_id="$1"
  local stop=0
  local response unread_count content normalized preview

  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required for poll-telegram"
    exit 1
  fi

  echo "Polling Telegram responses every 5s for session: ${session_id}"
  while [[ $stop -eq 0 ]]; do
    response="$(check_responses "${session_id}")"
    unread_count="$(echo "${response}" | jq '[.[] | select(.read == false)] | length')"

    if [[ "${unread_count}" -gt 0 ]]; then
      content="$(echo "${response}" | jq -r '[.[] | select(.read == false) | .content] | join(" ")')"
      preview="$(echo "${content}" | tr '\n' ' ' | cut -c1-180)"
      # Acknowledge immediately and include received instruction summary.
      notify "${session_id}" "message" "Received: ${preview}" >/dev/null
      echo "${response}" | jq -r '.[] | select(.read == false) | "- \(.createdAt) | \(.author): \(.content)"'
      normalized="$(echo "${content}" | tr '[:upper:]' '[:lower:]')"

      if [[ "${normalized}" == *"done"* || "${normalized}" == *"back to terminal"* ]]; then
        notify "${session_id}" "task_completed" "Telegram mode closed. Returning to terminal mode." >/dev/null
        stop=1
      else
        notify "${session_id}" "needs_review" "Instruction received in Telegram. Execute it in Codex and report progress." >/dev/null
      fi

      mark_read "${session_id}" >/dev/null
    fi

    [[ $stop -eq 1 ]] || sleep 5
  done
}

cmd="${1:-}"
case "$cmd" in
  create-session)
    create_session
    ;;
  check-responses)
    [[ $# -eq 2 ]] || { usage; exit 1; }
    check_responses "$2"
    ;;
  mark-read)
    [[ $# -eq 2 ]] || { usage; exit 1; }
    mark_read "$2"
    ;;
  notify)
    [[ $# -eq 4 ]] || { usage; exit 1; }
    notify "$2" "$3" "$4"
    ;;
  poll-telegram)
    [[ $# -eq 2 ]] || { usage; exit 1; }
    poll_telegram "$2"
    ;;
  *)
    usage
    exit 1
    ;;
esac
