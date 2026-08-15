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

test("expands click label candidates into button-friendly locators", () => {
  assert.deepEqual(normalizeTargetCandidates({ candidates: [{ kind: "label", value: "Search" }] }, "click"), [
    { kind: "role", role: "button", name: "Search" },
    { kind: "text", value: "Search" },
    { kind: "label", value: "Search" }
  ]);
});
