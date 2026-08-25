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
