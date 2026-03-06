---
name: eval
description: >
  Evaluate and score agent behavior against a golden reference. Use this skill
  whenever the user wants to run evaluation, check pass/fail status, understand
  metric scores, compare sessions for regressions, validate agent behavior, or
  score a trace from a file or a live session. Trigger on phrases like "eval this
  trace", "check my agent output", "did my agent do the right thing", "compare runs",
  "did my agent regress", "score session X", "evaluate against golden", "run evals".
  Works with both local trace files and live streaming sessions.
---

Evaluate agent behavior and explain what the scores mean.

## Determine the input type

First, figure out what to evaluate:
- **Trace file(s)** — user mentions a `.json` or `.jsonl` file path → use `evaluate_traces`
- **Sessions vs golden** — user has multiple live sessions and wants regression testing → use `evaluate_sessions`
- **Single live session** — user wants to score one session against a golden eval set → guide them to use `evaluate_sessions` with one session as golden

## Evaluating trace files

1. Get the file path(s). Check the extension:
   `.jsonl` → `trace_format: "otlp-json"` | `.json` → `"jaeger-json"` (default)

2. Ask if they have a golden eval set JSON. For `tool_trajectory_avg_score` (the
   default metric), an eval set is required — it provides the expected tool call
   sequence to compare against. If they don't have one yet, explain this and suggest
   starting with `hallucinations_v1`, or ask if they want to create a golden set from
   a reference run first.

3. Call `evaluate_traces` with the file(s), format, and eval set.

4. Present results as a score table (see Score interpretation below) and explain failures.

## Evaluating sessions (regression testing)

This workflow requires the server to be running with the `--dev` flag (which enables
WebSocket and session streaming). Plain `agentevals serve` will not have sessions.
If you get a connection error from any tool below, tell the user:

```bash
uv run agentevals serve --dev
```

1. Call `list_sessions` to show available sessions.

2. Help the user identify the "golden" session — the reference run that represents
   correct behavior. The server derives the eval set from it automatically.

3. Call `evaluate_sessions(golden_session_id=...)`. This scores all other completed
   sessions against the golden.

4. Present a comparison table:
   ```
   Session             | Score | Status  | Delta
   session-abc (golden)| 1.00  | —       | baseline
   session-def         | 0.85  | PASSED  | -0.15
   session-ghi         | 0.40  | FAILED  | -0.60 ⚠️
   ```

5. Explain regressions specifically: which tools the golden called that a failing
   session skipped, or unexpected extra calls. Concrete tool names are more useful
   than just quoting the score.

## Score interpretation

| Score | Meaning |
|-------|---------|
| 1.0 | Exact match — right tools, right order |
| 0.7–0.9 | Minor deviations (extra call or slightly different args) |
| 0.5–0.7 | Partial match — some turns correct, others missing or wrong tool calls |
| 0.0–0.5 | Major divergence — most tool calls don't match golden |

**Important:** `evalStatus: PASSED` does **not** mean the agent did well — it only means
the score met the configured threshold. Without a configured threshold, every session
shows PASSED regardless of score. Focus on the numeric score, not the status label.

## After results

If the user wants to understand *what the agent did* step by step (not just the score),
suggest `/inspect` to get a readable narrative of a session.
