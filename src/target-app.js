import http from "node:http";
import { MEMBERS } from "./config.js";

const css = `
body{font-family:Arial,sans-serif;margin:0;background:#eef1f4;color:#1e2933}
header{background:#0f3b4a;color:white;padding:14px 22px}
main{max-width:920px;margin:24px auto;background:white;border:1px solid #c8d0d8;padding:20px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #cfd8df;padding:10px;text-align:left}
label{font-weight:bold}.error{background:#fff1f2;border:1px solid #f4a3ad;padding:12px}.notice{background:#fff8db;border:1px solid #e1c65a;padding:12px}
button{padding:8px 14px;background:#145c74;color:white;border:0}.field{margin:14px 0}
`;

function layout(body) {
  return `<!doctype html><html><head><title>LegacyCoreSim</title><style>${css}</style></head><body><header><strong>LegacyCoreSim</strong> Member Servicing</header><main>${body}</main></body></html>`;
}

function searchPage(message = "") {
  return layout(`
    <h1>Member Search</h1>
    ${message}
    <form method="GET" action="/member">
      <table aria-label="Search form"><tr><td><label for="memberId">Member ID</label></td><td><input id="memberId" name="memberId" autocomplete="off"></td></tr></table>
      <p><button type="submit">Search</button></p>
    </form>
  `);
}

function memberPage(member) {
  return layout(`
    <h1>Member Details</h1>
    <table aria-label="Member details">
      <tr><th>Field</th><th>Value</th></tr>
      <tr><td>Name</td><td data-field="member-name">${member.name}</td></tr>
      <tr><td>Status</td><td data-field="member-status">${member.status}</td></tr>
      <tr><td>Savings</td><td data-field="savings-balance">${member.savingsBalance}</td></tr>
      <tr><td>Checking</td><td>${member.checkingBalance}</td></tr>
      <tr><td>Tax ID</td><td>${member.ssn}</td></tr>
    </table>
    <p><a href="/app">Back to search</a></p>
  `);
}

function handoffPage(memberId) {
  return layout(`
    <h1>Operator approval required</h1>
    <div class="notice">Member ${memberId} is restricted. Automation paused and routed to a human operator.</div>
    <form method="GET" action="/member">
      <input type="hidden" name="memberId" value="${memberId}">
      <input type="hidden" name="approved" value="1">
      <p><button type="submit">Approve and resume</button></p>
    </form>
  `);
}

export function createTargetServer({ port = 4173 } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader("content-type", "text/html; charset=utf-8");
    if (url.pathname === "/" || url.pathname === "/app") {
      res.end(searchPage());
      return;
    }
    if (url.pathname === "/handoff") {
      res.end(handoffPage(url.searchParams.get("memberId") || ""));
      return;
    }
    if (url.pathname === "/member") {
      const memberId = url.searchParams.get("memberId") || "";
      const member = MEMBERS[memberId];
      if (!member) {
        res.end(searchPage(`<div class="error">No member found for ${memberId}</div>`));
        return;
      }
      if (member.status === "Restricted" && url.searchParams.get("approved") !== "1") {
        res.writeHead(302, { location: `/handoff?memberId=${encodeURIComponent(memberId)}` });
        res.end();
        return;
      }
      res.end(memberPage(member));
      return;
    }
    res.statusCode = 404;
    res.end(layout("<h1>Not found</h1>"));
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve({ server, port }));
  });
}
