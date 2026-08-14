import fs from "node:fs";
import path from "node:path";
import { redact } from "./redaction.js";

export class RunLogger {
  constructor({ runId, dir = "evidence/runs", policy }) {
    this.runId = runId;
    this.dir = path.join(dir, runId);
    this.events = [];
    this.policy = policy;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  event(type, data = {}) {
    const entry = {
      ts: new Date().toISOString(),
      runId: this.runId,
      type,
      data: redact(data, this.policy)
    };
    this.events.push(entry);
    fs.writeFileSync(path.join(this.dir, "events.jsonl"), JSON.stringify(entry) + "\n", {
      flag: "a"
    });
    return entry;
  }

  writeJson(name, data) {
    fs.writeFileSync(path.join(this.dir, name), JSON.stringify(redact(data, this.policy), null, 2));
  }

  async screenshot(page, name) {
    const file = path.join(this.dir, name);
    await page.screenshot({ path: file, fullPage: true });
    this.event("evidence.screenshot", { file });
    return file;
  }
}

export function newRunId(prefix) {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}
