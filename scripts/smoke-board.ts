/**
 * Smoke test: verifies CURSOR_API_KEY and local Agent.prompt.
 * Run from repo root: pnpm smoke:board
 */
import { Agent } from "@cursor/sdk";

import { getLocalAgentOptions } from "../lib/board-runner";

async function main() {
  const options = getLocalAgentOptions();
  const result = await Agent.prompt(
    'Reply with exactly the word "ok" and nothing else.',
    options,
  );
  if (result.status === "error") {
    console.error("Run error", result.id, result);
    process.exit(2);
  }
  console.log("status:", result.status);
  console.log("result:", result.result);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
