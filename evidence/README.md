# Evidence

This folder contains a regenerated vertical slice:

- `member-balance.capability.json` - saved reusable capability artifact.
- `runs/discovery-2026-08-15T00-19-46-371Z/` - discovery run evidence and recorded artifact.
- `runs/replay-2026-08-15T00-20-13-168Z/` - replay happy path with extracted outputs.
- `runs/replay-2026-08-15T00-20-11-118Z/` - replay with `business_not_found`.
- `runs/replay-2026-08-15T00-20-07-116Z/` - replay with restricted member handoff and resume.

The checked-in discovery was produced with the offline planner so the project can be exercised without model credentials. Run the README command with `--llm openai` and `OPENAI_API_KEY` set to regenerate genuine LLM discovery evidence for final submission.
