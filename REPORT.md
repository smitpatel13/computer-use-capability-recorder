# Architecture

The system is a single-process vertical slice with clean boundaries: a target surface, a planner, a recorder, a capability artifact, a deterministic replay engine, policy enforcement, evidence logging, and handoff. I chose a local legacy-style web app rather than a public site so the demo is reproducible, safe, and can exercise banking-like outcomes without credentials or real PII.

Discovery uses an observe -> decide -> act loop. The surface adapter observes the current page, including visible text and controls, and executes semantic actions through Playwright. The planner is swappable: `OpenAIPlanner` performs a genuine model-driven run when `OPENAI_API_KEY` is present, while `OfflinePlanner` keeps tests and reviewer setup deterministic. Replay never calls the planner.

# Artifact schema

The artifact is the product boundary. It is versioned (`capability.v1`), named, typed, and reviewable. It declares input parameters, output shapes, expected outcomes, guardrails, tenant/vendor metadata, ordered steps, locator candidates, checkpoints, and business outcome detectors.

Locator strategy is semantic-first: labels, roles, and visible text are tried before CSS fallbacks. This mirrors the real environment where test IDs are usually absent and raw DOM selectors are brittle. Each target can carry multiple candidates plus notes about robustness. The contract distinguishes agent-supplied inputs from extracted outputs so the artifact can become a callable capability.

# Determinism & error handling

Replay executes the saved steps in order with fixed waits, checkpoints, locator candidate resolution, and typed inputs. It verifies checkpoints after state-changing actions instead of assuming clicks worked. The result contract separates `success`, `business_not_found`, `human_intervention_required`, and `failure`.

Runtime exceptions are modeled directly. A missing member is a business outcome and returns a structured result, not an exception. A restricted member triggers handoff. Locator failures, invalid inputs, policy violations, and unmet checkpoints become failures with evidence. Screenshots and JSONL events are written per run under `evidence/runs/`.

# Heterogeneity & multi-tenant

The artifact does not depend on Playwright-specific selectors as its primary concept. It describes targets as control candidates and leaves perception/action to the surface adapter. A desktop adapter could resolve the same target concepts through an accessibility tree or screenshot/coordinate strategy, while the replay engine would still consume the same capability steps.

For multi-tenant reuse, the artifact includes a vendor/product/tenant profile and route pattern. In production I would keep a base artifact per vendor flow, then layer tenant/version overrides for branding, route prefixes, labels, and locator candidates. Drift detection would compare replay checkpoints, accessibility snapshots, and locator success rates across tenants before promoting an artifact from draft to approved.

# Escalation & handoff

When automation reaches a state it cannot safely continue from, it creates an intervention request containing capability name, step ID, current observation, reason, and screenshot. The browser session is not discarded. Control is marked as human, the mock operator approves the restricted record on the same page, and control returns to automation, which continues extraction.

The operator UI is intentionally minimal, but the control-transfer model is real: pause, preserve session, let a human act, record the human action, then resume.

# Safety

Policy is explicit and enforced before every action: allowed origins, routes, and action types are checked centrally. Risky intents such as account closure or wire submission are blocked or escalated. Artifacts and logs are redacted for secrets and regulated identifiers such as SSNs and long account-like numbers.

The prototype does not implement authentication, secrets storage, or role-based approval queues. Those would be required before production use in a financial institution.

# Cuts

I cut broad infrastructure: queues, a database, full approval workflow, desktop automation, multi-tenant storage, and real-time co-browsing. Those are important, but less central than the artifact/replay contract.

With more time I would add artifact approval states, N-run stability scoring, a small capability catalog API, cross-tenant override examples, and bounded model-assisted recovery for one failed replay step.
