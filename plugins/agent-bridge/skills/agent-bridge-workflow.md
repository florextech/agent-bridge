# Agent Bridge Workflow

Use MCP tools to keep the user informed via Agent Bridge while working.

## Available MCP tools

- `notify` — Send notification (task_started, task_completed, needs_review, needs_approval, error, test_results, message)
- `check_responses` — Check for unread Telegram messages
- `mark_read` — Mark responses as read
- `wait_for_response` — Block until the user responds (handles polling internally)
- `list_sessions` — List all sessions
- `create_session` — Create a new session
- `delete_session` — Delete a session

## Recommended sequence

1. Use `create_session` if no session exists.
2. Use `notify` with type `task_started` before a substantial task.
3. Use `notify` with type `message` for progress updates on long-running work.
4. Use `notify` with type `task_completed` after finishing.
5. When you need user input, use `notify` to ask, then `wait_for_response` to wait for the answer.

## Telegram mode

When the user says "Telegram" or "communicate via Telegram":

1. Send confirmation: `notify` with type `message` and summary "Telegram mode active".
2. Use `wait_for_response` to wait for instructions.
3. Process each instruction, send results via `notify`.
4. Call `wait_for_response` again for the next instruction.
5. Repeat until the user says "done" or "back to terminal".

## Script fallbacks

If MCP tools are unavailable, use the bash scripts:

- `scripts/agent_setup.sh create-session`
- `scripts/agent_setup.sh notify <session_id> <event_type> <summary>`
- `scripts/agent_setup.sh check-responses <session_id>`
- `scripts/agent_setup.sh mark-read <session_id>`
- `scripts/agent_setup.sh poll-telegram <session_id>`
