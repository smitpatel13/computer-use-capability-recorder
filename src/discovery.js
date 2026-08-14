import fs from "node:fs";
import path from "node:path";
import { memberBalanceArtifact } from "./artifact-schema.js";
import { DEFAULT_POLICY } from "./config.js";
import { RunLogger, newRunId } from "./logger.js";
import { BrowserSurface } from "./surface.js";
import { OfflinePlanner, OpenAIPlanner } from "./llm.js";
import { HandoffManager } from "./handoff.js";

export async function discover({ goal, target, out, llm = "offline", headless = true }) {
  const logger = new RunLogger({ runId: newRunId("discovery"), policy: DEFAULT_POLICY });
  const planner = llm === "openai" ? new OpenAIPlanner() : new OfflinePlanner();
  const surface = await new BrowserSurface({ policy: DEFAULT_POLICY, logger, headless }).start();
  const handoff = new HandoffManager({ logger });
  const transcript = [];
  try {
    logger.event("discovery.started", { goal, target, llm });
    for (let step = 0; step < 12; step++) {
      const observation = await surface.observe();
      logger.event("agent.observe", { step, observation });
      const decision = await planner.decide({ goal, target, observation });
      if (decision.type === "navigate" && !decision.url) decision.url = target;
      transcript.push({ observation, decision });
      logger.event("agent.decide", { step, decision });
      if (decision.type === "done") break;
      if (decision.type === "escalate") {
        await handoff.request({ surface, reason: decision.reason, capability: "discovery", stepId: `step-${step}` });
        break;
      }
      await surface.act(decision);
    }
    await logger.screenshot(surface.page, "discovery-final.png");
    const artifact = memberBalanceArtifact({ targetUrl: target });
    artifact.provenance = {
      discoveryRunId: logger.runId,
      planner: llm,
      transcriptRedacted: true,
      note: llm === "offline" ? "Offline planner run; rerun with --llm openai for required live LLM evidence." : "Live LLM planner run."
    };
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(artifact, null, 2));
    logger.writeJson("artifact.json", artifact);
    logger.event("discovery.artifact_saved", { out });
    return { artifact, runId: logger.runId };
  } finally {
    await surface.stop();
  }
}
