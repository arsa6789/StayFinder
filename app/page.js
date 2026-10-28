"use client";
import { useEffect, useMemo, useState } from "react";
import SearchForm from "../components/SearchForm";
import HotelCard from "../components/HotelCard";
import HotelSkeleton from "../components/HotelSkeleton";
import { BackIcon, HeartIcon } from "../components/Icons";

// Empty on Vercel (same origin). For the Capacitor app it is your deployed Vercel URL.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const SAVED_KEY = "stayfinder:saved:v2";
const SPLASH_MS = 1500; // how long the splash stays fully visible
const FADE_MS = 450;    // must match the .splash transition in globals.css

const ERRORS = {
  rate_limited: "Too many searches. Please wait a minute and try again.",
  timeout: "Booking.com took too long to respond. Please try again.",
  bad_request: "Please check your search details and try again.",
  server_not_configured: "The server has no NOTTE_API_KEY set yet.",
  bad_api_key: "The server’s Notte API key was rejected.",
};

const fmt = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* ---------- Small inline pieces ---------- */
function LogoMark({ size = 56 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M14 46V22h6v10h24V22h6v24h-6v-6H20v6z" fill="#1a5fe0" />
      <circle cx="24" cy="26" r="4" fill="#1a5fe0" />
    </svg>
  );
}

const SearchTabIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);

function Splash({ leaving }) {
  return (
    <div className={`splash${leaving ? " out" : ""}`} role="status" aria-label="Loading StayFinder">
      <div className="splash-inner">
        <div className="splash-logo"><LogoMark /></div>
        <div className="splash-name">StayFinder</div>
        <div className="splash-tag">Find your next stay</div>
        <div className="splash-bar" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [splash, setSplash] = useState("show"); // "show" | "leaving" | "gone"
  const [tab, setTab] = useState("search");     // "search" | "saved"
  const [view, setView] = useState("search");   // "search" | "results" (inside the Search tab)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [query, setQuery] = useState(null);
  const [sort, setSort] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState([]); // full hotel objects, so Saved works without a search

  // Splash timers
  useEffect(() => {
    const t1 = setTimeout(() => setSplash("leaving"), SPLASH_MS);
    const t2 = setTimeout(() => setSplash("gone"), SPLASH_MS + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Load saved hotels
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(raw)) setSaved(raw);
    } catch {}
  }, []);

  const savedIds = useMemo(() => new Set(saved.map((p) => p.property_id)), [saved]);
  const all = data?.properties || [];
  const meta = data?.search_metadata || {};

  // HotelCard calls toggleFav(property_id); we look up the full hotel to store it.
  function toggleFav(id) {
    setSaved((prev) => {
      const exists = prev.some((p) => p.property_id === id);
      const hotel = all.find((p) => p.property_id === id);
      const next = exists ? prev.filter((p) => p.property_id !== id) : hotel ? [hotel, ...prev] : prev;
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function goTab(next) {
    if (next === tab && tab === "search" && view === "results") setView("search");
    setTab(next);
    window.scrollTo({ top: 0 });
  }

  async function search(payload) {
    setQuery(payload);
    setTab("search");
    setView("results");
    setLoading(true); setError(""); setData(null);
    setOnlyFree(false); setOnlySaved(false);
    window.scrollTo({ top: 0 });
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(ERRORS[body.error] || "The search service is unavailable. Please try again.");
      if (!body.success) {
        const code = body.error?.error_code;
        throw new Error(code === "NO_RESULTS"
          ? "No stays matched. Try wider dates, a higher max price or fewer filters."
          : body.error?.message || "The search failed.");
      }
      setData(body);
    } catch (e) {
      setError(e instanceof TypeError ? "Network error. Check your connection and try again." : e.message);
    } finally {
      setLoading(false);
    }
  }

  const savedInResults = all.filter((p) => savedIds.has(p.property_id)).length;

  const visible = useMemo(() => {
    let list = [...all];
    if (onlyFree) list = list.filter((p) => p.has_free_cancellation);
    if (onlySaved) list = list.filter((p) => savedIds.has(p.property_id));
    if (sort === "price") list.sort((a, b) => (a.total_price ?? Infinity) - (b.total_price ?? Infinity));
    if (sort === "rating") list.sort((a, b) => (b.rating_score || 0) - (a.rating_score || 0));
    return list;
  }, [all, onlyFree, onlySaved, sort, savedIds]);

  const showForm = tab === "search" && view === "search";
  const showResults = tab === "search" && view === "results" && query;

  return (
    <>
      {splash !== "gone" && <Splash leaving={splash === "leaving"} />}

      <div className="app">
        {/* ===== SEARCH FORM (kept mounted so it remembers what you typed) ===== */}
        <div className="screen" hidden={!showForm}>
          <section className="hero-block">
            <div className="narrow">
              <div className="appbar">
                <span className="appbar-logo"><LogoMark size={22} /></span>
                StayFinder
              </div>
              <h1 className="hero">Where to next?</h1>
              <p className="hero-sub">Search hotels by city, dates and guests, then book on Booking.com.</p>
            </div>
          </section>
          <div className="narrow pull-up">
            <SearchForm onSearch={search} loading={loading} />
          </div>
        </div>

        {/* ===== RESULTS ===== */}
        {showResults && (
          <section className="screen" aria-label="Search results">
            <div className="topbar">
              <button className="iconbtn" aria-label="Back to search" onClick={() => setView("search")}>
                <BackIcon />
              </button>
              <button className="summary" onClick={() => setView("search")} aria-label="Edit search">
                <strong>{query.destination}</strong>
                <span>
                  {fmt(query.checkin_date)} – {fmt(query.checkout_date)} · {plural(query.adults, "adult")} · {plural(query.rooms, "room")}
                </span>
              </button>
            </div>

            <div className="chips" role="group" aria-label="Sort and filter results">
              <button className="chip" aria-pressed={sort === ""} onClick={() => setSort("")}>Best match</button>
              <button className="chip" aria-pressed={sort === "price"} onClick={() => setSort("price")}>Lowest price</button>
              <button className="chip" aria-pressed={sort === "rating"} onClick={() => setSort("rating")}>Top rated</button>
              <button className="chip" aria-pressed={onlyFree} onClick={() => setOnlyFree((v) => !v)}>Free cancellation</button>
              <button className="chip" aria-pressed={onlySaved} onClick={() => setOnlySaved((v) => !v)}>
                <HeartIcon width={14} height={14} filled={onlySaved} /> Saved{savedInResults ? ` (${savedInResults})` : ""}
              </button>
            </div>

            <div role="status" aria-live="polite">
              {loading && <p className="small meta">Searching Booking.com… usually 10–20 seconds.</p>}
              {error && (
                <div className="msg err">
                  {error}
                  <div><button className="btn-sm retry" onClick={() => search(query)}>Try again</button></div>
                </div>
              )}
            </div>

            {loading && <div className="list">{[0, 1, 2, 3].map((i) => <HotelSkeleton key={i} />)}</div>}

            {data && (
              <>
                <p className="small meta">
                  <strong>{meta.resolved_destination || meta.destination}</strong> · {meta.total_results?.toLocaleString()} stays found · showing {visible.length}
                </p>
                {visible.length === 0 ? (
                  <div className="msg">
                    No stays match these quick filters.
                    <div>
                      <button className="btn-sm retry" onClick={() => { setOnlyFree(false); setOnlySaved(false); }}>Clear filters</button>
                    </div>
                  </div>
                ) : (
                  <div className="list">
                    {visible.map((p) => (
                      <HotelCard key={p.property_id} p={p} fallbackCurrency={meta.currency}
                        nights={meta.nights} isFav={savedIds.has(p.property_id)} onToggleFav={toggleFav} />
                    ))}
                  </div>
                )}
                <details className="panel json">
                  <summary>Structured JSON response</summary>
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                </details>
              </>
            )}
          </section>
        )}

        {/* ===== SAVED TAB ===== */}
        {tab === "saved" && (
          <section className="screen" aria-label="Saved stays">
            <header className="screen-head">
              <h1>Saved stays</h1>
              <p className="small">{saved.length ? plural(saved.length, "hotel") + " saved on this device" : "Your favourites live here"}</p>
            </header>
            {saved.length === 0 ? (
              <div className="empty">
                <div className="empty-emoji" aria-hidden="true">💙</div>
                <strong>No saved stays yet</strong>
                <p className="small">Tap the heart on any hotel to keep it here.</p>
                <button className="btn-sm" onClick={() => goTab("search")}>Search hotels</button>
              </div>
            ) : (
              <div className="list">
                {saved.map((p) => (
                  <HotelCard key={p.property_id} p={p} isFav onToggleFav={toggleFav} />
                ))}
              </div>
            )}
          </section>
        )}

        <footer>Prices and availability come from Booking.com and may change. Unofficial search tool.</footer>
      </div>

      {/* ===== BOTTOM TAB BAR ===== */}
      <nav className="tabbar" aria-label="Main">
        <div className="tabbar-inner">
          <button className="tab" aria-current={tab === "search" ? "page" : undefined} onClick={() => goTab("search")}>
            <SearchTabIcon />
            <span>Search</span>
          </button>
          <button className="tab" aria-current={tab === "saved" ? "page" : undefined} onClick={() => goTab("saved")}>
            <span className="tab-icon">
              <HeartIcon width={24} height={24} filled={tab === "saved"} />
              {saved.length > 0 && <b className="badge">{saved.length > 9 ? "9+" : saved.length}</b>}
            </span>
            <span>Saved</span>
          </button>
        </div>
      </nav>
    </>
  );
}