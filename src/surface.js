import { chromium } from "playwright";
import { assertAllowed } from "./policy.js";

export class BrowserSurface {
  constructor({ policy, logger, headless = true }) {
    this.policy = policy;
    this.logger = logger;
    this.headless = headless;
  }

  async start() {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext({ viewport: { width: 1280, height: 800 } });
    this.page = await this.context.newPage();
    return this;
  }

  async stop() {
    await this.browser?.close();
  }

  async observe() {
    const text = await this.page.locator("body").innerText().catch(() => "");
    const url = this.page.url();
    const title = await this.page.title().catch(() => "");
    const controls = await this.page
      .locator("input,button,a,select,textarea")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          tag: node.tagName.toLowerCase(),
          text: node.innerText || node.value || node.getAttribute("aria-label") || "",
          name: node.getAttribute("name"),
          id: node.id,
          role: node.getAttribute("role"),
          href: node.getAttribute("href")
        }))
      )
      .catch(() => []);
    return { url, title, text, controls };
  }

  async act(action) {
    assertAllowed(action, this.policy);
    this.logger?.event("surface.action", action);
    if (action.type === "navigate") {
      await this.page.goto(action.url, { waitUntil: "domcontentloaded" });
      return;
    }
    if (action.type === "type") {
      const locator = await this.resolve(action.target, action.type);
      await locator.fill(action.value);
      return;
    }
    if (action.type === "click") {
      const locator = await this.resolve(action.target, action.type);
      await locator.click();
      await this.page.waitForLoadState("domcontentloaded").catch(() => {});
      return;
    }
    if (action.type === "waitFor") {
      await this.waitFor(action.condition, action.timeoutMs);
      return;
    }
    throw new Error(`Unsupported action: ${action.type}`);
  }

  async resolve(target, actionType) {
    const errors = [];
    for (const candidate of normalizeTargetCandidates(target, actionType)) {
      try {
        const locator = this.locatorFor(candidate).first();
        await locator.waitFor({ state: "visible", timeout: 1500 });
        return locator;
      } catch (error) {
        errors.push({ candidate, error: error.message });
      }
    }
    throw new Error(`Could not resolve target: ${JSON.stringify(errors)}`);
  }

  locatorFor(candidate) {
    const value = candidate.value ?? candidate.label ?? candidate.name ?? candidate.text ?? candidate.selector;
    if (candidate.kind === "label") return this.page.getByLabel(value);
    if (candidate.kind === "role") return this.page.getByRole(candidate.role, { name: value });
    if (candidate.kind === "text") return this.page.getByText(value);
    if (candidate.kind === "css") return this.page.locator(value);
    throw new Error(`Unknown locator candidate: ${candidate.kind}`);
  }

  async textExists(value) {
    return (await this.page.getByText(value).count()) > 0;
  }

  async waitFor(condition, timeoutMs = 4000) {
    if (condition.type === "text") {
      await this.page.getByText(condition.value).waitFor({ timeout: timeoutMs });
      return true;
    }
    if (condition.type === "oneOfText") {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        for (const value of condition.values) {
          if (await this.textExists(value)) return true;
        }
        await this.page.waitForTimeout(100);
      }
      throw new Error(`Timed out waiting for one of: ${condition.values.join(", ")}`);
    }
    throw new Error(`Unsupported checkpoint: ${condition.type}`);
  }

  async extract(target) {
    const locator = await this.resolve(target);
    return (await locator.innerText()).trim();
  }
}

export function normalizeTargetCandidates(target = {}, actionType) {
  return (target.candidates || [target]).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    if (candidate.kind) {
      const value = candidate.value ?? candidate.label ?? candidate.name ?? candidate.text ?? candidate.selector;
      const canonical = { ...candidate, value };
      if (actionType === "click" && candidate.kind === "label") {
        return [
          { kind: "role", role: "button", name: value },
          { kind: "text", value },
          canonical
        ];
      }
      return [canonical];
    }
    const normalized = [];
    if (candidate.id) normalized.push({ kind: "css", value: `#${cssEscape(candidate.id)}` });
    if (candidate.name) normalized.push({ kind: "css", value: `[name="${cssAttrEscape(candidate.name)}"]` });
    if (candidate.tag && candidate.text) {
      normalized.push({ kind: "text", value: candidate.text });
    }
    if (candidate.tag && candidate.name && candidate.tag.toLowerCase() === "input") {
      normalized.push({ kind: "label", value: candidate.name });
    }
    return normalized.length ? normalized : [candidate];
  });
}

function cssEscape(value) {
  return String(value).replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function cssAttrEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
