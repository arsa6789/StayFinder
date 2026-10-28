# StayFinder

Mobile-friendly hotel search. Next.js (App Router, JavaScript) plus a small server route that calls the
Notte **Anything API** "Booking.com Hotel Search" function. It can also be packed as an Android/iOS app with Capacitor.

```
Browser / Capacitor app -> /api/search (your Vercel server, holds the key) -> Anything API -> Booking.com
```

## Why a server route?
Your Notte API key must never be in frontend code (anyone could read it and spend your credits).
`app/api/search/route.js` keeps it on the server.

## 1. Run locally
```bash
npm install
cp .env.example .env.local      # put your NOTTE_API_KEY inside (https://console.notte.cc)
npm run dev                     # http://localhost:3000
```

## 2. Deploy to Vercel
1. Push this folder to GitHub.
2. Vercel -> Add New Project -> import the repo (framework: Next.js, no settings to change).
3. Settings -> Environment Variables -> add `NOTTE_API_KEY`.
4. Deploy, then open your `https://<project>.vercel.app` URL.

## 3. Build the mobile app with Capacitor
A Capacitor app is static files inside a native shell, so it cannot run the server route itself.
It calls your deployed Vercel API instead. **Deploy to Vercel first (step 2).**
```bash
# Mac/Linux
NEXT_PUBLIC_API_BASE=https://<project>.vercel.app npm run build:cap
# Windows PowerShell
$env:NEXT_PUBLIC_API_BASE="https://<project>.vercel.app"; npm run build:cap

npm i @capacitor/android            # (@capacitor/ios on a Mac)
npx cap add android                 # once
npx cap sync                        # run after every build:cap
npx cap open android                # opens Android Studio -> Run / Build APK
```
`build:cap` temporarily moves `app/api` aside (static export cannot contain API routes), builds into `out/`, then restores it.

## Project structure
```
app/api/search/route.js   server: validates input, calls Notte with your key
app/page.js               main page (state, fetch, results)
app/layout.js, globals.css, not-found.js, icon.svg
components/SearchForm.js  form + validation
components/HotelCard.js   one result card
scripts/build-cap.mjs     static build for Capacitor
capacitor.config.json     appId / appName / webDir
```

## Notes
- Hotel photos are not shown. Add them later if you want (the function returns image URLs).
- The in-memory rate limit is best-effort on serverless. For real traffic use Upstash Redis (free tier) or Vercel firewall rate limiting.
- Each search takes about 10-20 s (the function drives a real browser) and may use Notte credits.
- Hotel/booking links come from Booking.com. This is an unofficial tool.
