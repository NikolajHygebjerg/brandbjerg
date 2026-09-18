# Brandbjerg app (Flutter)

Mobil- og web-app til **kursister** og **medarbejdere**, der kører **sideløbende** med Next.js-mockuppen i repo-roden. Den deler data via **`/api/v1/*`** på samme backend (senere jeres rigtige database).

## Første gang

**Fejlsøgning (flutter not found, port 4317, git push):** se [QUICKSTART.da.md](./QUICKSTART.da.md).

1. Installer Flutter — Mac: `brew install --cask flutter` · Linux/agent: `bash scripts/install-flutter.sh` fra repo-roden (se [QUICKSTART.da.md](./QUICKSTART.da.md)).
2. Opret platform-mapper (engang):

```bash
cd apps/brandbjerg_app
flutter create . --org dk.brandbjerg --project-name brandbjerg_app --platforms=android,ios,web
flutter pub get
```

3. Start Next.js API lokalt (fra repo-roden):

```bash
npm run dev
```

4. Kør appen:

```bash
# Web
flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:4317

# Android-emulator
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4317

# iOS-simulator
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:4317
```

Produktion: `--dart-define=API_BASE_URL=https://brandbjerg-kurser.vercel.app`

## Demo-login

| Rolle | E-mail | Adgangskode |
|--------|--------|-------------|
| Kursist | `deltager0@example.dk` | `Brandbjerg1234` |
| Medarbejder | `nh@brandbjerg.dk` | `Brandbjerg1234` |

## App Store / Play Store

- Byg release: `flutter build ipa` / `flutter build appbundle`
- Web: `flutter build web` (kan hostes på Vercel ved siden af Next.js)

Se også [docs/MOBILE_APP.md](../../docs/MOBILE_APP.md) for arkitektur og næste skridt.
