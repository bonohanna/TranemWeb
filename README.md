# TranemWeb

`TranemWeb` is the browser rewrite scaffold for the Android app in `../Tranem`.

The project is intentionally set up around the real migration constraints:

- React + TypeScript + Vite shell
- Arabic-first RTL UI with English toggle
- SQLite-first catalog access for `songs_v2.db`
- Browser-side persistence reserved for user state like favorites and preferences
- Manual manifest and service worker placeholders for the future PWA pass

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Extract the Android catalog and copy the `sql.js` wasm runtime:

```bash
npm run prepare:catalog
```

This reads `../Tranem/app/src/main/assets/systdefault.zip`, extracts the `.db` file into `public/data/`, and copies `sql-wasm.wasm` into `public/`.

3. Start the app:

```bash
npm run dev
```

## Current Scope

The scaffold currently includes:

- route shell for the main app areas
- translation setup
- catalog summary loader against the packaged SQLite database
- deployment-safe `HashRouter`
- manual service worker registration

The next implementation milestone is the first vertical slice:

- songs list backed by SQLite
- search by song name
- song detail page
- web audio playback

## Notes

- `public/data/*.db` is gitignored so the extracted catalog does not get committed by default.
- `vite-plugin-pwa` was not added yet because the fresh Vite 8 scaffold currently conflicts with that plugin's peer dependency range. The project uses a manual manifest and service worker placeholder for now.
