import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDecision } from "../src/llm.js";

test("normalizes wrapped model action responses", () => {
  assert.deepEqual(
    normalizeDecision({
      navigate: { type: "navigate", url: "http://127.0.0.1:4173/app" }
    }),
    { type: "navigate", url: "http://127.0.0.1:4173/app" }
  );
});
