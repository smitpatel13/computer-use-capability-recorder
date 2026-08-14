import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createTargetServer } from "../src/target-app.js";
import { memberBalanceArtifact } from "../src/artifact-schema.js";
import { replay } from "../src/replay.js";

test("replay returns success outputs and business not found outcomes", async () => {
  const { server } = await createTargetServer();
  const artifactPath = "work/test.capability.json";
  fs.mkdirSync("work", { recursive: true });
  fs.writeFileSync(
    artifactPath,
    JSON.stringify(memberBalanceArtifact({ targetUrl: "http://127.0.0.1:4173/app" }), null, 2)
  );
  try {
    const success = await replay({
      artifactPath,
      inputs: { memberId: "12345" },
      evidenceDir: "work/test-runs"
    });
    assert.equal(success.status, "success");
    assert.equal(success.outputs.savingsBalance, "$4,218.77");

    const notFound = await replay({
      artifactPath,
      inputs: { memberId: "00000" },
      evidenceDir: "work/test-runs"
    });
    assert.equal(notFound.status, "business_not_found");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
