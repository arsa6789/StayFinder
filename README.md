# StayFinder

StayFinder is a mobile-friendly hotel and car-rental search app. It uses Next.js for the web experience and server-side API routes, with Capacitor available for Android and iOS builds.

Searches are handled by the Notte Anything API and send users to the provider to complete a booking. StayFinder does not take payments or confirm reservations itself.

## Features

- Search stays by destination, dates, guests, rooms, price range, star rating, and free-cancellation preference.
- Search rental cars by pick-up and drop-off locations, dates, times, driver age, and currency.
- Sort results and apply quick filters such as lowest price, rating, free cancellation, and saved items.
- Save hotels and cars locally in the current browser or device. Saved items are not synced between devices.
- Open provider links in a new browser tab on the web or in the system browser from the Capacitor app.
- Use a responsive interface on mobile and desktop.

## How it works

```text
Web browser ──> Next.js server ──> Notte Anything API ──> Booking.com
                            └──> Notte Anything API ──> Rentalcars.com

Capacitor app ──> deployed Next.js API ──> Notte Anything API ──> providers
```

The Notte API key stays on the server. The browser and Capacitor app call StayFinder's API routes; they never call Notte directly with the secret key.

## Requirements

- Node.js **20.9 or newer**
- npm
- A Notte API key for running searches
- For Android builds: Android Studio and the Android SDK
- For iOS builds: macOS with Xcode

## Run locally

Clone the repository, install the locked dependencies, and create a local environment file:

```bash
git clone https://github.com/arsa6789/StayFinder.git
cd StayFinder
npm ci
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder with your Notte API key:

```dotenv
NOTTE_API_KEY=your_real_key
```

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env.local
```

Keep `.env.local` private. It is ignored by Git. **Never commit your Notte key or expose it in a `NEXT_PUBLIC_` variable.**

## Environment variables

| Variable | Required for | Description |
| --- | --- | --- |
| `NOTTE_API_KEY` | Local and deployed server | Server-only credential used by the hotel and car API routes. Set it in `.env.local` locally and in your hosting provider's environment settings after deployment. |
| `NEXT_PUBLIC_API_BASE` | Capacitor static builds only | Public HTTPS URL of the deployed StayFinder server, with no trailing slash. It is embedded in the mobile app at build time. Leave it unset for a normal web deployment; the web app uses same-origin API routes. |

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server. |
| `npm run build` | Create a production Next.js build for web deployment. |
| `npm run start` | Run the production build locally. Run `npm run build` first. |
| `npm run build:cap` | Create the static site in `out/` for Capacitor. Requires `NEXT_PUBLIC_API_BASE` to point to a deployed HTTPS API. |
| `npm run cap:sync` | Run the Capacitor static build and sync its output to installed native platforms. Also requires `NEXT_PUBLIC_API_BASE`. |

## Deploy the web app

1. Import this repository into Vercel (or another host that supports Next.js App Router and server routes).
2. Add `NOTTE_API_KEY` to the project's server-side environment variables. Configure the environments you use, such as Preview and Production.
3. Deploy the project and open its HTTPS URL.

For a regular web deployment, do **not** set `NEXT_PUBLIC_API_BASE`; the site and its `/api/...` routes share the same origin. Keep `NOTTE_API_KEY` out of browser-visible environment variables.

## Build the Capacitor app

A static Capacitor bundle cannot run the Next.js API routes. Deploy StayFinder to Vercel first, set `NOTTE_API_KEY` there, and point the mobile build to that deployed HTTPS URL.

### Add a native platform once

Android support is already included in the project dependencies. Add its native project once:

```bash
npx cap add android
```

For iOS, install the Capacitor iOS package and add the native project once on macOS:

```bash
npm install @capacitor/ios
npx cap add ios
```

### Build and sync

On macOS or Linux, set the deployed API URL for the build:

```bash
NEXT_PUBLIC_API_BASE=https://your-project.vercel.app npm run cap:sync
```

On Windows PowerShell:

```powershell
$env:NEXT_PUBLIC_API_BASE = "https://your-project.vercel.app"
npm run cap:sync
```

The build writes the static web files to `out/`, then Capacitor syncs them to the native project. Open the native project in its IDE:

```bash
npx cap open android
# On macOS, for iOS:
npx cap open ios
```

Set `NEXT_PUBLIC_API_BASE` again whenever you rebuild the mobile app. It is embedded in the app during the build. The `build:cap` script requires an HTTPS URL and refuses to build without one. Do not use a placeholder URL. The app's API base must point to the deployed server that has `NOTTE_API_KEY` configured.

## API routes

| Method and path | Purpose |
| --- | --- |
| `POST /api/search` | Validates a hotel search and calls the Booking.com search function through Notte. |
| `POST /api/cars/search` | Validates a car-rental search and calls the Rentalcars.com search function through Notte. |

Both routes require `NOTTE_API_KEY` on the server. They validate incoming search details, return provider results, and have a best-effort in-memory rate limit. The limiter is per server instance, so it is not a global abuse-prevention system for serverless deployments.

## Booking links and saved items

Hotel and car reservations are completed on the respective provider's site; StayFinder does not process bookings or payments.

Rentalcars can return a signed offer URL that is bound to the search session and may fail for other visitors. StayFinder's car **Book now** button uses the public search URL instead. When a car is saved, that URL is stored with it so the link continues to work after reload. Older saved cars that do not have a public link need a fresh search to get one.

Saved hotels and cars use separate browser storage keys:

- `stayfinder:saved:v2`
- `stayfinder:saved-cars:v2`

Clearing browser or app storage removes saved items.

## Troubleshooting

### Searches say the server is not configured

Make sure `NOTTE_API_KEY` is set in `.env.local` for local development or in the deployed server's environment settings. Restart the local server after changing `.env.local`; redeploy after changing hosted environment variables.

### The API key is rejected

Check that the value is current and has access to the required Notte Anything API functions. Do not add quotes or expose it in client code.

### Capacitor searches fail with a network error

Confirm that `NEXT_PUBLIC_API_BASE` is the deployed HTTPS StayFinder URL, has no trailing slash, and was set in the shell that ran the mobile build. Rebuild and sync after changing it. Also verify that the deployed server has `NOTTE_API_KEY` configured.

### No cars or stays are found

Try a broader destination or pick-up location, different dates, or fewer filters. Availability comes from third-party providers and can change. Provider outages, invalid locations, and rate limits can also affect results.

### A saved car has no working booking button

Older saved items may not include the public search URL. Run the car search again and save the result to store a fresh link.

## Project structure

```text
app/
  api/search/route.js          Hotel search API route
  api/cars/search/route.js     Car-rental search API route
  page.js                      Main search, results, and saved-items UI
  layout.js                    App layout and metadata
  globals.css                  Responsive app styles
components/
  SearchForm.js                Hotel search form
  CarSearchForm.js             Car-rental search form
  HotelCard.js                 Hotel result card
  CarCard.js                   Car-rental result card and booking link
  FilterSheet.js               Search filter sheet
  BottomNav.js                 Mobile navigation
lib/
  search.js                    Hotel form defaults, validation, and payloads
  cars.js                      Car form helpers and booking-link selection
  external.js                  Opens provider links on web and native apps
scripts/
  build-cap.mjs                Static Capacitor build helper
next.config.mjs                Next.js and static-export configuration
capacitor.config.json          Capacitor app identity and web output directory
```

## Notes

- Hotel and car availability, prices, and provider links are supplied by third parties and may change.
- Search requests may take several seconds because they depend on upstream provider responses.
- The rate limiter is best-effort and in-memory; use a shared store or host-level controls if stronger production rate limiting is required.
- StayFinder is an unofficial search interface and is not Booking.com or Rentalcars.com.
