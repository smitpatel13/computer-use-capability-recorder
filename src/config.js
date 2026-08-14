export const DEFAULT_POLICY = {
  allowedOrigins: ["http://127.0.0.1:4173", "http://localhost:4173"],
  allowedRoutes: ["/app", "/member", "/handoff"],
  allowedActions: ["navigate", "click", "type", "extract", "waitFor"],
  riskyActions: ["submit_wire", "close_account", "open_sub_account"],
  redactKeys: ["ssn", "taxId", "password", "token", "authorization", "memberName"]
};

export const MEMBERS = {
  "12345": {
    id: "12345",
    name: "Avery Stone",
    savingsBalance: "$4,218.77",
    checkingBalance: "$812.10",
    status: "Active",
    ssn: "[masked]"
  },
  "24680": {
    id: "24680",
    name: "Jordan Kim",
    savingsBalance: "$9,041.02",
    checkingBalance: "$205.42",
    status: "Active",
    ssn: "[masked]"
  },
  "99999": {
    id: "99999",
    name: "Restricted Member",
    savingsBalance: "$0.00",
    checkingBalance: "$0.00",
    status: "Restricted",
    ssn: "[masked]"
  }
};
