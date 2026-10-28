"use client";
import { useEffect, useState } from "react";
import { PinIcon, CalendarIcon, BedIcon, SlidersIcon, ChevronIcon } from "./Icons";

const POPULAR = ["Paris, France", "Dubai, UAE", "Istanbul, Turkey", "London, UK", "Bangkok, Thailand"];
const STAR_OPTIONS = [["", "Any"], ["3", "3+"], ["4", "4+"], ["5", "5 only"]];

const iso = (d) => d.toISOString().slice(0, 10);
const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="stepper-row">
      <div className="stepper-label">{label}</div>
      <div className="stepper">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function SearchForm({ onSearch, loading }) {
  const [f, setF] = useState({
    destination: "Paris, France", checkin: "", checkout: "",
    adults: 2, children: 0, rooms: 1, currency: "USD",
    minPrice: "", maxPrice: "", stars: "", freeCancellation: false,
  });
  const [ages, setAges] = useState([]);
  const [error, setError] = useState("");
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Dates are set after mount so server and client HTML match.
  useEffect(() => {
    setF((p) => ({ ...p, checkin: inDays(30), checkout: inDays(33) }));
  }, []);

  const set = (k) => (e) =>
    setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const setNum = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const setChildren = (n) => {
    setF((p) => ({ ...p, children: n }));
    setAges((a) => Array.from({ length: n }, (_, i) => a[i] ?? 8));
  };

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
      adults: f.adults,
      children: f.children,
      rooms: f.rooms,
      currency: f.currency,
      min_price: f.minPrice === "" ? null : Number(f.minPrice),
      max_price: f.maxPrice === "" ? null : Number(f.maxPrice),
      star_rating: min ? [3, 4, 5].filter((n) => (min === 5 ? n === 5 : n >= min)) : null,
      free_cancellation: f.freeCancellation,
      children_ages: f.children ? ages : null,
    });
  }

  return (
    <form className="panel" onSubmit={submit} noValidate aria-label="Hotel search">
      <label className="field">
        <PinIcon />
        <span className="field-body">
          <span className="field-label">Destination</span>
          <input value={f.destination} onChange={set("destination")} placeholder="Enter your destination" autoComplete="off" />
        </span>
      </label>

      <div className="chips" role="group" aria-label="Popular destinations">
        {POPULAR.map((d) => (
          <button type="button" key={d} className="chip" onClick={() => setF((p) => ({ ...p, destination: d }))}>
            {d.split(",")[0]}
          </button>
        ))}
      </div>

      <div className="row2">
        <label className="field">
          <CalendarIcon />
          <span className="field-body">
            <span className="field-label">Check-in</span>
            <input type="date" value={f.checkin} min={iso(new Date())} onChange={set("checkin")} />
          </span>
        </label>
        <label className="field">
          <CalendarIcon />
          <span className="field-body">
            <span className="field-label">Check-out</span>
            <input type="date" value={f.checkout} min={f.checkin} onChange={set("checkout")} />
          </span>
        </label>
      </div>

      <button type="button" className="field field-btn" aria-expanded={guestsOpen} onClick={() => setGuestsOpen((o) => !o)}>
        <BedIcon />
        <span className="field-body">
          <span className="field-label">Rooms &amp; guests</span>
          <span className="field-value">
            {plural(f.rooms, "room")} · {plural(f.adults, "adult")} · {plural(f.children, "child").replace("childs", "children")}
          </span>
        </span>
        <ChevronIcon className={`chev ${guestsOpen ? "open" : ""}`} />
      </button>

      {guestsOpen && (
        <div className="sub-panel">
          <Stepper label="Rooms" value={f.rooms} min={1} max={10} onChange={setNum("rooms")} />
          <Stepper label="Adults" value={f.adults} min={1} max={30} onChange={setNum("adults")} />
          <Stepper label="Children" value={f.children} min={0} max={10} onChange={setChildren} />
          {ages.length > 0 && (
            <div className="row2 ages">
              {ages.map((a, i) => (
                <label className="field" key={i}>
                  <span className="field-body">
                    <span className="field-label">Child {i + 1} age</span>
                    <input type="number" min="0" max="17" value={a}
                      onChange={(e) => setAges((x) => x.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="button" className="field field-btn" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
        <SlidersIcon />
        <span className="field-body">
          <span className="field-label">Filters</span>
          <span className="field-value">Price, stars, free cancellation</span>
        </span>
        <ChevronIcon className={`chev ${filtersOpen ? "open" : ""}`} />
      </button>

      {filtersOpen && (
        <div className="sub-panel filters">
          <div className="field-label">Star rating</div>
          <div className="chips" role="group" aria-label="Star rating">
            {STAR_OPTIONS.map(([val, label]) => (
              <button type="button" key={label} className="chip" aria-pressed={f.stars === val}
                onClick={() => setF((p) => ({ ...p, stars: val }))}>
                {label}
              </button>
            ))}
          </div>
          <div className="row2">
            <label className="field">
              <span className="field-body">
                <span className="field-label">Min total</span>
                <input type="number" min="0" placeholder="Any" value={f.minPrice} onChange={set("minPrice")} />
              </span>
            </label>
            <label className="field">
              <span className="field-body">
                <span className="field-label">Max total</span>
                <input type="number" min="0" placeholder="Any" value={f.maxPrice} onChange={set("maxPrice")} />
              </span>
            </label>
          </div>
          <label className="field">
            <span className="field-body">
              <span className="field-label">Currency</span>
              <select value={f.currency} onChange={set("currency")}>
                {["USD", "EUR", "GBP", "PKR", "AED"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.freeCancellation} onChange={set("freeCancellation")} />
            Free cancellation only
          </label>
        </div>
      )}

      {error && <div className="msg err" role="alert">{error}</div>}
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Searching…" : "Search for a hotel"}
      </button>
    </form>
  );
}