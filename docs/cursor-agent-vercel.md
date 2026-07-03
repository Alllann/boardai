# Local Cursor Agent on Vercel

## Problem

We wanted the Cursor SDK to run in **local** mode on Vercel, not cloud.

Local agents need a writable home directory for internal state (SQLite, run store, etc.). On Vercel serverless:

- The deployment root **`/var/task` is read-only**
- **`HOME` is set to `/var/task`**, so the SDK cannot write there
- The only writable path is **`/tmp`**

We tried setting `HOME=/tmp` in the Vercel dashboard, but **`HOME` is a reserved env var** — Vercel will not let you override it.

Separately, local mode also needs the **Linux native SDK binary** (`@cursor/sdk-linux-x64`) to be installed and built on Vercel's linux-x64 runners, and kept out of the Next.js bundle.

## Solution

**1. Redirect `HOME` and `TMPDIR` in code at startup**

In `lib/agent-client.ts`, before any SDK call:

```ts
function ensureWritableHomeForServerless(): void {
  if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) return;
  const tmp = os.tmpdir(); // /tmp on Vercel
  if (!process.env.HOME || process.env.HOME === "/var/task") {
    process.env.HOME = tmp;
  }
  if (!process.env.TMPDIR) {
    process.env.TMPDIR = tmp;
  }
}
```

This mutates `process.env` inside the Node process, which Vercel allows, without setting `HOME` in the dashboard.

**2. Default to local runtime on Vercel**

`resolveAgentRuntime()` uses local unless `CURSOR_AGENT_RUNTIME=cloud` is explicitly set. Vercel no longer auto-switches to cloud.

**3. Ship the Linux native SDK on Vercel builds**

- `next.config.ts` — add `@cursor/sdk-linux-x64` to `serverExternalPackages`
- `package.json` — add `@cursor/sdk-linux-x64` to `pnpm.onlyBuiltDependencies`

Set `CURSOR_API_KEY` in Vercel env vars. Agent state in `/tmp` is ephemeral per invocation; the app only keeps LLM output text.
