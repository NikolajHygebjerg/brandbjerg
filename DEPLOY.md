# Deploy til Vercel — fast domæne

Mål: **https://brandbjerg-kurser.vercel.app**

Mockuppen er allerede deployed og claimed på din Vercel-konto (`nikolaj@idevaerket.dk`).

## Trin 1: Sæt projektnavn (giver fast .vercel.app-domæne)

1. Log ind på [vercel.com/dashboard](https://vercel.com/dashboard)
2. Åbn det claimed projekt (fx `temporary-agile-boron` eller repo-navn)
3. Gå til **Settings → General**
4. Under **Project Name** skriv: `brandbjerg-kurser`
5. Gem — produktions-URL bliver: `https://brandbjerg-kurser.vercel.app`

## Trin 2: Deploy seneste kode (valgfrit)

Fra din computer efter `origin repo clone`:

```bash
cd Brandbjerg
npm install
npx vercel login
npx vercel link    # vælg projektet brandbjerg-kurser
npx vercel deploy --prod
```

## Midlertidigt link (virker indtil permanent er sat op)

https://temporary-agile-boron-nfvvr9v.vercel.app

## Anbefalede sider på telefon

- `/overblik`
- `/planlaegning/arshjul`
- `/planlaegning/statusark`
- `/planlaegning/kurser/kur-001`
- `/katalog`
