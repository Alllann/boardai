import { MAX_BRIEF_CHARS } from "@/lib/board-constants";
import type { BoardEmitEvent, BoardStreamEvent } from "@/lib/board-events";
import { runBoardSessionWithEvents } from "@/lib/board-runner";

export const maxDuration = 300;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("brief" in body) ||
    typeof (body as { brief: unknown }).brief !== "string"
  ) {
    return new Response(
      JSON.stringify({ error: 'Expected JSON body: { "brief": string }' }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const brief = (body as { brief: string }).brief.trim();
  if (!brief) {
    return new Response(JSON.stringify({ error: "brief must be non-empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (brief.length > MAX_BRIEF_CHARS) {
    return new Response(
      JSON.stringify({ error: `brief exceeds ${MAX_BRIEF_CHARS} characters` }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (obj: BoardStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };
      try {
        await runBoardSessionWithEvents(
          brief,
          async (event: BoardEmitEvent) => {
            write(event);
          },
        );
        write({ type: "done" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        write({ type: "error", message });
        write({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
