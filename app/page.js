"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchForm from "../components/SearchForm";
import CarSearchForm from "../components/CarSearchForm";
import HotelCard from "../components/HotelCard";
import CarCard from "../components/CarCard";
import HotelSkeleton from "../components/HotelSkeleton";
import CarSkeleton from "../components/CarSkeleton";
import FilterSheet from "../components/FilterSheet";
import BottomNav from "../components/BottomNav";
import {
  HeartIcon, SearchIcon, SlidersIcon, AlertIcon, CompassIcon, ChevronIcon, BedIcon, CarIcon,
} from "../components/Icons";
import {
  DEFAULT_FORM, POPULAR, addDays, today, validate, buildPayload, activeFilterCount, fmtDate, plural, money,
} from "../lib/search";
import {
  DEFAULT_CAR_FORM, CARS_POPULAR, validateCar, buildCarPayload, activeCarFilterCount, carId,
} from "../lib/cars";

// Empty on Vercel (same origin). For the Capacitor app it is your deployed Vercel URL.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const SAVED_KEY = "stayfinder:saved:v2"; // full hotel objects, so Saved works offline of any search
const SAVED_CARS_KEY = "stayfinder:saved-cars:v2"; // kept apart from hotels so the two can never collide
const SPLASH_MS = 1200;
const FADE_MS = 400; // keep in sync with .splash transition in globals.css
const CLIENT_TIMEOUT_MS = 70_000; // a little above the server route's 55s upstream timeout

const ERRORS = {
  rate_limited: "Too many searches. Please wait a minute and try again.",
  timeout: "Booking.com took too long to respond. Please try again.",
  bad_request: "Please check your search details and try again.",
  server_not_configured: "The server has no NOTTE_API_KEY set yet.",
  bad_api_key: "The server’s Notte API key was rejected.",
};

// Same shape as ERRORS, for the car endpoint (it has two extra upstream codes).
const CAR_ERRORS = {
  ...ERRORS,
  timeout: "Rentalcars.com took too long to respond. Please try again.",
  upstream_error: "The car search service had a problem. Please try again.",
  unexpected_response: "The car search service sent an unexpected response. Please try again.",
};

// Codes the car API uses for "nothing matched" (shown as an empty state, not an error).
// Observed live: NO_VEHICLES_AVAILABLE.
const CAR_NO_RESULTS = /no[_\s-]?(results|cars|vehicles|availability|available)|empty|not[_\s-]?found/i;

// A TypeError from fetch is almost always "no connection" or "this build isn't
// pointed at a deployed API": the Capacitor app calls NEXT_PUBLIC_API_BASE, and
// an empty or placeholder value makes every search fail. Say which one it is so
// it's fixable, instead of looking like an outage.
function networkErrorMessage() {
  const base = API_BASE || "";
  const placeholder = /stayfinder-example\.vercel\.app$/i.test(base);
  const inApp = typeof window !== "undefined" && Boolean(window.Capacitor?.isNativePlatform?.());
  if (placeholder || (inApp && !base)) {
    return "This build isn’t pointed at a deployed API yet. Set NEXT_PUBLIC_API_BASE to your Vercel URL, then rebuild: NEXT_PUBLIC_API_BASE=https://your-app.vercel.app npm run build:cap";
  }
  return "Network error. Check your connection and try again.";
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="34" height="34">
          <rect width="64" height="64" rx="14" fill="#0f766e" />
          <path d="M14 46V22h6v10h24V22h6v24h-6v-6H20v6z" fill="#fff" />
          <circle cx="24" cy="26" r="4" fill="#fff" />
        </svg>
      </span>
      <span className="brand-name">Stay<span>Finder</span></span>
    </div>
  );
}

function Splash({ leaving }) {
  return (
    <div className={`splash${leaving ? " out" : ""}`} role="status" aria-label="Loading StayFinder">
      <div className="splash-inner">
        <span className="splash-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <rect width="64" height="64" rx="14" fill="#0f766e" />
            <path d="M14 46V22h6v10h24V22h6v24h-6v-6H20v6z" fill="#fff" />
            <circle cx="24" cy="26" r="4" fill="#fff" />
          </svg>
        </span>
        <div className="splash-name">StayFinder</div>
        <div className="splash-tag">Find your next escape</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [splash, setSplash] = useState("show"); // "show" | "leaving" | "gone"
  const [tab, setTab] = useState("explore");    // "explore" | "saved"
  const [category, setCategory] = useState("hotels"); // "hotels" | "cars"

  // Search form state (shared by the search card and the filter sheet)
  const [form, setForm] = useState(DEFAULT_FORM);
  const [ages, setAges] = useState([]);
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState(false); // expand the search card after a search (mobile)
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Results state
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: "error" | "empty", message }
  const [data, setData] = useState(null);
  const [query, setQuery] = useState(null);
  const [sort, setSort] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState([]);
  const inflight = useRef(false);

  // Car rental state — kept separate so hotel search is completely untouched.
  const [carForm, setCarForm] = useState(DEFAULT_CAR_FORM);
  const [carFormError, setCarFormError] = useState("");
  const [carEditing, setCarEditing] = useState(false);
  const [carHasSearched, setCarHasSearched] = useState(false);
  const [carLoading, setCarLoading] = useState(false);
  const [carNotice, setCarNotice] = useState(null); // { kind: "error" | "empty", message }
  const [carData, setCarData] = useState(null);
  const [carQuery, setCarQuery] = useState(null);
  const [carSort, setCarSort] = useState("");
  const [carOnlyFree, setCarOnlyFree] = useState(false);
  const [carOnlySaved, setCarOnlySaved] = useState(false);
  const [savedCars, setSavedCars] = useState([]);
  const carInflight = useRef(false);

  // Splash
  useEffect(() => {
    const t1 = setTimeout(() => setSplash("leaving"), SPLASH_MS);
    const t2 = setTimeout(() => setSplash("gone"), SPLASH_MS + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Default dates are set after mount so server and client HTML match.
  useEffect(() => {
    setForm((p) => (p.checkin ? p : { ...p, checkin: addDays(today(), 30), checkout: addDays(today(), 33) }));
    setCarForm((p) => (p.pickupDate ? p : { ...p, pickupDate: addDays(today(), 30), dropoffDate: addDays(today(), 33) }));
  }, []);

  // Saved hotels
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(raw)) setSaved(raw);
    } catch {}
  }, []);

  // Saved cars (separate key, so hotels and cars can never overwrite each other)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_CARS_KEY) || "[]");
      if (Array.isArray(raw)) setSavedCars(raw);
    } catch {}
  }, []);

  const savedIds = useMemo(() => new Set(saved.map((p) => p.property_id)), [saved]);
  const savedCarIds = useMemo(() => new Set(savedCars.map((c) => carId(c)).filter(Boolean)), [savedCars]);

  function toggleSaved(hotel) {
    setSaved((prev) => {
      const exists = prev.some((p) => p.property_id === hotel.property_id);
      const next = exists ? prev.filter((p) => p.property_id !== hotel.property_id) : [hotel, ...prev];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function toggleSavedCar(car) {
    const id = carId(car);
    if (!id) return; // nothing stable to key it by
    setSavedCars((prev) => {
      const exists = prev.some((c) => carId(c) === id);
      const next = exists ? prev.filter((c) => carId(c) !== id) : [car, ...prev];
      try { localStorage.setItem(SAVED_CARS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function runSearch(f = form, a = ages) {
    if (inflight.current) return; // no duplicate submissions
    const problem = validate(f);
    if (problem) { setFormError(problem); setEditing(true); setTab("explore"); return; }
    setFormError("");

    const payload = buildPayload(f, a);
    inflight.current = true;
    setQuery(payload); setHasSearched(true); setEditing(false); setTab("explore");
    setLoading(true); setNotice(null); setData(null);
    setOnlyFree(false); setOnlySaved(false);
    window.scrollTo({ top: 0 });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(ERRORS[body.error] || "The search service is unavailable. Please try again.");
      if (!body.success) {
        if (body.error?.error_code === "NO_RESULTS") {
          setNotice({ kind: "empty", message: "No stays matched. Try wider dates, a higher max price or fewer filters." });
        } else {
          setNotice({ kind: "error", message: body.error?.message || "The search failed. Please try again." });
        }
        return;
      }
      setData(body);
      if (!body.properties?.length) setNotice({ kind: "empty", message: "No stays matched. Try wider dates, a higher max price or fewer filters." });
    } catch (e) {
      const message =
        e?.name === "AbortError" ? ERRORS.timeout
        : e instanceof TypeError ? networkErrorMessage()
        : e.message;
      setNotice({ kind: "error", message });
    } finally {
      clearTimeout(timer);
      inflight.current = false;
      setLoading(false);
    }
  }

  async function runCarSearch(f = carForm) {
    if (carInflight.current) return; // no duplicate submissions
    const problem = validateCar(f);
    if (problem) { setCarFormError(problem); setCarEditing(true); return; }
    setCarFormError("");

    const payload = buildCarPayload(f);
    carInflight.current = true;
    setCarQuery(payload); setCarHasSearched(true); setCarEditing(false);
    setCarLoading(true); setCarNotice(null); setCarData(null);
    setCarOnlyFree(false); setCarOnlySaved(false);
    window.scrollTo({ top: 0 });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/api/cars/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(CAR_ERRORS[body.error] || "The search service is unavailable. Please try again.");
      if (!body.success) {
        const code = String(body.error?.code || "");
        if (CAR_NO_RESULTS.test(code)) {
          setCarNotice({ kind: "empty", message: "No cars matched. Try a different location, wider dates or another pick-up time." });
        } else {
          setCarNotice({ kind: "error", message: body.error?.message || "The search failed. Please try again." });
        }
        return;
      }
      setCarData(body);
      if (!body.vehicles?.length) {
        setCarNotice({ kind: "empty", message: "No cars matched. Try a different location, wider dates or another pick-up time." });
      }
    } catch (e) {
      const message =
        e?.name === "AbortError" ? CAR_ERRORS.timeout
        : e instanceof TypeError ? networkErrorMessage()
        : e.message;
      setCarNotice({ kind: "error", message });
    } finally {
      clearTimeout(timer);
      carInflight.current = false;
      setCarLoading(false);
    }
  }

  const meta = data?.search_metadata || {};
  const all = data?.properties || [];
  const carMeta = carData?.search_metadata || {};
  const allCars = carData?.vehicles || [];
  const carFilterCount = activeCarFilterCount(carForm);
  const filterCount = category === "cars" ? carFilterCount : activeFilterCount(form);

  const visible = useMemo(() => {
    let list = [...all];
    if (onlyFree) list = list.filter((p) => p.has_free_cancellation);
    if (onlySaved) list = list.filter((p) => savedIds.has(p.property_id));
    if (sort === "price") list.sort((a, b) => (a.total_price ?? Infinity) - (b.total_price ?? Infinity));
    if (sort === "rating") list.sort((a, b) => (b.rating_score || 0) - (a.rating_score || 0));
    return list;
  }, [all, onlyFree, onlySaved, sort, savedIds]);

  // Car quick filters/sorts only touch fields the car API actually returns.
  const visibleCars = useMemo(() => {
    let list = [...allCars];
    if (carOnlyFree) list = list.filter((c) => c.free_cancellation === true);
    if (carOnlySaved) list = list.filter((c) => savedCarIds.has(carId(c)));
    if (carSort === "price") list.sort((a, b) => (a.total_price ?? Infinity) - (b.total_price ?? Infinity));
    if (carSort === "rating") list.sort((a, b) => (b.supplier_rating || 0) - (a.supplier_rating || 0));
    return list;
  }, [allCars, carOnlyFree, carOnlySaved, carSort, savedCarIds]);

  // "1,234 cars · showing 25" (falls back to just what's on screen).
  const carCountLabel = (() => {
    const n = carMeta.total_available ?? carMeta.results_count;
    return n != null ? `${n.toLocaleString()} cars · showing ${visibleCars.length}` : `showing ${visibleCars.length} cars`;
  })();

  // Filters that were actually sent with the last search, shown as read-only chips.
  const applied = useMemo(() => {
    if (!query) return [];
    const out = [];
    if (query.star_rating?.length) out.push(query.star_rating.length === 1 ? "5 stars" : `${Math.min(...query.star_rating)}+ stars`);
    if (query.min_price != null && query.max_price != null) out.push(`${money(query.min_price, query.currency)} – ${money(query.max_price, query.currency)}`);
    else if (query.min_price != null) out.push(`From ${money(query.min_price, query.currency)}`);
    else if (query.max_price != null) out.push(`Up to ${money(query.max_price, query.currency)}`);
    if (query.free_cancellation) out.push("Free cancellation");
    if (query.currency !== "USD") out.push(query.currency);
    return out;
  }, [query]);

  // Filters/params that were actually sent with the last car search.
  const appliedCars = useMemo(() => {
    if (!carQuery) return [];
    const out = [];
    if (carQuery.currency && carQuery.currency !== "USD") out.push(carQuery.currency);
    if (carQuery.driver_age && carQuery.driver_age !== 30) out.push(`Driver ${carQuery.driver_age}`);
    if (carQuery.dropoff_location) out.push(`Return to ${carQuery.dropoff_location}`);
    return out;
  }, [carQuery]);

  const popularSearch = (d) => {
    const next = { ...form, destination: d };
    setForm(next);
    runSearch(next);
  };

  const popularCarSearch = (d) => {
    const next = { ...carForm, pickup: d };
    setCarForm(next);
    runCarSearch(next);
  };

  const showCard = !hasSearched || editing;
  const carShowCard = !carHasSearched || carEditing;

  return (
    <>
      {splash !== "gone" && <Splash leaving={splash === "leaving"} />}

      <div className={`shell${hasSearched ? " is-searched" : ""}`}>
        <header className="topbar"><Brand /></header>

        {/* ============ EXPLORE ============ */}
        {tab === "explore" && (
          <main className="explore">
            <div className="explore-head">
              <h1>Find your next escape</h1>
              <p className="lede">
                {category === "cars"
                  ? "Compare rental cars by pick-up, dates and driver age, then book on Rentalcars.com."
                  : "Search stays by city, dates and guests, then book on Booking.com."}
              </p>
            </div>

            <div className="mode-switch" role="group" aria-label="What are you searching for?">
              <button type="button" className="mode-opt" aria-pressed={category === "hotels"}
                onClick={() => setCategory("hotels")}>
                <BedIcon width={18} height={18} /> Hotels
              </button>
              <button type="button" className="mode-opt" aria-pressed={category === "cars"}
                onClick={() => setCategory("cars")}>
                <CarIcon width={18} height={18} /> Car rentals
              </button>
            </div>

            <div className="explore-grid">
              <aside className="side">
                {category === "hotels" ? (
                  <>
                    {hasSearched && !editing && query && (
                      <button type="button" className="summary-pill" onClick={() => setEditing(true)} aria-label="Edit your search">
                        <SearchIcon />
                        <span className="summary-text">
                          <strong>{query.destination}</strong>
                          <span>
                            {fmtDate(query.checkin_date)} – {fmtDate(query.checkout_date)} · {plural(query.adults + query.children, "guest")} · {plural(query.rooms, "room")}
                          </span>
                        </span>
                        <span className="summary-edit">Edit</span>
                      </button>
                    )}

                    <div className={`search-card${showCard ? " is-open" : ""}`}>
                      <SearchForm
                        form={form} setForm={setForm} ages={ages} setAges={setAges}
                        onSubmit={() => runSearch()} onOpenFilters={() => setFiltersOpen(true)}
                        filterCount={filterCount} loading={loading} error={formError}
                      />
                      {hasSearched && editing && (
                        <button type="button" className="btn btn-ghost btn-block collapse-btn" onClick={() => setEditing(false)}>
                          <ChevronIcon style={{ transform: "rotate(180deg)" }} /> Hide search
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {carHasSearched && !carEditing && carQuery && (
                      <button type="button" className="summary-pill" onClick={() => setCarEditing(true)} aria-label="Edit your search">
                        <CarIcon />
                        <span className="summary-text">
                          <strong>{carQuery.pickup_location}</strong>
                          <span>
                            {fmtDate(carQuery.pickup_date)} – {fmtDate(carQuery.dropoff_date)} · {carQuery.pickup_time}–{carQuery.dropoff_time}
                          </span>
                        </span>
                        <span className="summary-edit">Edit</span>
                      </button>
                    )}

                    <div className={`search-card${carShowCard ? " is-open" : ""}`}>
                      <CarSearchForm
                        form={carForm} setForm={setCarForm}
                        onSubmit={() => runCarSearch()} onOpenFilters={() => setFiltersOpen(true)}
                        filterCount={filterCount} loading={carLoading} error={carFormError}
                      />
                      {carHasSearched && carEditing && (
                        <button type="button" className="btn btn-ghost btn-block collapse-btn" onClick={() => setCarEditing(false)}>
                          <ChevronIcon style={{ transform: "rotate(180deg)" }} /> Hide search
                        </button>
                      )}
                    </div>
                  </>
                )}
              </aside>

              <section className="results" aria-label="Search results" aria-busy={category === "cars" ? carLoading : loading}>
                {category === "hotels" && (
                <>
                {/* Initial empty state */}
                {!hasSearched && (
                  <div className="empty">
                    <span className="empty-icon" aria-hidden="true"><CompassIcon width={28} height={28} /></span>
                    <h2>Where would you like to stay?</h2>
                    <p className="muted">Pick a destination and your dates, or start with a popular city.</p>
                    <div className="chips center">
                      {POPULAR.map((d) => (
                        <button type="button" key={d} className="chip" onClick={() => popularSearch(d)}>{d.split(",")[0]}</button>
                      ))}
                    </div>
                  </div>
                )}

                {hasSearched && (
                  <>
                    <div className="toolbar">
                      <div className="chips" role="group" aria-label="Sort and quick filters">
                        <button type="button" className="chip" aria-pressed={sort === ""} onClick={() => setSort("")}>Best match</button>
                        <button type="button" className="chip" aria-pressed={sort === "price"} onClick={() => setSort("price")}>Lowest price</button>
                        <button type="button" className="chip" aria-pressed={sort === "rating"} onClick={() => setSort("rating")}>Top rated</button>
                        <span className="chip-sep" aria-hidden="true" />
                        <button type="button" className="chip" aria-pressed={onlyFree} onClick={() => setOnlyFree((v) => !v)}>Free cancellation</button>
                        <button type="button" className="chip" aria-pressed={onlySaved} onClick={() => setOnlySaved((v) => !v)}>
                          <HeartIcon width={15} height={15} filled={onlySaved} /> Saved
                        </button>
                      </div>
                    </div>

                    {(applied.length > 0 || data) && (
                      <div className="result-meta">
                        {data && (
                          <p className="muted">
                            <strong>{meta.resolved_destination || meta.destination}</strong>
                            {" · "}{meta.total_results?.toLocaleString()} stays · showing {visible.length}
                          </p>
                        )}
                        {applied.length > 0 && (
                          <div className="applied">
                            {applied.map((a) => <span className="tag" key={a}>{a}</span>)}
                            <button type="button" className="link-btn" onClick={() => setFiltersOpen(true)}>Edit filters</button>
                          </div>
                        )}
                      </div>
                    )}

                    <div role="status" aria-live="polite" className="sr-only">
                      {loading ? "Searching Booking.com" : data ? `${visible.length} stays shown` : ""}
                    </div>

                    {loading && (
                      <>
                        <p className="muted small loading-note">Searching Booking.com… usually 10–20 seconds.</p>
                        <div className="list">{[0, 1, 2, 3].map((i) => <HotelSkeleton key={i} />)}</div>
                      </>
                    )}

                    {notice?.kind === "error" && (
                      <div className="state err" role="alert">
                        <AlertIcon width={26} height={26} />
                        <h2>Something went wrong</h2>
                        <p>{notice.message}</p>
                        <button type="button" className="btn btn-primary" onClick={() => runSearch()}>Try again</button>
                      </div>
                    )}

                    {notice?.kind === "empty" && (
                      <div className="state">
                        <SearchIcon width={26} height={26} />
                        <h2>No stays found</h2>
                        <p>{notice.message}</p>
                        <div className="state-actions">
                          <button type="button" className="btn btn-ghost" onClick={() => setFiltersOpen(true)}>Edit filters</button>
                          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>Change search</button>
                        </div>
                      </div>
                    )}

                    {data && all.length > 0 && (
                      visible.length === 0 ? (
                        <div className="state">
                          <SlidersIcon width={26} height={26} />
                          <h2>Nothing matches these quick filters</h2>
                          <p>Try turning off Free cancellation or Saved.</p>
                          <button type="button" className="btn btn-primary" onClick={() => { setOnlyFree(false); setOnlySaved(false); }}>Clear quick filters</button>
                        </div>
                      ) : (
                        <div className="list">
                          {visible.map((p) => (
                            <HotelCard key={p.property_id} p={p} fallbackCurrency={meta.currency} nights={meta.nights}
                              isFav={savedIds.has(p.property_id)} onToggleFav={toggleSaved} />
                          ))}
                        </div>
                      )
                    )}

                    {data && (
                      <details className="raw">
                        <summary>Raw API response</summary>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                      </details>
                    )}
                  </>
                )}
                </>
                )}

                {/* ============ CAR RENTALS ============ */}
                {category === "cars" && (
                  <>
                    {/* Initial empty state */}
                    {!carHasSearched && (
                      <div className="empty">
                        <span className="empty-icon" aria-hidden="true"><CarIcon width={28} height={28} /></span>
                        <h2>Where are you picking up your car?</h2>
                        <p className="muted">Choose a location and your dates, or start with a popular airport.</p>
                        <div className="chips center">
                          {CARS_POPULAR.map((d) => (
                            <button type="button" key={d} className="chip" onClick={() => popularCarSearch(d)}>
                              {d.replace(" Airport", "")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {carHasSearched && (
                      <>
                        <div className="toolbar">
                          <div className="chips" role="group" aria-label="Sort and quick filters">
                            <button type="button" className="chip" aria-pressed={carSort === ""} onClick={() => setCarSort("")}>Best match</button>
                            <button type="button" className="chip" aria-pressed={carSort === "price"} onClick={() => setCarSort("price")}>Lowest price</button>
                            <button type="button" className="chip" aria-pressed={carSort === "rating"} onClick={() => setCarSort("rating")}>Top rated</button>
                            <span className="chip-sep" aria-hidden="true" />
                            <button type="button" className="chip" aria-pressed={carOnlyFree} onClick={() => setCarOnlyFree((v) => !v)}>Free cancellation</button>
                            <button type="button" className="chip" aria-pressed={carOnlySaved} onClick={() => setCarOnlySaved((v) => !v)}>
                              <HeartIcon width={15} height={15} filled={carOnlySaved} /> Saved
                            </button>
                          </div>
                        </div>

                        {(appliedCars.length > 0 || carData) && (
                          <div className="result-meta">
                            {carData && (
                              <p className="muted">
                                <strong>{carMeta.pickup_location || carQuery?.pickup_location}</strong>
                                {" · "}{carCountLabel}
                              </p>
                            )}
                            {appliedCars.length > 0 && (
                              <div className="applied">
                                {appliedCars.map((a) => <span className="tag" key={a}>{a}</span>)}
                                <button type="button" className="link-btn" onClick={() => setFiltersOpen(true)}>Edit filters</button>
                              </div>
                            )}
                          </div>
                        )}

                        <div role="status" aria-live="polite" className="sr-only">
                          {carLoading ? "Searching Rentalcars.com" : carData ? `${visibleCars.length} cars shown` : ""}
                        </div>

                        {carLoading && (
                          <>
                            <p className="muted small loading-note">Searching Rentalcars.com… usually 10–15 seconds.</p>
                            <div className="list">{[0, 1, 2, 3].map((i) => <CarSkeleton key={i} />)}</div>
                          </>
                        )}

                        {carNotice?.kind === "error" && (
                          <div className="state err" role="alert">
                            <AlertIcon width={26} height={26} />
                            <h2>Something went wrong</h2>
                            <p>{carNotice.message}</p>
                            <button type="button" className="btn btn-primary" onClick={() => runCarSearch()}>Try again</button>
                          </div>
                        )}

                        {carNotice?.kind === "empty" && (
                          <div className="state">
                            <CarIcon width={26} height={26} />
                            <h2>No cars found</h2>
                            <p>{carNotice.message}</p>
                            <div className="state-actions">
                              <button type="button" className="btn btn-ghost" onClick={() => setFiltersOpen(true)}>Edit filters</button>
                              <button type="button" className="btn btn-primary" onClick={() => setCarEditing(true)}>Change search</button>
                            </div>
                          </div>
                        )}

                        {carData && allCars.length > 0 && (
                          visibleCars.length === 0 ? (
                            <div className="state">
                              <SlidersIcon width={26} height={26} />
                              <h2>Nothing matches these quick filters</h2>
                              <p>Try turning off Free cancellation or Saved.</p>
                              <button type="button" className="btn btn-primary" onClick={() => { setCarOnlyFree(false); setCarOnlySaved(false); }}>Clear quick filters</button>
                            </div>
                          ) : (
                            <div className="list">
                              {visibleCars.map((c, i) => (
                                <CarCard key={carId(c) || `car-${i}`} p={c} meta={carMeta}
                                  isFav={savedCarIds.has(carId(c))} onToggleFav={toggleSavedCar} />
                              ))}
                            </div>
                          )
                        )}

                        {carData && (
                          <details className="raw">
                            <summary>Raw API response</summary>
                            <pre>{JSON.stringify(carData, null, 2)}</pre>
                          </details>
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            </div>
          </main>
        )}

        {/* ============ SAVED ============ */}
        {tab === "saved" && (
          <main className="saved">
            <div className="explore-head">
              <h1>{savedCars.length ? (saved.length ? "Saved" : "Saved cars") : "Saved stays"}</h1>
              <p className="lede">
                {!saved.length && !savedCars.length
                  ? "Hearts you tap are kept here."
                  : `${[saved.length && plural(saved.length, "stay"), savedCars.length && plural(savedCars.length, "car")]
                      .filter(Boolean).join(" and ")} saved on this device.`}
              </p>
            </div>
            {saved.length === 0 && savedCars.length === 0 ? (
              <div className="empty">
                <span className="empty-icon" aria-hidden="true"><HeartIcon width={28} height={28} /></span>
                <h2>No saved stays yet</h2>
                <p className="muted">Tap the heart on any stay to keep it here.</p>
                <button type="button" className="btn btn-primary" onClick={() => setTab("explore")}>Start exploring</button>
              </div>
            ) : (
              <>
                {saved.length > 0 && (
                  <section className="saved-group">
                    {savedCars.length > 0 && <h2 className="section-title">Stays</h2>}
                    <p className="muted small note">Prices are from when you saved. Search again for current rates.</p>
                    <div className="list">
                      {saved.map((p) => <HotelCard key={p.property_id} p={p} isFav onToggleFav={toggleSaved} />)}
                    </div>
                  </section>
                )}
                {savedCars.length > 0 && (
                  <section className="saved-group">
                    {saved.length > 0 && <h2 className="section-title">Cars</h2>}
                    <p className="muted small note">Prices are from when you saved. Search again for current rates.</p>
                    <div className="list">
                      {savedCars.map((c, i) => (
                        <CarCard key={carId(c) || `saved-car-${i}`} p={c} isFav onToggleFav={toggleSavedCar} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        )}

        <footer className="foot">Prices and availability come from Booking.com and may change. Unofficial search tool.</footer>
      </div>

      <BottomNav tab={tab} onTab={(t) => { setTab(t); window.scrollTo({ top: 0 }); }}
        savedCount={saved.length + savedCars.length} filterCount={filterCount} onFilters={() => setFiltersOpen(true)} />

      <FilterSheet mode={category === "cars" ? "cars" : "hotels"} open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        form={category === "cars" ? carForm : form}
        setForm={category === "cars" ? setCarForm : setForm}
        hasSearched={category === "cars" ? carHasSearched : hasSearched}
        onApply={() => {
          setFiltersOpen(false);
          if (category === "cars") { if (carHasSearched) runCarSearch(); }
          else if (hasSearched) runSearch();
        }} />
    </>
  );
}
