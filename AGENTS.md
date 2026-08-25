# Agent-instruktioner — Brandbjerg mockup

## Efter hver rettelse

Kør altid commit, push og deploy når der er lavet kodeændringer:

```bash
chmod +x scripts/ship.sh
./scripts/ship.sh "Kort beskrivelse af rettelsen"
```

Eller manuelt:

```bash
git add -A && git commit -m "..." && git push -u origin main
npm run deploy
```

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
