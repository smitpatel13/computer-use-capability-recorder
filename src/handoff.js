export class HandoffManager {
  constructor({ logger }) {
    this.logger = logger;
  }

  async request({ surface, reason, capability, stepId }) {
    const context = await surface.observe();
    const screenshot = await this.logger.screenshot(surface.page, "handoff-request.png");
    const request = {
      status: "pending",
      reason,
      capability,
      stepId,
      context,
      screenshot,
      control: "human"
    };
    this.logger.event("handoff.requested", request);
    return request;
  }

  async simulateOperatorApproval({ surface, memberId }) {
    this.logger.event("handoff.control_transferred", { to: "human" });
    await surface.page.getByRole("button", { name: "Approve and resume" }).click();
    await surface.page.waitForLoadState("domcontentloaded").catch(() => {});
    this.logger.event("handoff.operator_action", {
      actor: "mock-operator",
      action: "approved_restricted_member",
      memberId
    });
    this.logger.event("handoff.control_transferred", { to: "automation" });
  }
}
