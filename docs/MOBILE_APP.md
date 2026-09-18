# Mobilapp (Flutter) — arkitektur

## Sideløbende med web

| Del | Placering | Formål |
|-----|-----------|--------|
| Eksisterende admin/kontor/kursist-web | `/` (Next.js) | Uændret UX, localStorage-demo |
| REST API til mobil | `/api/v1/*` | JSON til Flutter |
| Flutter-app | `apps/brandbjerg_app/` | iOS, Android, web |

Ingen filer i roden er flyttet eller overskrevet.

## Data i dag

Webappen gemmer plan, tilmeldinger og auth primært i **browser localStorage**. Mobil-API’et læser:

- **Statusark / kursusliste** (TypeScript-kildedata på server)
- **Mock-deltagere** (`generateParticipantsForCourse`) — samme logik som kontor-demo
- **Demo-program** for 5-dages kurser uden gemt plan (Program_UBAK-skabelon)

Når I får en **fælles database** (Postgres, Supabase, …), skal både Next.js og `/api/v1` pege på den — Flutter ændres ikke, kun API-implementeringen.

## API (v1)

| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| POST | `/api/v1/auth/login` | `{ email, password }` → token + bruger |
| GET | `/api/v1/me` | Bearer token |
| GET | `/api/v1/kursist/enrollments` | Kursists kurser |
| GET | `/api/v1/staff/courses?year=2026` | Medarbejder-kursusliste |
| GET | `/api/v1/courses/:id/program` | Program (kursist skal være tilmeldt) |

Auth: HMAC-token (`MOBILE_API_SECRET` i miljø). Demo bruger seed-brugere fra `auth-seed.ts`.

## Flutter-funktioner (0.1)

- Login kursist / medarbejder
- Kursist: liste tilmeldinger, se program
- Medarbejder: kursoversigt, se program

Planlagt: beskeder, evaluering (Eva), push, offline — som separate features mod samme API.

## CORS

API svar inkluderer `Access-Control-Allow-Origin: *` så Flutter web og native kan kalde Vercel under udvikling.
