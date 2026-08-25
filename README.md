# Kursusplatform — Ledelses-mockup

Interaktiv mockup af en custom kursusplatform til højskole. Bygget til præsentation for ledelsen — viser sider, funktioner og sammenhænge uden fuld backend.

## Start mockuppen

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
| `/katalog` | Offentligt kursuskatalog |
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
