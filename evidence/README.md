# Evidence

This folder contains a regenerated vertical slice:

- `member-balance.capability.json` - saved reusable capability artifact.
- `runs/discovery-2026-08-14T23-18-54-169Z/` - discovery run evidence and recorded artifact.
- `runs/replay-2026-08-14T23-19-17-824Z/` - replay happy path with extracted outputs.
- `runs/replay-2026-08-14T23-19-19-057Z/` - replay with `business_not_found`.
- `runs/replay-2026-08-14T23-19-20-527Z/` - replay with restricted member handoff and resume.

The checked-in discovery was produced with the offline planner so the project can be exercised without model credentials. Run the README command with `--llm openai` and `OPENAI_API_KEY` set to regenerate genuine LLM discovery evidence for final submission.
