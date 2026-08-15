import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTargetCandidates } from "../src/surface.js";

test("normalizes raw observed controls into locator candidates", () => {
  assert.deepEqual(normalizeTargetCandidates({ candidates: [{ id: "memberId", name: "memberId", tag: "input" }] }), [
    { kind: "css", value: "#memberId" },
    { kind: "css", value: '[name="memberId"]' },
    { kind: "label", value: "memberId" }
  ]);
});
