# StayFinder

Mobile-friendly hotel **and car rental** search. Next.js (App Router, JavaScript) plus small server routes that call
Notte **Anything API** functions. It can also be packed as an Android/iOS app with Capacitor.

Use the **Hotels / Car rentals** switch above the search form to change category.

```
Browser / Capacitor app -> /api/search       (your Vercel server, holds the key) -> Anything API -> Booking.com
                        -> /api/cars/search  (your Vercel server, holds the key) -> Anything API -> Rentalcars.com
```

Both features share the one `NOTTE_API_KEY`; no second key is needed.

| Feature | Function | Function ID |
|---|---|---|
| Hotels | Booking.com Hotel Search | `69608f5f-9247-4d53-8ad6-5188a7d4a8fd` |
| Car rentals | Rentalcars.com Car Rental Search | `527ffa59-a927-4afb-be04-ae6e260288b2` |

## Why a server route?
Your Notte API key must never be in frontend code (anyone could read it and spend your credits).
`app/api/search/route.js` and `app/api/cars/search/route.js` keep it on the server.

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

> **Important:** `NEXT_PUBLIC_API_BASE` is baked into the bundle at build time. If you skip it or use a
> wrong/placeholder URL, **every search in the app fails** with a network error. `build:cap` refuses to
> run without it, and the app now tells you explicitly when the build isn't pointed at a deployed API.
> If you ever see `https://stayfinder-example.vercel.app` in `out/`, that is a leftover test value —
> rebuild with your own URL before building the APK.

### Why provider links open in the app's browser
`Book now` / `Details` use `lib/external.js`. On the web it is a plain `<a target="_blank">` (new tab).
In Capacitor, `target="_blank"` does **nothing** — Capacitor's WebView has no `onCreateWindow` and never
calls `setSupportMultipleWindows`, so the tap is dropped. Capacitor instead intercepts same-window
navigation (`shouldOverrideUrlLoading` -> `Bridge.launchIntent`), which fires an `ACTION_VIEW` intent and
opens the system browser. So on a native platform the click is redirected through that path instead.
This needs **no extra plugin** (no `@capacitor/browser`).

## Project structure
```
app/api/search/route.js        server: hotels – validates input, calls Notte with your key
app/api/cars/search/route.js   server: cars  – same pattern, Rentalcars function
app/page.js                    main page (tabs, category switch, state, fetch, results)
app/layout.js, globals.css, not-found.js, icon.svg
lib/search.js                  hotel form helpers, validation, payload
lib/cars.js                    car form helpers, validation, payload
lib/external.js                opens provider links (web new tab vs. system browser in the app)
components/SearchForm.js       hotel form + validation
components/CarSearchForm.js    car form (pick-up/drop-off, dates, times, driver age)
components/HotelCard.js        one hotel result card
components/CarCard.js          one car result card
components/CarSkeleton.js      loading placeholder for car results
components/FilterSheet.js      hotel filters, plus car currency filter (mode-aware)
scripts/build-cap.mjs          static build for Capacitor
capacitor.config.json          appId / appName / webDir
```

Saved hotels and saved cars use separate localStorage keys
(`stayfinder:saved:v2` and `stayfinder:saved-cars:v2`), so they can never overwrite each other.

## Notes
- Hotel photos are not shown. Car photos are (the function returns `image_url`).
- The in-memory rate limit is best-effort on serverless. For real traffic use Upstash Redis (free tier) or Vercel firewall rate limiting.
  Hotels and cars keep separate counters, so one feature can’t exhaust the other’s quota.
- A hotel search takes about 10–20 s (the function drives a real browser); a car search about 10–15 s. Both may use Notte credits.
- Car filters are limited to what the API accepts (currency). Sorting, free-cancellation and saved are applied client-side
  over the fields the API actually returns.
- If a car search comes back empty the UI shows a "no cars" state; other upstream problems (bad location, WAF block)
  show the message the API returned.
- Hotel/booking links come from Booking.com and Rentalcars.com. This is an unofficial tool.
