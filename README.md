# Tranem Web

Browser version of the Android app in `../Tranem`, built with React, TypeScript, Vite, `sql.js`, and the Android SQLite catalog.

Live site: https://bonohanna.github.io/TranemWeb/

## Features

- Arabic-first RTL interface matching the Android content and catalog.
- Songs and albums loaded from `public/data/songs_v2.db`.
- Song and album detail pages with artwork, lyrics, team metadata, favorites, and play counts.
- Favorites and most-played pages with song/album tabs.
- Browser-local user state for favorites and listen counts.
- GitHub Pages deployment from `main`.

## Local Development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm run prepare:catalog
```

`npm run prepare:catalog` refreshes the web catalog from the Android asset at `../Tranem/app/src/main/assets/systdefault.zip`, extracts the SQLite database into `public/data/`, and copies `sql-wasm.wasm` into `public/`.

You can also pass a different zip path:

```bash
npm run prepare:catalog -- /path/to/systdefault.zip
```

## Catalog Assets

These files are intentionally committed because GitHub Pages serves the static build directly:

- `public/data/songs_v2.db`
- `public/sql-wasm.wasm`

The database is public once deployed. Do not put private data or secrets in the catalog.

`songs_v2.db` is currently slightly above GitHub's recommended 50 MB single-file size. If it grows much more, move the catalog to a release asset or external static storage and update the fetch URL in `src/lib/catalog/catalog.ts`.

## Deployment

Push to `main` deploys the app through `.github/workflows/deploy-pages.yml`.

The project is configured for the repository URL path:

```ts
base: '/TranemWeb/'
```

If the repository name changes, update `vite.config.ts` before deploying.

## Notes

- `dist/` is generated output and is ignored by git.
- The app uses `HashRouter`, so deployed routes work on GitHub Pages without a custom 404 rewrite.
- `package.json` keeps `"private": true` to prevent accidental npm publishing; this does not affect the public GitHub repository.
