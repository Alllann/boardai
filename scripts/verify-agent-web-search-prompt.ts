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
import type { SDKMessage } from "@cursor/sdk";
import { getAgentOptions } from "../lib/agent-client";

const PROMPT = `If you have a tool literally named WebSearch, you MUST call it once.
Search: "Reuters top world news May 28 2026".
Reply ONLY JSON: {"tools_called":["..."],"headline":"..."}`;

async function inspectPromptRun() {
  const options = getAgentOptions();
  const finished = await Agent.prompt(PROMPT, options);

  const run = await Agent.getRun(finished.id, { runtime: "local", cwd: process.cwd() });
  const tools: string[] = [];
  const calls: Array<{ name: string; status: string; args?: unknown }> = [];

  if (run.supports("stream")) {
    for await (const msg of run.stream()) {
      if (msg.type === "system" && msg.subtype === "init" && msg.tools) {
        tools.push(...msg.tools);
      }
      if (msg.type === "tool_call") {
        calls.push({ name: msg.name, status: msg.status, args: msg.args });
      }
    }
  }

  console.log("=== Agent.prompt (Board AI path) ===");
  console.log("runId:", finished.id);
  console.log("status:", finished.status);
  console.log("init tools:", tools.length ? tools.join(", ") : "(none)");
  console.log(
    "tool calls:",
    calls.length ? calls.map((c) => c.name).join(", ") : "(none)",
  );
  for (const c of calls) {
    console.log(" ", c.name, c.status, JSON.stringify(c.args)?.slice(0, 180));
  }
  console.log("result:", finished.result?.slice(0, 400));
  console.log(
    "WebSearch invoked:",
    calls.some((c) => /web.?search/i.test(c.name)) ? "YES" : "NO",
  );
}

inspectPromptRun().catch((e) => {
  console.error(e);
  process.exit(1);
});
