"use client";
import { useState } from "react";
import { PinIcon, CalendarIcon, ClockIcon, UsersIcon, SlidersIcon, ChevronIcon, SearchIcon } from "./Icons";
import { CARS_POPULAR } from "../lib/cars";
import { today, addDays, plural } from "../lib/search";

// Controlled form: state lives in page.js so the filter sheet and search card share it.
// Fields mirror the Anything API function's variables exactly:
// pickup_location, dropoff_location, pickup_date, pickup_time,
// dropoff_date, dropoff_time, driver_age (+ currency in the filter sheet).
export default function CarSearchForm({ form, setForm, onSubmit, onOpenFilters, filterCount, loading, error }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function setPickupDate(v) {
    setForm((p) => ({
      ...p,
      pickupDate: v,
      dropoffDate: !p.dropoffDate || p.dropoffDate <= v ? addDays(v, 1) : p.dropoffDate,
    }));
  }

  return (
    <form className="search-form" noValidate aria-label="Search rental cars"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <label className="field">
        <PinIcon />
        <span className="field-body">
          <span className="field-label">Pick-up location</span>
          <input value={form.pickup} onChange={(e) => set("pickup", e.target.value)}
            placeholder="City, airport or address" autoComplete="off" enterKeyHint="search"
            list="car-pickup-locations" />
        </span>
      </label>
      <datalist id="car-pickup-locations">
        {CARS_POPULAR.map((d) => <option key={d} value={d} />)}
      </datalist>

      <div className="chips" role="group" aria-label="Popular pickup locations">
        {CARS_POPULAR.map((d) => (
          <button type="button" key={d} className="chip" aria-pressed={form.pickup === d}
            onClick={() => set("pickup", d)}>
            {d.replace(" Airport", "")}
          </button>
        ))}
      </div>

      <label className="field">
        <PinIcon />
        <span className="field-body">
          <span className="field-label">Drop-off location</span>
          <input value={form.dropoff} onChange={(e) => set("dropoff", e.target.value)}
            placeholder="Same as pick-up" autoComplete="off" />
        </span>
      </label>

      <div className="two">
        <label className="field">
          <CalendarIcon />
          <span className="field-body">
            <span className="field-label">Pick-up date</span>
            <input type="date" value={form.pickupDate} min={today()} onChange={(e) => setPickupDate(e.target.value)} />
          </span>
        </label>
        <label className="field">
          <ClockIcon />
          <span className="field-body">
            <span className="field-label">Pick-up time</span>
            <input type="time" value={form.pickupTime} step={900} onChange={(e) => set("pickupTime", e.target.value)} />
          </span>
        </label>
      </div>

      <div className="two">
        <label className="field">
          <CalendarIcon />
          <span className="field-body">
            <span className="field-label">Drop-off date</span>
            <input type="date" value={form.dropoffDate} min={form.pickupDate || today()}
              onChange={(e) => set("dropoffDate", e.target.value)} />
          </span>
        </label>
        <label className="field">
          <ClockIcon />
          <span className="field-body">
            <span className="field-label">Drop-off time</span>
            <input type="time" value={form.dropoffTime} step={900} onChange={(e) => set("dropoffTime", e.target.value)} />
          </span>
        </label>
      </div>

      <div className="row-actions">
        <button type="button" className="field field-btn" aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((o) => !o)}>
          <UsersIcon />
          <span className="field-body">
            <span className="field-label">Driver details</span>
            <span className="field-value">Age {form.driverAge || "—"} · 1 driver</span>
          </span>
          <ChevronIcon className={`chev${detailsOpen ? " open" : ""}`} />
        </button>
        <button type="button" className="square-btn" aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
          aria-haspopup="dialog" onClick={onOpenFilters}>
          <SlidersIcon />
          {filterCount > 0 && <b className="dot-badge" aria-hidden="true">{filterCount}</b>}
        </button>
      </div>

      {detailsOpen && (
        <div className="guest-panel">
          <div className="stepper-row">
            <label htmlFor="car-driver-age">Driver age</label>
            <input id="car-driver-age" className="age-input" type="number" inputMode="numeric" min={18} max={99}
              value={form.driverAge}
              onChange={(e) => set("driverAge", e.target.value === "" ? "" : Math.min(99, Math.max(18, Number(e.target.value))))} />
          </div>
          <p className="muted small">Young-driver fees may apply under 25.</p>
        </div>
      )}

      {error && <div className="notice err" role="alert">{error}</div>}

      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        <SearchIcon />
        {loading ? "Searching…" : "Search cars"}
      </button>
    </form>
  );
}
