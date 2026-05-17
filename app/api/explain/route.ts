import { NextResponse } from "next/server";

import { getAgentOptions, runPromptForText } from "@/lib/agent-client";
import {
  EXPLAIN_MAX_SELECTION_CHARS,
  EXPLAIN_MIN_SELECTION_CHARS,
} from "@/lib/board-constants";
import { onDemandExplainPrompt } from "@/lib/explain-prompts";
import { explainRequestSchema, explainResponseSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = explainRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors.join("; ") || "Invalid request" },
      { status: 400 },
    );
  }

  const selection = parsed.data.selection.trim();
  if (selection.length < EXPLAIN_MIN_SELECTION_CHARS) {
    return NextResponse.json(
      {
        error: `Selection must be at least ${EXPLAIN_MIN_SELECTION_CHARS} characters`,
      },
      { status: 400 },
    );
  }
  if (selection.length > EXPLAIN_MAX_SELECTION_CHARS) {
    return NextResponse.json(
      {
        error: `Selection must be at most ${EXPLAIN_MAX_SELECTION_CHARS} characters`,
      },
      { status: 400 },
    );
  }

  try {
    const options = getAgentOptions();
    const { text, runId } = await runPromptForText(
      onDemandExplainPrompt({ ...parsed.data, selection }),
      options,
    );
    console.info("[explain] run", runId);
    const explanation = explainResponseSchema.parse({ explanation: text.trim() });
    return NextResponse.json(explanation);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("CURSOR_API_KEY")) {
      return NextResponse.json(
        { error: message, code: "config" },
        { status: 503 },
      );
    }
    if (
      message.includes("Cursor agent failed") ||
      message.includes("Agent run finished") ||
      message.includes("Agent returned empty")
    ) {
      return NextResponse.json(
        { error: message, code: "agent" },
        { status: 502 },
      );
    }
    console.error("[explain] POST error", e);
    return NextResponse.json(
      { error: message, code: "unknown" },
      { status: 500 },
    );
  }
}
