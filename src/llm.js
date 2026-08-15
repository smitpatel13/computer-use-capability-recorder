export class OfflinePlanner {
  async decide({ goal, observation }) {
    if (observation.url === "about:blank") {
      return { type: "navigate", reason: "Open the target app before interacting." };
    }
    if (observation.text.includes("Member Search")) {
      const memberId = (goal.match(/\b\d{5}\b/) || ["12345"])[0];
      if (!observation.text.includes(memberId)) {
        return {
          type: "type",
          reason: "Enter the member ID requested by the goal.",
          target: {
            candidates: [
              { kind: "label", value: "Member ID" },
              { kind: "css", value: "input[name='memberId']" }
            ]
          },
          value: memberId
        };
      }
      return {
        type: "click",
        reason: "Submit the search form.",
        target: {
          candidates: [
            { kind: "role", role: "button", name: "Search" },
            { kind: "css", value: "button[type='submit']" }
          ]
        }
      };
    }
    if (observation.text.includes("Member Details") || observation.text.includes("No member found")) {
      return { type: "done", reason: "The requested terminal state is visible." };
    }
    if (observation.text.includes("Operator approval required")) {
      return { type: "escalate", reason: "Restricted record requires human approval." };
    }
    return { type: "escalate", reason: "Planner cannot identify a safe next step." };
  }
}

export function normalizeDecision(decision) {
  if (!decision || typeof decision !== "object") {
    return { type: "escalate", reason: "Planner returned a non-object decision." };
  }
  if (decision.type) return decision;
  for (const type of ["navigate", "type", "click", "done", "escalate"]) {
    if (decision[type] && typeof decision[type] === "object") {
      return { type, ...decision[type] };
    }
  }
  return {
    type: "escalate",
    reason: `Planner returned an unsupported decision shape: ${JSON.stringify(decision).slice(0, 300)}`
  };
}

export class OpenAIPlanner {
  constructor({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-5-mini" } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required for --llm openai");
  }

  async decide({ goal, target, observation }) {
    const body = {
      model: this.model,
      input: [
        {
          role: "system",
          content:
            "You drive a legacy UI safely. Return only compact JSON for one action: navigate, type, click, done, or escalate. Use semantic targets where possible."
        },
        {
          role: "user",
          content: JSON.stringify({
            goal,
            target,
            observation,
            actionSchema: {
              navigate: { type: "navigate", url: target },
              type: { type: "type", target: { candidates: [] }, value: "..." },
              click: { type: "click", target: { candidates: [] } },
              done: { type: "done" },
              escalate: { type: "escalate", reason: "..." }
            }
          })
        }
      ]
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`OpenAI planner failed: ${response.status} ${await response.text()}`);
    const json = await response.json();
    const text = json.output_text || json.output?.flatMap((o) => o.content || []).map((c) => c.text).join("");
    return normalizeDecision(JSON.parse(text));
  }
}
