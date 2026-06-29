/**
 * Verify whether Agent.prompt (same path as Board AI) can invoke web search.
 * Run: pnpm exec tsx scripts/verify-agent-web-search.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
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
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

import { Agent } from "@cursor/sdk";
import type { SDKMessage } from "@cursor/sdk";

import { getAgentOptions } from "../lib/agent-client";

const PROMPT = `You must use web search if available to answer this.

What is today's date, and what is one major news headline from today?

Reply ONLY with JSON (no markdown):
{"date":"YYYY-MM-DD","headline":"...","web_search_used":true or false}`;

function collectFromMessage(msg: SDKMessage, state: {
  tools: string[];
  toolCalls: Array<{ name: string; status: string; args?: unknown }>;
}) {
  if (msg.type === "system" && msg.subtype === "init" && msg.tools) {
    state.tools.push(...msg.tools);
  }
  if (msg.type === "tool_call") {
    state.toolCalls.push({
      name: msg.name,
      status: msg.status,
      args: msg.args,
    });
  }
}

async function verifyViaStream(): Promise<{
  tools: string[];
  toolCalls: Array<{ name: string; status: string; args?: unknown }>;
  result?: string;
  runId: string;
  status: string;
}> {
  const options = getAgentOptions();
  const state = { tools: [] as string[], toolCalls: [] as Array<{ name: string; status: string; args?: unknown }> };

  await using agent = await Agent.create(options);
  const run = await agent.send(PROMPT);

  for await (const msg of run.stream()) {
    collectFromMessage(msg, state);
  }

  const finished = await run.wait();
  return {
    ...state,
    result: finished.result,
    runId: finished.id,
    status: finished.status,
  };
}

async function verifyViaPrompt(): Promise<{
  result?: string;
  runId: string;
  status: string;
  toolCalls: Array<{ name: string; status: string; args?: unknown }>;
  tools: string[];
}> {
  const options = getAgentOptions();
  const finished = await Agent.prompt(PROMPT, options);

  const toolCalls: Array<{ name: string; status: string; args?: unknown }> = [];
  const tools: string[] = [];

  // Inspect the completed run the same way Board AI could (if it chose to).
  const run = await Agent.getRun(finished.id, { runtime: "local", cwd: process.cwd() });
  if (run.supports("stream")) {
    for await (const msg of run.stream()) {
      collectFromMessage(msg, { tools, toolCalls });
    }
  }

  return {
    result: finished.result,
    runId: finished.id,
    status: finished.status,
    toolCalls,
    tools,
  };
}

function summarize(label: string, data: {
  tools: string[];
  toolCalls: Array<{ name: string; status: string; args?: unknown }>;
  result?: string;
  runId: string;
  status: string;
}) {
  console.log(`\n=== ${label} ===`);
  console.log("runId:", data.runId);
  console.log("status:", data.status);
  console.log("available_tools:", data.tools.length ? data.tools.join(", ") : "(none reported)");
  console.log(
    "tool_calls:",
    data.toolCalls.length
      ? data.toolCalls.map((t) => `${t.name}(${t.status})`).join(", ")
      : "(none)",
  );
  if (data.toolCalls.length > 0) {
    for (const t of data.toolCalls) {
      console.log("  -", t.name, t.status, JSON.stringify(t.args)?.slice(0, 200));
    }
  }
  console.log("result:", data.result?.slice(0, 400));
  const webSearchCalls = data.toolCalls.filter((t) =>
    /web.?search/i.test(t.name),
  );
  console.log("web_search_invoked:", webSearchCalls.length > 0 ? "YES" : "NO");
}

async function main() {
  console.log("Runtime:", process.env.CURSOR_AGENT_RUNTIME ?? "local (default)");
  console.log("Model: composer-2");
  console.log("Prompt asks agent to web-search for today's date + headline.\n");

  console.log("Test 1: Agent.create + stream (observable tool calls)...");
  const streamed = await verifyViaStream();
  summarize("Agent.create + stream", streamed);

  console.log("\nTest 2: Agent.prompt (Board AI path) + post-hoc run inspection...");
  const prompted = await verifyViaPrompt();
  summarize("Agent.prompt", prompted);

  const anyWebSearch =
    streamed.toolCalls.some((t) => /web.?search/i.test(t.name)) ||
    prompted.toolCalls.some((t) => /web.?search/i.test(t.name));

  console.log("\n=== VERDICT ===");
  if (anyWebSearch) {
    console.log("Web search CAN be invoked through the Cursor agent runtime.");
  } else if (streamed.tools.some((t) => /web.?search/i.test(t))) {
    console.log(
      "WebSearch tool is AVAILABLE but was not invoked in this run (model answered without it).",
    );
  } else {
    console.log(
      "Web search was NOT available or NOT invoked in this run. Check tool list above.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
