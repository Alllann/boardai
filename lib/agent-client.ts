import type { AgentOptions } from "@cursor/sdk";

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key?.trim()) {
    throw new Error("CURSOR_API_KEY is not set");
  }
  return key.trim();
}

export function getLocalAgentOptions(): AgentOptions {
  return {
    apiKey: getApiKey(),
    model: { id: "composer-2" },
    local: { cwd: process.cwd(), settingSources: [] },
  };
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
