# Deploy til Vercel

## Live mockup (opdateres ved hver deploy)

**https://temporary-agile-boron-nfvvr9v.vercel.app**

Seneste deploy inkluderer bl.a. årshjul, statusark og Nyt år-fix.

## Automatisk commit + deploy efter rettelser

Fra projektroden:

```bash
npm run ship -- "Beskrivelse af rettelsen"
```

Dette script:
1. Committer alle ændringer (hvis der er nogen)
2. Pusher til `origin/main`
3. Deployer til Vercel produktion

Cloud Agent kører dette efter hver kodeændring.

## Manuel deploy

```bash
npm run deploy          # produktion
npm run deploy:preview  # preview-URL
```

Kræver Vercel CLI (`npx vercel`) — projektet er linket til `brandbjerg-kurser`.

## Fast domæne brandbjerg-kurser.vercel.app

Hvis `brandbjerg-kurser.vercel.app` giver 404:

1. [vercel.com/dashboard](https://vercel.com/dashboard) → projekt **brandbjerg-kurser**
2. **Settings → Domains** → tilføj `brandbjerg-kurser.vercel.app`
3. Kør `npm run deploy`

## Anbefalede sider på telefon

- `/overblik`
- `/planlaegning/arshjul`
- `/planlaegning/statusark`
- `/planlaegning/kurser/sa26-7`
- `/katalog`
