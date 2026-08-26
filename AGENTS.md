# Agent-instruktioner — Brandbjerg mockup

## Efter hver rettelse (obligatorisk)

Kør **altid** dette når der er lavet kodeændringer — også små rettelser:

```bash
npm run ship -- "Kort beskrivelse af rettelsen"
```

Det committer, pusher til Cursor-origin og GitHub (`main`), og deployer til Vercel.

Push til GitHub udløser automatisk produktions-deploy via Vercel Git-integration. Hvis Vercel CLI fejler i Cloud Agent-miljøet, er GitHub-push nok.

Valgfrit: tilføj `VERCEL_TOKEN`, `VERCEL_ORG_ID` og `VERCEL_PROJECT_ID` som GitHub-secrets for deploy via Actions (`.github/workflows/vercel-deploy.yml`).

## Live URL

- **Produktion:** https://brandbjerg-kurser.vercel.app
- **Alternativ:** https://temporary-agile-boron-nfvvr9v.vercel.app

## Dev server

```bash
npm run dev   # port 4317
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
