"use client";
import { useState } from "react";
import SearchForm from "../components/SearchForm";
import HotelCard from "../components/HotelCard";

// Empty on Vercel (same origin). For the Capacitor app it is your deployed Vercel URL.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

const ERRORS = {
  rate_limited: "Too many searches. Please wait a minute and try again.",
  timeout: "Booking.com took too long to respond. Please try again.",
  bad_request: "Please check your search details and try again.",
  server_not_configured: "The server has no NOTTE_API_KEY set yet.",
  bad_api_key: "The server’s Notte API key was rejected.",
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [sort, setSort] = useState("");

  async function search(payload) {
    setLoading(true); setError(""); setData(null);
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
  const props = [...(data?.properties || [])];
  if (sort === "price") props.sort((a, b) => (a.total_price ?? Infinity) - (b.total_price ?? Infinity));
  if (sort === "rating") props.sort((a, b) => (b.rating_score || 0) - (a.rating_score || 0));

  return (
    <div className="wrap">
      <div className="logo">🏨 StayFinder</div>
      <main>
        <h1>Find a hotel for your trip</h1>
        <p className="sub">Search by city, dates and guests, then jump to Booking.com to book.</p>
        <SearchForm onSearch={search} loading={loading} />

        <div role="status" aria-live="polite">
          {loading && <div className="msg"><span className="spin" />Searching Booking.com… usually 10–20 seconds.</div>}
          {error && <div className="msg err">{error}</div>}
        </div>

        {data && (
          <>
            <div className="meta">
              <strong>{meta.resolved_destination || meta.destination}</strong>
              <span className="small">
                {meta.total_results?.toLocaleString()} stays · {meta.nights} night{meta.nights === 1 ? "" : "s"} · showing {props.length}
              </span>
            </div>
            <label>Sort results
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="">Booking order</option>
                <option value="price">Price: low to high</option>
                <option value="rating">Rating: high to low</option>
              </select>
            </label>
            <div className="list" style={{ marginTop: 12 }}>
              {props.map((p) => <HotelCard key={p.property_id} p={p} fallbackCurrency={meta.currency} />)}
            </div>
            <details className="card" style={{ marginTop: 12 }}>
              <summary>Structured JSON response</summary>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </details>
          </>
        )}
      </main>
      <footer>Prices and availability come from Booking.com and may change. Unofficial search tool.</footer>
    </div>
  );
}
