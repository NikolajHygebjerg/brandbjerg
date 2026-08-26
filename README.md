# Kursusplatform — Ledelses-mockup

Interaktiv mockup af en custom kursusplatform til højskole. Bygget til præsentation for ledelsen — viser sider, funktioner og sammenhænge uden fuld backend.

## Offentligt link (telefon & tablet)

**Live (opdateres automatisk ved deploy):** https://temporary-agile-boron-nfvvr9v.vercel.app

**Fast domæne (når sat op i Vercel):** https://brandbjerg-kurser.vercel.app

### Commit og deploy efter rettelser

```bash
npm run ship -- "Beskrivelse af ændringen"
```

Anbefalede sider på telefonen:
- `/overblik` — ledelsespræsentation
- `/planlaegning/arshjul` — modul 1 (Brandbjerg 2026-data fra CSV)
- `/planlaegning/statusark` — statusark med uge-for-uge tilmeldinger fra database
- `/planlaegning/kurser/sa26-7` — modul 2 (eksempel: Bridge og Højskole)

## Start mockuppen lokalt

```bash
npm install
npm run dev
```

Åbn [http://localhost:4317](http://localhost:4317)

## Indhold

| Side | Beskrivelse |
|------|-------------|
| `/` | Forside med indgang til alle dele |
| `/overblik` | Ledelsesoverblik: arkitektur, roller, integrationer, faser |
| `/dashboard` | Admin KPI og aktivitetslog |
| `/planlaegning/arshjul` | Årshjul — mål, ugeplan, godkendelse |
| `/planlaegning/statusark` | Statusark med tilmeldte og link til kursusplan |
| `/planlaegning/kurser/[id]` | Modul 2 — kursusleder, budget, modulplan, UBAK |
| `/kommunikation` | Kampagner og e-mail-skabeloner |
| `/tilmeldinger` | Tilmeldinger og betalingsstatus |
| `/afvikling` | Afvikling og deltagerlister |
| `/oekonomi` | Økonomi og KOMiT-synk (mock) |
| `/pedel` | Pedel og rengøring — lokalespecifikationer |
| `/kontor` | Kontor — kursusliste, tilmeldte, værelsesplacering |
| `/kontor/vaerelser` | Værelsesoversigt (108 dobbeltværelser, uge-for-uge) |
| `/kontor/[id]` | Kursusadministration for kontorpersonale |
| `/katalog/[id]` | Tilmeldingsside (mock) |

## Præsentationstips

1. Start på `/overblik` for arkitektur og sammenhænge
2. Gå til `/planlaegning/arshjul` — sæt mål, tilføj kurser pr. uge, godkend plan
3. Åbn `/planlaegning/statusark` — se tilmeldte og klik ind på kursus
4. Vis `/planlaegning/kurser/kur-001` — modulplan med UBAK-felter
5. Afslut med `/katalog` for deltagerperspektiv

## Teknisk

- Next.js 16, TypeScript, Tailwind CSS
- Mockdata i `src/lib/mock-data.ts`
- Ingen database, auth eller betaling — kun UI
# brandbjerg
# brandbjerg
