import { DEFAULT_POLICY } from "./config.js";

export class PolicyViolation extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PolicyViolation";
    this.details = details;
  }
}

export function assertAllowed(action, policy = DEFAULT_POLICY) {
  if (!policy.allowedActions.includes(action.type)) {
    throw new PolicyViolation(`Action type is not allowlisted: ${action.type}`, { action });
  }
  if (policy.riskyActions.includes(action.intent)) {
    throw new PolicyViolation(`Risky action requires human approval: ${action.intent}`, { action });
  }
  if (action.type === "navigate") {
    const url = new URL(action.url);
    if (!policy.allowedOrigins.includes(url.origin)) {
      throw new PolicyViolation(`Origin is not allowlisted: ${url.origin}`, { url: action.url });
    }
    if (!policy.allowedRoutes.some((route) => url.pathname.startsWith(route))) {
      throw new PolicyViolation(`Route is not allowlisted: ${url.pathname}`, { url: action.url });
    }
  }
}
