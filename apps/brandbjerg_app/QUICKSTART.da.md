# Flutter-app — hurtig start (fejlsøgning)

## `flutter: command not found`

Flutter er **ikke** en del af Node-projektet. Du skal installere Flutter SDK på din maskine (eller i Cloud Agent-miljøet).

### Mac (anbefalet)

```bash
brew install --cask flutter
flutter doctor
```

### Linux / Cloud Agent

Fra **repo-roden**:

```bash
bash scripts/install-flutter.sh
export PATH="$HOME/flutter/bin:$PATH"
```

Tilføj `export PATH="$HOME/flutter/bin:$PATH"` permanent i `~/.bashrc` eller `~/.zshrc`.

### Første gang i `apps/brandbjerg_app`

Platform-mapper (`android/`, `ios/`, `web/`) ligger **allerede i git**. Du behøver normalt **ikke** `flutter create` igen — kun:

```bash
cd apps/brandbjerg_app
flutter pub get
```

Kør kun `flutter create . --org dk.brandbjerg --project-name brandbjerg_app --platforms=android,ios,web` hvis du har en gammel clone uden platform-mapper.

---

## `EADDRINUSE :::4317`

Port **4317** er allerede i brug — typisk fordi **dev-serveren kører**.

- **Brug den kørende server:** åbn http://127.0.0.1:4317 (API til appen virker med det samme).
- **Eller** stop den gamle proces og start forfra fra **repo-roden** (ikke `apps/brandbjerg_app`):

```bash
cd /sti/til/brandbjerg   # mappe med package.json og npm run dev
fuser -k 4317/tcp 2>/dev/null || true
npm run dev
```

---

## Hvor kører `npm run dev`?

Kun fra **projektroden** (mappen med `package.json` og Next.js), **ikke** inde i `apps/brandbjerg_app`.

| Terminal | Mappe | Kommando |
|----------|--------|----------|
| 1 | repo-roden | `npm run dev` |
| 2 | `apps/brandbjerg_app` | `flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:4317` |

---

## Git push fejler (`Invalid username or token`)

GitHub accepterer ikke kodeord i terminalen. **Én gang** på din Mac:

```bash
brew install gh
gh auth login
gh auth setup-git
cd /sti/til/brandbjerg
git push origin main
```

Cursor «Connected to GitHub» i UI erstatter **ikke** `git push` i terminalen.

Hvis du har en commit lokalt der ikke er pushet (`git status` viser *ahead*):

```bash
git push origin main
```

---

## Demo-login i appen

| Rolle | E-mail | Adgangskode |
|--------|--------|-------------|
| Kursist | `deltager0@example.dk` | `Brandbjerg1234` |
| Medarbejder | `nh@brandbjerg.dk` | `Brandbjerg1234` |
