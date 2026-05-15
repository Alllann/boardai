import { NextResponse } from "next/server";

import { MAX_BRIEF_CHARS } from "@/lib/board-constants";
import { runBoardSession } from "@/lib/board-runner";

/** Long-running board: many sequential Cursor agent calls. */
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("brief" in body) ||
    typeof (body as { brief: unknown }).brief !== "string"
  ) {
    return NextResponse.json(
      { error: 'Expected JSON body: { "brief": string }' },
      { status: 400 },
    );
  }

  const brief = (body as { brief: string }).brief.trim();
  if (!brief) {
    return NextResponse.json({ error: "brief must be non-empty" }, { status: 400 });
  }
  if (brief.length > MAX_BRIEF_CHARS) {
    return NextResponse.json(
      { error: `brief exceeds ${MAX_BRIEF_CHARS} characters` },
      { status: 413 },
    );
  }

  try {
    const result = await runBoardSession(brief);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("CURSOR_API_KEY")) {
      return NextResponse.json(
        { error: message, code: "config" },
        { status: 503 },
      );
    }
    if (
      message.includes("Invalid meeting plan") ||
      message.includes("Invalid briefing")
    ) {
      return NextResponse.json(
        { error: message, code: "validation" },
        { status: 422 },
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
    console.error("[board] POST error", e);
    return NextResponse.json(
      { error: message, code: "unknown" },
      { status: 500 },
    );
  }
}
