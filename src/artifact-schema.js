export const ARTIFACT_SCHEMA_VERSION = "capability.v1";

export function memberBalanceArtifact({ targetUrl }) {
  return {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    capability: {
      name: "lookup_member_savings_balance",
      version: "1.0.0",
      status: "draft",
      summary: "Looks up a member by ID and returns the savings balance from a legacy UI.",
      owner: "automation-platform"
    },
    tenantProfile: {
      vendor: "LegacyCoreSim",
      product: "MemberServicing",
      tenant: "base",
      routePattern: "/member?memberId=:memberId"
    },
    contract: {
      inputs: {
        memberId: { type: "string", required: true, pii: false, pattern: "^[0-9]{5}$" }
      },
      outputs: {
        memberName: { type: "string", pii: true },
        memberStatus: { type: "string", pii: false },
        savingsBalance: { type: "string", pii: false }
      },
      outcomes: ["success", "business_not_found", "human_intervention_required", "failure"]
    },
    guardrails: {
      allowedOrigins: ["http://127.0.0.1:4173", "http://localhost:4173"],
      allowedRoutes: ["/app", "/member", "/handoff"],
      allowedActions: ["navigate", "click", "type", "extract", "waitFor"],
      riskyActionPolicy: "block_or_escalate"
    },
    steps: [
      {
        id: "open-search",
        type: "navigate",
        urlTemplate: targetUrl,
        checkpoint: { type: "text", value: "Member Search" }
      },
      {
        id: "enter-member-id",
        type: "type",
        parameter: "memberId",
        target: {
          strategy: "semantic-first",
          candidates: [
            { kind: "label", value: "Member ID" },
            { kind: "role", role: "textbox", name: "Member ID" },
            { kind: "css", value: "input[name='memberId']" }
          ],
          robustnessNotes:
            "Prefer label/accessibility targeting, with CSS name fallback for hostile legacy markup."
        }
      },
      {
        id: "submit-search",
        type: "click",
        target: {
          strategy: "semantic-first",
          candidates: [
            { kind: "role", role: "button", name: "Search" },
            { kind: "text", value: "Search" },
            { kind: "css", value: "button[type='submit']" }
          ]
        },
        checkpoint: {
          type: "oneOfText",
          values: ["Member Details", "No member found", "Operator approval required"]
        }
      },
      {
        id: "extract-result",
        type: "extract",
        outputs: {
          memberName: {
            target: { candidates: [{ kind: "css", value: "[data-field='member-name']" }] }
          },
          memberStatus: {
            target: { candidates: [{ kind: "css", value: "[data-field='member-status']" }] }
          },
          savingsBalance: {
            target: { candidates: [{ kind: "css", value: "[data-field='savings-balance']" }] }
          }
        },
        businessOutcomes: [
          {
            code: "business_not_found",
            when: { type: "text", value: "No member found" },
            output: { reason: "No member matched the supplied memberId." }
          },
          {
            code: "human_intervention_required",
            when: { type: "text", value: "Operator approval required" },
            interventionReason: "Restricted member record requires a human operator."
          }
        ],
        checkpoint: { type: "text", value: "Savings" }
      }
    ],
    createdAt: new Date().toISOString()
  };
}
