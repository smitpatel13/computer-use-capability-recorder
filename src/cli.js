#!/usr/bin/env node
import { createTargetServer } from "./target-app.js";
import { discover } from "./discovery.js";
import { replay } from "./replay.js";

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command, inputs: {} };
  for (let i = 0; i < rest.length; i++) {
    const item = rest[i];
    if (item === "--input") {
      const [key, value] = rest[++i].split("=");
      args.inputs[key] = value;
    } else if (item.startsWith("--")) {
      args[item.slice(2)] = rest[++i];
    }
  }
  return args;
}

async function withServer(fn) {
  const { server } = await createTargetServer();
  try {
    return await fn();
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const args = parseArgs(process.argv.slice(2));

if (args.command === "discover") {
  await withServer(async () => {
    const result = await discover({
      goal: args.goal,
      target: args.target,
      out: args.out || "evidence/member-balance.capability.json",
      llm: args.llm || "offline",
      headless: args.headless !== "false"
    });
    console.log(JSON.stringify(result, null, 2));
  });
} else if (args.command === "replay") {
  await withServer(async () => {
    const result = await replay({
      artifactPath: args.artifact,
      inputs: args.inputs,
      headless: args.headless !== "false",
      allowHuman: args.human !== "false"
    });
    console.log(JSON.stringify(result, null, 2));
  });
} else if (args.command === "serve-target") {
  const { port } = await createTargetServer();
  console.log(`LegacyCoreSim listening on http://127.0.0.1:${port}/app`);
} else {
  console.error("Usage: node src/cli.js discover|replay|serve-target ...");
  process.exit(1);
}
