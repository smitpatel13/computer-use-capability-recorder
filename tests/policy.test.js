import test from "node:test";
import assert from "node:assert/strict";
import { assertAllowed, PolicyViolation } from "../src/policy.js";
import { redact } from "../src/redaction.js";

test("policy blocks navigation outside the allowlist", () => {
  assert.throws(
    () => assertAllowed({ type: "navigate", url: "https://example.com/app" }),
    PolicyViolation
  );
});

test("policy blocks risky intents", () => {
  assert.throws(
    () => assertAllowed({ type: "click", intent: "close_account" }),
    /Risky action requires human approval/
  );
});

test("redaction removes regulated identifiers and sensitive keys", () => {
  assert.deepEqual(redact({ ssn: "123-45-6789", note: "card 4111111111111111" }), {
    ssn: "[REDACTED]",
    note: "card [REDACTED_NUMBER]"
  });
});
