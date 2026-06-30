import os from "node:os";

import type { AgentOptions } from "@cursor/sdk";
import type { SDKMessage } from "@cursor/sdk";

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

function extractAssistantText(message: SDKMessage): string | null {
  if (message.type !== "assistant") return null;
  return message.message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
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

export async function runPromptStreaming(
  prompt: string,
  options: AgentOptions,
  onDelta: (delta: string) => void | Promise<void>,
  abortSignal?: AbortSignal,
): Promise<{ text: string; runId: string }> {
  const { Agent, CursorAgentError } = await import("@cursor/sdk");
  let runId = "";
  let seenText = "";

  const emitFromFullText = async (full: string) => {
    if (full.length <= seenText.length) return;
    const delta = full.slice(seenText.length);
    seenText = full;
    if (delta) await onDelta(delta);
  };

  try {
    const agent = await Agent.create(options);
    try {
      if (abortSignal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const run = await agent.send(prompt, {
        onDelta: async ({ update }) => {
          if (abortSignal?.aborted) return;
          const record = update as Record<string, unknown>;
          const type = typeof record.type === "string" ? record.type : "";
          if (type.includes("text") || type.includes("token")) {
            const piece =
              typeof record.text === "string"
                ? record.text
                : typeof record.delta === "string"
                  ? record.delta
                  : "";
            if (piece) await emitFromFullText(seenText + piece);
          }
        },
      });
      runId = run.id;

      for await (const event of run.stream()) {
        if (abortSignal?.aborted) {
          await run.cancel().catch(() => undefined);
          throw new DOMException("Aborted", "AbortError");
        }
        const text = extractAssistantText(event);
        if (text) await emitFromFullText(text);
      }

      const result = await run.wait();
      if (result.status === "error") {
        throw new Error(`Agent run finished with error status (run ${result.id})`);
      }

      const finalText = (result.result ?? seenText).trim();
      if (!finalText) {
        throw new Error(`Agent returned empty result (run ${result.id})`);
      }
      if (finalText.length > seenText.length) {
        await emitFromFullText(finalText);
      }
      return { text: finalText, runId: result.id || runId };
    } finally {
      agent.close();
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw e;
    }
    if (e instanceof CursorAgentError) {
      throw new Error(`Cursor agent failed to start: ${e.message}`);
    }
    throw e;
  }
}
