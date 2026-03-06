---
name: inspect
description: >
  Inspect and debug live streaming agent sessions to understand what the agent did.
  Use this skill when the user wants to see what happened in a recent agent run,
  trace through the tool calls step by step, debug unexpected agent behavior, or
  get a readable narrative of a session. Trigger on phrases like "show me what my
  agent did", "inspect session", "what happened in that run", "debug my agent",
  "trace through session", "walk me through the last run", "what tools did it call".
  Requires `agentevals serve --dev` to be running. For scoring/pass-fail evaluation,
  use /eval instead.
---

Help the user understand what happened in a live streaming agent session.

If `list_sessions` or `summarize_session` fail with a connection error, the server
is not running. Tell the user:

```bash
uv run agentevals serve --dev
```

The `--dev` flag is required — plain `serve` does not enable the WebSocket endpoint
that sessions stream to. Also note: sessions are in-memory only with a **2-hour TTL**.
If the server was restarted or the session is older than 2 hours, it is gone.

1. **List sessions** with `list_sessions`. Show session ID, completion status,
   span count, and start time. Default to the most recent completed session
   unless the user specifies one.

2. **Summarize** with `summarize_session`. This converts raw OTLP spans into
   structured invocations with user messages, tool calls, and agent responses.

3. **Present as a readable narrative.** For each turn:
   ```
   Turn 1:
     User: [what the user asked]
     Tools: tool_name(arg=val, ...) → [one-line description of what this achieves]
     Response: [response text, truncated if long]
   ```

4. **Flag anything worth investigating:**
   - Turns with no tool calls when tools would be expected
   - Empty or very short response after a long tool chain
   - Same tool called repeatedly in one turn (possible loop)
   - Abrupt stop mid-conversation

5. **Offer next steps.** If the user wants to *score* the session against a golden
   reference (pass/fail), suggest `/eval` with the session ID or a comparison run.
