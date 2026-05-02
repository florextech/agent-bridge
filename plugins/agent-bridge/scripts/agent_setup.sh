#!/usr/bin/env bash
set -euo pipefail

API_URL="${AGENT_BRIDGE_API_URL:-http://localhost:3001}"
PROJECT_NAME="${AGENT_BRIDGE_PROJECT_NAME:-agent-bridge}"
AGENT_NAME="${AGENT_BRIDGE_AGENT_NAME:-codex}"
CHANNEL_TYPE="${AGENT_BRIDGE_CHANNEL_TYPE:-telegram}"
STATE_DIR="${AGENT_BRIDGE_STATE_DIR:-$HOME/.agent-bridge}"
WORKDIR="${AGENT_BRIDGE_WORKDIR:-$PWD}"

usage() {
  cat <<EOF
Usage:
  agent_setup.sh create-session
  agent_setup.sh check-responses <session_id>
  agent_setup.sh mark-read <session_id>
  agent_setup.sh notify <session_id> <event_type> <summary>
  agent_setup.sh poll-telegram <session_id>
  agent_setup.sh poll-telegram-exec <session_id>

Environment variables (optional):
  AGENT_BRIDGE_API_URL       Default: http://localhost:3001
  AGENT_BRIDGE_PROJECT_NAME  Default: agent-bridge
  AGENT_BRIDGE_AGENT_NAME    Default: codex
  AGENT_BRIDGE_CHANNEL_TYPE  Default: telegram
  AGENT_BRIDGE_EXEC_TIMEOUT  Default: 180

Examples:
  AGENT_BRIDGE_PROJECT_NAME=my-repo AGENT_BRIDGE_AGENT_NAME=codex ./agent_setup.sh create-session
  ./agent_setup.sh check-responses 123e4567-e89b-12d3-a456-426614174000
  ./agent_setup.sh notify 123e4567-e89b-12d3-a456-426614174000 task_started "Starting implementation"
  ./agent_setup.sh poll-telegram 123e4567-e89b-12d3-a456-426614174000
  ./agent_setup.sh poll-telegram-exec 123e4567-e89b-12d3-a456-426614174000
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
  local payload_json
  payload_json="$(jq -nc \
    --arg sessionId "${session_id}" \
    --arg type "${event_type}" \
    --arg summary "${summary}" \
    '{sessionId:$sessionId,type:$type,payload:{summary:$summary}}')"
  curl -sS -X POST "${API_URL}/agent-events" \
    -H "Content-Type: application/json" \
    -d "${payload_json}"
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

poll_telegram_exec() {
  local session_id="$1"
  local stop=0
  local response unread_count msg_id content normalized preview output rc mode state_file mode_cmd last_msg_file
  local timeout_secs="${AGENT_BRIDGE_EXEC_TIMEOUT:-180}"
  state_file="${STATE_DIR}/mode-${session_id}.txt"

  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required for poll-telegram-exec"
    exit 1
  fi

  mkdir -p "${STATE_DIR}"
  if [[ -f "${state_file}" ]]; then
    mode="$(cat "${state_file}")"
  else
    mode="hybrid"
    echo "${mode}" > "${state_file}"
  fi

  echo "Polling + executing Telegram instructions every 5s for session: ${session_id}"
  echo "Instruction format: natural language (Codex) or shell with prefix: sh: <command>"
  echo "Current mode: ${mode} (set from Telegram with: mode: telegram|terminal|hybrid)"

  while [[ $stop -eq 0 ]]; do
    response="$(check_responses "${session_id}")"
    unread_count="$(echo "${response}" | jq '[.[] | select(.read == false)] | length')"

    if [[ "${unread_count}" -gt 0 ]]; then
      while IFS= read -r msg_id; do
        content="$(echo "${response}" | jq -r ".[] | select(.id == \"${msg_id}\") | .content")"
        normalized="$(echo "${content}" | tr '[:upper:]' '[:lower:]')"

        if [[ "${normalized}" == *"done"* || "${normalized}" == *"back to terminal"* ]]; then
          notify "${session_id}" "task_completed" "Execution mode closed. Returning to terminal mode." >/dev/null
          stop=1
          continue
        fi

        if [[ "${normalized}" == mode:* ]]; then
          mode_cmd="${normalized#mode: }"
          mode_cmd="$(echo "${mode_cmd}" | xargs)"
          if [[ "${mode_cmd}" == "telegram" || "${mode_cmd}" == "terminal" || "${mode_cmd}" == "hybrid" ]]; then
            mode="${mode_cmd}"
            echo "${mode}" > "${state_file}"
            notify "${session_id}" "message" "Mode updated to: ${mode}" >/dev/null
          else
            notify "${session_id}" "error" "Invalid mode. Use: mode: telegram | mode: terminal | mode: hybrid" >/dev/null
          fi
          continue
        fi

        preview="$(echo "${content}" | tr '\n' ' ' | cut -c1-180)"
        notify "${session_id}" "message" "Received instruction: ${preview}" >/dev/null

        if [[ "${mode}" == "terminal" ]]; then
          notify "${session_id}" "needs_review" "Mode is terminal. Instruction acknowledged; execute it from terminal channel." >/dev/null
          continue
        fi

        notify "${session_id}" "task_started" "Executing: $(echo "${content}" | cut -c1-140)" >/dev/null
        set +e
        if [[ "${content}" == sh:* || "${content}" == cmd:* ]]; then
          if [[ "${content}" == sh:* ]]; then
            content="${content#sh: }"
          else
            content="${content#cmd: }"
          fi

          if command -v timeout >/dev/null 2>&1; then
            output="$(timeout "${timeout_secs}" bash -lc "${content}" 2>&1)"
            rc=$?
          elif command -v gtimeout >/dev/null 2>&1; then
            output="$(gtimeout "${timeout_secs}" bash -lc "${content}" 2>&1)"
            rc=$?
          else
            output="$(bash -lc "${content}" 2>&1)"
            rc=$?
            if [[ $rc -eq 0 ]]; then
              output="[no-timeout-binary-found, ran without timeout] ${output}"
            fi
          fi
        else
          last_msg_file="$(mktemp)"
          output="$(/Applications/Codex.app/Contents/Resources/codex exec \
            --dangerously-bypass-approvals-and-sandbox \
            --cd "${WORKDIR}" \
            --output-last-message "${last_msg_file}" \
            "${content}" </dev/null 2>&1)"
          rc=$?
          if [[ $rc -eq 0 && -s "${last_msg_file}" ]]; then
            output="$(cat "${last_msg_file}")"
          fi
          rm -f "${last_msg_file}"
        fi
        set -e

        if [[ $rc -eq 0 ]]; then
          notify "${session_id}" "task_completed" "Success (exit 0): $(echo "${output}" | tr '\n' ' ' | cut -c1-500)" >/dev/null
        elif [[ $rc -eq 124 ]]; then
          notify "${session_id}" "error" "Command timed out after ${timeout_secs}s: $(echo "${content}" | cut -c1-140)" >/dev/null
        else
          notify "${session_id}" "error" "Failed (exit ${rc}): $(echo "${output}" | tr '\n' ' ' | cut -c1-500)" >/dev/null
        fi
      done < <(echo "${response}" | jq -r '.[] | select(.read == false) | .id')

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
  poll-telegram-exec)
    [[ $# -eq 2 ]] || { usage; exit 1; }
    poll_telegram_exec "$2"
    ;;
  *)
    usage
    exit 1
    ;;
esac
