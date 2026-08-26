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
2. Pusher til `origin` og `github` på nuværende branch (typisk `main`)
3. Forsøger Vercel CLI deploy — fejler CLI'en, deployer GitHub-push alligevel via Vercel Git-integration

Cloud Agent kører dette **automatisk efter hver kodeændring** (se `.cursor/rules/ship-after-changes.mdc`).

### Deploy-strategi (kort)

| Metode | Hvornår | Kræver |
|--------|---------|--------|
| **Vercel Git-integration** | Automatisk ved push til `main` på GitHub | Vercel-projekt koblet til repo (allerede sat op) |
| **`npm run ship`** | Efter lokale/agent-ændringer | Commit + push til `github`/`origin` |
| **GitHub Actions** | Ved push til `main` | Valgfrit — se nedenfor |

Primær produktions-deploy sker via **Vercel Git-integration**. `npm run ship` pusher til GitHub og udløser den. GitHub Actions kører altid `npm ci` + `npm run build` som CI; CLI-deploy derfra er kun ekstra, hvis secrets er sat.

### GitHub Actions

Workflow `.github/workflows/vercel-deploy.yml` kører ved push til `main`:

1. **Bygger altid** (`npm ci`, `npm run build`) — verificerer at koden kompilerer.
2. **Deployer kun via CLI**, hvis disse secrets er sat under repo → Settings → Secrets and variables → Actions:

| Secret | Værdi |
|--------|-------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | `team_gY7y55YQgvGEYLjfaiWYXX6G` |
| `VERCEL_PROJECT_ID` | `prj_vFCcBxdFsNYFJYadQ3gkBMPlFUBA` |

Uden secrets er workflow'et stadig grønt efter build — deploy sker via Vercel Git-integration.

#### Hvad betyder "No jobs were run"?

GitHub viser det, når workflow-filen er **ugyldig**, så ingen jobs kan starte (0 sekunder, rød markering). Tidligere version brugte `secrets` direkte i et `if:`-udtryk, hvilket GitHub Actions ikke tillader — det gav præcis den fejl. Rettelsen bruger i stedet job-`env` og tjekker `env.VERCEL_TOKEN` i step-`if`.

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
