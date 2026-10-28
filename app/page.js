"use client";
import { useEffect, useMemo, useState } from "react";
import SearchForm from "../components/SearchForm";
import HotelCard from "../components/HotelCard";
import HotelSkeleton from "../components/HotelSkeleton";
import { BackIcon, HeartIcon } from "../components/Icons";

// Empty on Vercel (same origin). For the Capacitor app it is your deployed Vercel URL.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const FAV_KEY = "stayfinder:favs";

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

export default function Home() {
  const [view, setView] = useState("search"); // "search" | "results"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [query, setQuery] = useState(null);
  const [sort, setSort] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [favs, setFavs] = useState([]);

  useEffect(() => {
    try { setFavs(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch {}
  }, []);

  function toggleFav(id) {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function search(payload) {
    setQuery(payload);
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

  const meta = data?.search_metadata || {};
  const all = data?.properties || [];
  const savedCount = all.filter((p) => favs.includes(p.property_id)).length;

  const visible = useMemo(() => {
    let list = [...all];
    if (onlyFree) list = list.filter((p) => p.has_free_cancellation);
    if (onlySaved) list = list.filter((p) => favs.includes(p.property_id));
    if (sort === "price") list.sort((a, b) => (a.total_price ?? Infinity) - (b.total_price ?? Infinity));
    if (sort === "rating") list.sort((a, b) => (b.rating_score || 0) - (a.rating_score || 0));
    return list;
  }, [all, onlyFree, onlySaved, sort, favs]);

  return (
    <div className="app">
      <header className="brand">Stay<span>Finder</span></header>

      {/* Kept mounted (just hidden) so the form remembers what you typed. */}
      <div className="narrow" hidden={view !== "search"}>
        <h1 className="hero">Where to next?</h1>
        <p className="sub">Search hotels by city, dates and guests, then jump to Booking.com to book.</p>
        <SearchForm onSearch={search} loading={loading} />
      </div>

      {view === "results" && query && (
        <section aria-label="Search results">
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
              <HeartIcon width={14} height={14} filled={onlySaved} /> Saved{savedCount ? ` (${savedCount})` : ""}
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

          {loading && (
            <div className="list">{[0, 1, 2, 3].map((i) => <HotelSkeleton key={i} />)}</div>
          )}

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
                      nights={meta.nights} isFav={favs.includes(p.property_id)} onToggleFav={toggleFav} />
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

      <footer>Prices and availability come from Booking.com and may change. Unofficial search tool.</footer>
    </div>
  );
}