/**
 * Deep inspection of Agent.prompt run messages for tool usage.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

const PROMPT = `Use web search. What is the exact current spot price of Bitcoin in USD right now? Reply ONLY JSON: {"btc_usd": number, "as_of": "ISO timestamp"}`;

function summarizeMessages(messages: SDKMessage[]) {
  const typeCounts: Record<string, number> = {};
  const toolNames: string[] = [];
  const toolUseBlocks: Array<{ name: string; input: unknown }> = [];

  for (const msg of messages) {
    typeCounts[msg.type] = (typeCounts[msg.type] ?? 0) + 1;

    if (msg.type === "system" && msg.subtype === "init" && msg.tools) {
      toolNames.push(...msg.tools);
    }
    if (msg.type === "tool_call") {
      toolNames.push(`call:${msg.name}`);
    }
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "tool_use") {
          toolUseBlocks.push({ name: block.name, input: block.input });
        }
      }
    }
  }

  return { typeCounts, toolNames, toolUseBlocks };
}

async function main() {
  const options = getAgentOptions();
  await using agent = await Agent.create(options);
  const run = await agent.send(PROMPT);

  const streamMessages: SDKMessage[] = [];
  for await (const msg of run.stream()) {
    streamMessages.push(msg);
  }
  const finished = await run.wait();

  let conversation: unknown = null;
  if (run.supports("conversation")) {
    conversation = await run.conversation();
  }

  let agentMessages: unknown = null;
  try {
    agentMessages = await Agent.messages.list(agent.agentId, {
      runtime: "local",
      cwd: process.cwd(),
    });
  } catch (e) {
    agentMessages = { error: String(e) };
  }

  const summary = summarizeMessages(streamMessages);

  const report = {
    runId: finished.id,
    agentId: agent.agentId,
    status: finished.status,
    result: finished.result,
    streamSummary: summary,
    streamMessages,
    conversation,
    agentMessages,
  };

  const outPath = join(process.cwd(), "scripts", "verify-web-search-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("runId:", finished.id);
  console.log("status:", finished.status);
  console.log("result:", finished.result?.slice(0, 300));
  console.log("stream message types:", summary.typeCounts);
  console.log("init/call tool names:", summary.toolNames.length ? summary.toolNames : "(none)");
  console.log("assistant tool_use blocks:", summary.toolUseBlocks);
  console.log("conversation supported:", run.supports("conversation"));
  console.log("Full report:", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
