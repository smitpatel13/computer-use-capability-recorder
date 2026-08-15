import { DEFAULT_POLICY } from "./config.js";

const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const LONG_NUMBER = /\b\d{12,19}\b/g;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const SENSITIVE_KEYS = new Set(["ssn", "taxid", "password", "token", "authorization", "membername"]);

export function redact(value, policy = DEFAULT_POLICY) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, policy));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        const sensitive = SENSITIVE_KEYS.has(normalizedKey);
        const primitive = child == null || typeof child !== "object";
        return [key, sensitive && primitive ? "[REDACTED]" : redact(child, policy)];
      })
    );
  }
  if (typeof value !== "string") return value;
  return value
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(SSN, "[REDACTED_SSN]")
    .replace(LONG_NUMBER, "[REDACTED_NUMBER]");
}
