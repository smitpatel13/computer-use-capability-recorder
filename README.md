# Capability Recorder

This is a focused take-home prototype for an AI computer-use automation layer:

1. An LLM-driven discovery run operates a live UI.
2. The successful run is recorded as a typed, reviewable capability artifact.
3. Production replay executes that artifact deterministically with no model in the loop.
4. Runtime business outcomes, hard failures, safety guardrails, evidence, and human handoff are explicit.

The target is a local "LegacyCoreSim" member-servicing app built to resemble a stable but unfriendly back-office surface: table layout, minimal semantics, no test IDs, and realistic exceptional states.

## Setup

```bash
npm install
npx playwright install chromium
```

No secrets are required for deterministic replay or offline tests.

For the required genuine LLM discovery run, set:

```bash
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-5-mini
```

## Demo Path

Run a discovery pass and save the capability artifact:

```bash
npm run demo:discover
```

Run the production path with no model involved:

```bash
npm run demo:replay
```

Show an expected business outcome:

```bash
npm run demo:not-found
```

Show human-in-the-loop escalation and resume on the same live browser session:

```bash
npm run demo:escalate
```

Run a live LLM discovery instead of the offline planner:

```bash
node src/cli.js discover \
  --llm openai \
  --goal "look up member 12345 and read their current savings balance" \
  --target http://127.0.0.1:4173/app \
  --out evidence/member-balance.capability.json
```

## Tests

```bash
npm test
```

## Repository Map

- `src/target-app.js` - local legacy-style banking proxy surface.
- `src/discovery.js` - observe/decide/act loop and artifact recording.
- `src/replay.js` - deterministic executor and result contract.
- `src/artifact-schema.js` - typed capability artifact shape.
- `src/surface.js` - Playwright browser surface abstraction.
- `src/policy.js` and `src/redaction.js` - guardrails and data handling.
- `src/handoff.js` - live-session human handoff mechanism.
- `evidence/` - sample artifact and run logs/screenshots.

## Notes

The checked-in discovery evidence was generated with `--llm openai`; the artifact provenance records that planner. The offline planner exists so tests and reviewer setup do not require paid model access.
