import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnvFiles();

import { Agent } from "@cursor/sdk";
import type { AgentOptions, SDKMessage } from "@cursor/sdk";

async function listTools(label: string, options: AgentOptions) {
  await using agent = await Agent.create(options);
  const run = await agent.send('Reply with exactly: ok');
  const initTools: string[] = [];
  const called: string[] = [];
  for await (const msg of run.stream()) {
    if (msg.type === "system" && msg.subtype === "init" && msg.tools) {
      initTools.push(...msg.tools);
    }
    if (msg.type === "tool_call") called.push(msg.name);
  }
  await run.wait();
  console.log(`\n=== ${label} ===`);
  console.log("init tools:", initTools.length ? initTools.sort().join(", ") : "(none in stream)");
  console.log("tools called:", called.length ? called.join(", ") : "(none)");
}

async function main() {
  const apiKey = process.env.CURSOR_API_KEY!;
  const base = { apiKey, model: { id: "composer-2" as const } };

  await listTools("Board AI config (settingSources: [])", {
    ...base,
    local: { cwd: process.cwd(), settingSources: [] },
  });

  await listTools("settingSources: all", {
    ...base,
    local: { cwd: process.cwd(), settingSources: ["all"] },
  });

  await listTools("sandbox enabled", {
    ...base,
    local: {
      cwd: process.cwd(),
      settingSources: [],
      sandboxOptions: { enabled: true },
    },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
