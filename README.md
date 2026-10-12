# Learning landing + 2-step register (React + Vite) + Express/Mongo backend

## Run (tested)

Backend (Express + MongoDB, port 4000):

    cd server
    npm install
    npm start            # uses in-memory MongoDB if MONGODB_URI is empty
    # health: http://localhost:4000/api/health

Frontend (Vite, port 5173):

    npm install
    npm run dev          # VITE_API_URL=http://localhost:4000 (see .env)
    npm run build        # production build (verified)

## Flow

1. User registers at `#register`. The form collects ONLY what browsers allow
   (see `src/collect.js`): user-agent, language, timezone, screen/viewport,
   hardware, connection, referrer, URL, `history.length` (count only),
   optional Geolocation (permission prompt). **Browser history contents can
   never be read by a website — by design — and are never collected.**
2. `POST /api/auth/register` hashes the password (bcrypt), stores server-observed
   IP / user-agent / accept-language plus the client telemetry in MongoDB,
   creates a one-time `viewToken`, and emails a `FRONT_URL/#view/<token>` link
   (console-logged when no SMTP is configured; set `SMTP_*` + `ADMIN_EMAIL` in
   `server/.env` for real mail).
3. Opening `#view/<token>` calls `GET /api/records/:token` and displays
   account + server + browser data. Leaving the page (`pagehide`/unmount) calls
   `DELETE /api/records/:token` — view-once delete. Records also TTL-expire
   after 7 days. Password hashes are never returned by the API.

## i18n

`src/i18n.js` holds `en` + `fr`. Language defaults to `navigator.language`
(`fr` if it starts with fr, else `en`), with an Auto/EN/FR switcher persisted
as `app-lang` in localStorage.

## Config

- Brand/content: `src/data.js` (`BRAND`)
- Backend URL: `.env` (`VITE_API_URL`), `server/.env` (`PORT`, `FRONT_URL`, `MONGODB_URI`, `SMTP_*`, `MAIL_FROM`, `ADMIN_EMAIL`)
- Images and logos are grey placeholders; links are `#`.
