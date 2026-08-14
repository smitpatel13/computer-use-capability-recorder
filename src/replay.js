import fs from "node:fs";
import { DEFAULT_POLICY } from "./config.js";
import { RunLogger, newRunId } from "./logger.js";
import { BrowserSurface } from "./surface.js";
import { HandoffManager } from "./handoff.js";

export async function replay({
  artifactPath,
  inputs,
  headless = true,
  allowHuman = true,
  evidenceDir = "evidence/runs"
}) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const logger = new RunLogger({ runId: newRunId("replay"), dir: evidenceDir, policy: DEFAULT_POLICY });
  const surface = await new BrowserSurface({ policy: DEFAULT_POLICY, logger, headless }).start();
  const handoff = new HandoffManager({ logger });
  const outputs = {};
  try {
    logger.event("replay.started", { artifact: artifact.capability, inputs });
    validateInputs(artifact, inputs);
    for (const step of artifact.steps) {
      logger.event("replay.step_started", { stepId: step.id, type: step.type });
      if (step.type === "navigate") {
        await surface.act({ type: "navigate", url: interpolate(step.urlTemplate, inputs) });
      }
      if (step.type === "type") {
        await surface.act({
          type: "type",
          target: step.target,
          value: String(inputs[step.parameter] ?? "")
        });
      }
      if (step.type === "click") {
        await surface.act({ type: "click", target: step.target });
      }
      if (step.type === "extract") {
        const business = await detectBusinessOutcome(surface, step);
        if (business?.code === "business_not_found") {
          const result = { status: "business_not_found", outputs: business.output };
          logger.event("replay.completed", result);
          logger.writeJson("result.json", result);
          return result;
        }
        if (business?.code === "human_intervention_required") {
          if (!allowHuman) {
            const result = {
              status: "human_intervention_required",
              reason: business.interventionReason,
              stepId: step.id
            };
            logger.event("replay.completed", result);
            logger.writeJson("result.json", result);
            return result;
          }
          await handoff.request({
            surface,
            reason: business.interventionReason,
            capability: artifact.capability.name,
            stepId: step.id
          });
          await handoff.simulateOperatorApproval({ surface, memberId: inputs.memberId });
        }
        for (const [key, spec] of Object.entries(step.outputs)) {
          outputs[key] = await surface.extract(spec.target);
        }
      }
      if (step.checkpoint) await surface.waitFor(step.checkpoint);
      logger.event("replay.step_completed", { stepId: step.id });
    }
    const result = { status: "success", outputs };
    logger.event("replay.completed", result);
    logger.writeJson("result.json", result);
    await logger.screenshot(surface.page, "replay-final.png");
    return result;
  } catch (error) {
    await logger.screenshot(surface.page, "failure.png").catch(() => {});
    const result = {
      status: "failure",
      error: {
        name: error.name,
        message: error.message
      }
    };
    logger.event("replay.failed", result);
    logger.writeJson("result.json", result);
    return result;
  } finally {
    await surface.stop();
  }
}

function validateInputs(artifact, inputs) {
  for (const [key, spec] of Object.entries(artifact.contract.inputs)) {
    if (spec.required && !(key in inputs)) throw new Error(`Missing required input: ${key}`);
    if (spec.pattern && !new RegExp(spec.pattern).test(String(inputs[key]))) {
      throw new Error(`Input ${key} does not match ${spec.pattern}`);
    }
  }
}

function interpolate(template, inputs) {
  const url = new URL(template);
  if (url.searchParams.has("memberId")) url.searchParams.set("memberId", inputs.memberId);
  return url.toString();
}

async function detectBusinessOutcome(surface, step) {
  for (const outcome of step.businessOutcomes || []) {
    if (outcome.when?.type === "text" && (await surface.textExists(outcome.when.value))) return outcome;
  }
  return null;
}
