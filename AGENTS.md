<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Package manager

This repo uses **pnpm only**. Do not use `npm`, `yarn`, or `bun` for installs, scripts, or lockfile changes.

- Install dependencies: `pnpm install`
- Run scripts: `pnpm run <script>` or `pnpm <script>` (e.g. `pnpm dev`, `pnpm build`)
- Add packages: `pnpm add <pkg>` / `pnpm add -D <pkg>`
- Lockfile: `pnpm-lock.yaml` (never create or update `package-lock.json` or `yarn.lock`)
