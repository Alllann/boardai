import os from "node:os";

import type { AgentOptions } from "@cursor/sdk";

function ensureWritableHomeForServerless(): void {
  if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  const tmp = os.tmpdir();
  if (!process.env.HOME || process.env.HOME === "/var/task") {
    process.env.HOME = tmp;
  }
  if (!process.env.TMPDIR) {
    process.env.TMPDIR = tmp;
  }
}

ensureWritableHomeForServerless();

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key?.trim()) {
    throw new Error("CURSOR_API_KEY is not set");
  }
  return key.trim();
}

/** Local by default (including Vercel). Cloud only when CURSOR_AGENT_RUNTIME=cloud. */
function resolveAgentRuntime(): "local" | "cloud" {
  const override = process.env.CURSOR_AGENT_RUNTIME?.trim().toLowerCase();
  if (override === "cloud") {
    return "cloud";
  }
  return "local";
}

export function getAgentOptions(): AgentOptions {
  const base = {
    apiKey: getApiKey(),
    model: { id: "composer-2" as const },
  };

  if (resolveAgentRuntime() === "cloud") {
    return {
      ...base,
      cloud: {
        env: { type: "cloud" },
        skipReviewerRequest: true,
      },
    };
  }

  return {
    ...base,
    local: { cwd: process.cwd(), settingSources: [] },
  };
}

/** @deprecated Use getAgentOptions — kept for scripts. */
export function getLocalAgentOptions(): AgentOptions {
  return getAgentOptions();
}

export async function runPromptForText(
  prompt: string,
  options: AgentOptions,
): Promise<{ text: string; runId: string }> {
  const { Agent, CursorAgentError } = await import("@cursor/sdk");
  try {
    const result = await Agent.prompt(prompt, options);
    if (result.status === "error") {
      throw new Error(`Agent run finished with error status (run ${result.id})`);
    }
    const text = result.result?.trim();
    if (!text) {
      throw new Error(`Agent returned empty result (run ${result.id})`);
    }
    return { text, runId: result.id };
  } catch (e) {
    if (e instanceof CursorAgentError) {
      throw new Error(`Cursor agent failed to start: ${e.message}`);
    }
    throw e;
  }
}
