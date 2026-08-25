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
| `/planlaegning/arshjul` | Årshjul med kurser pr. måned |
| `/planlaegning/kurser` | Kursusliste med status og fyldning |
| `/planlaegning/kurser/[id]` | Kursusdetalje med faner (mock) |
| `/kommunikation` | Kampagner og e-mail-skabeloner |
| `/tilmeldinger` | Tilmeldinger og betalingsstatus |
| `/afvikling` | Afvikling og deltagerlister |
| `/oekonomi` | Økonomi og KOMiT-synk (mock) |
| `/katalog` | Offentligt kursuskatalog |
| `/katalog/[id]` | Tilmeldingsside (mock) |

## Præsentationstips

1. Start på `/overblik` for arkitektur og sammenhænge
2. Gå til `/dashboard` for dagligt overblik
3. Vis et kursus under `/planlaegning/kurser/kur-001`
4. Afslut med `/katalog` for deltagerperspektiv

## Teknisk

- Next.js 16, TypeScript, Tailwind CSS
- Mockdata i `src/lib/mock-data.ts`
- Ingen database, auth eller betaling — kun UI
