"use client";
import { useEffect, useState } from "react";

const iso = (d) => d.toISOString().slice(0, 10);
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

export default function SearchForm({ onSearch, loading }) {
  const [f, setF] = useState({
    destination: "Paris, France", checkin: "", checkout: "",
    adults: 2, children: 0, rooms: 1, currency: "USD",
    minPrice: "", maxPrice: "", stars: "", freeCancellation: false,
  });
  const [ages, setAges] = useState([]);
  const [error, setError] = useState("");

  // Dates are set after mount so server and client HTML match.
  useEffect(() => { setF((p) => ({ ...p, checkin: inDays(30), checkout: inDays(33) })); }, []);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function setChildren(e) {
    const n = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
    setF((p) => ({ ...p, children: n }));
    setAges((a) => Array.from({ length: n }, (_, i) => a[i] ?? 8));
  }

  function submit(e) {
    e.preventDefault();
    if (!f.destination.trim()) return setError("Please enter a destination.");
    if (!f.checkin || !f.checkout) return setError("Please choose both dates.");
    if (f.checkout <= f.checkin) return setError("Check-out must be after check-in.");
    setError("");
    const min = Number(f.stars);
    onSearch({
      destination: f.destination.trim(),
      checkin_date: f.checkin,
      checkout_date: f.checkout,
      adults: Number(f.adults) || 1,
      children: f.children,
      rooms: Number(f.rooms) || 1,
      currency: f.currency,
      min_price: f.minPrice === "" ? null : Number(f.minPrice),
      max_price: f.maxPrice === "" ? null : Number(f.maxPrice),
      star_rating: min ? [3, 4, 5].filter((n) => (min === 5 ? n === 5 : n >= min)) : null,
      free_cancellation: f.freeCancellation,
      children_ages: f.children ? ages : null,
    });
  }

  return (
    <form className="card" onSubmit={submit} noValidate aria-label="Hotel search">
      <label>Destination
        <input value={f.destination} onChange={set("destination")} placeholder="City or region" autoComplete="off" />
      </label>
      <div className="cols">
        <label>Check-in <input type="date" value={f.checkin} min={iso(new Date())} onChange={set("checkin")} /></label>
        <label>Check-out <input type="date" value={f.checkout} onChange={set("checkout")} /></label>
        <label>Adults <input type="number" min="1" max="30" value={f.adults} onChange={set("adults")} /></label>
        <label>Children <input type="number" min="0" max="10" value={f.children} onChange={setChildren} /></label>
      </div>
      {ages.length > 0 && (
        <div className="cols">
          {ages.map((a, i) => (
            <label key={i}>Child {i + 1} age
              <input type="number" min="0" max="17" value={a}
                onChange={(e) => setAges((x) => x.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
            </label>
          ))}
        </div>
      )}
      <div className="cols">
        <label>Rooms <input type="number" min="1" max="10" value={f.rooms} onChange={set("rooms")} /></label>
        <label>Currency
          <select value={f.currency} onChange={set("currency")}>
            {["USD", "EUR", "GBP", "PKR", "AED"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Min price (total) <input type="number" min="0" placeholder="Any" value={f.minPrice} onChange={set("minPrice")} /></label>
        <label>Max price (total) <input type="number" min="0" placeholder="Any" value={f.maxPrice} onChange={set("maxPrice")} /></label>
      </div>
      <label>Stars
        <select value={f.stars} onChange={set("stars")}>
          <option value="">Any</option><option value="3">3+</option><option value="4">4+</option><option value="5">5 only</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" checked={f.freeCancellation} onChange={set("freeCancellation")} /> Free cancellation only
      </label>
      {error && <div className="msg err" role="alert">{error}</div>}
      <button className="primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search hotels"}</button>
    </form>
  );
}
