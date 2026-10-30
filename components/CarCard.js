"use client";
import { useState } from "react";
import { CarIcon, PinIcon, HeartIcon, CheckIcon, GearIcon, UsersIcon, SuitcaseIcon } from "./Icons";
import { money, fmtDate, plural } from "../lib/search";
import { getCarBookingUrl } from "../lib/cars";
import { openExternal } from "../lib/external";

// Rental car card. Every field is optional: anything the API didn't return is
// simply hidden, so a thin response still renders cleanly.
export default function CarCard({ p, meta, isFav, onToggleFav }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cur = p.currency || meta?.currency;
  // Do not use p.booking_url: it is a session-bound signed offer link and fails
  // for other visitors. The public search URL is valid and keeps the user's
  // location, dates, times, driver age and currency.
  const bookHref = getCarBookingUrl(p, meta?.search_url);
  const hasImage = p.image_url && !imgFailed;
  const title = p.vehicle_name || p.vehicle_category || "Rental car";
  const place = [p.vehicle_category, p.supplier_name].filter(Boolean).join(" · ");
  const days = meta?.rental_days;
  const total = money(p.total_price, cur);
  const perDay = money(p.price_per_day, cur);

  const bags =
    p.luggage_capacity != null
      ? plural(p.luggage_capacity, "bag", "bags")
      : p.small_suitcases != null || p.large_suitcases != null
        ? `${p.small_suitcases ?? 0} small · ${p.large_suitcases ?? 0} large`
        : null;

  const specs = [
    p.transmission && { icon: <GearIcon width={14} height={14} />, text: p.transmission },
    p.passenger_capacity != null && { icon: <UsersIcon width={14} height={14} />, text: plural(p.passenger_capacity, "seat") },
    bags && { icon: <SuitcaseIcon width={14} height={14} />, text: bags },
    p.doors != null && { text: plural(p.doors, "door") },
    p.air_conditioning === true && { text: "Air conditioning" },
    p.pickup_desk_type && { text: p.pickup_desk_type },
    p.pay_when && { text: String(p.pay_when).replace(/[_-]+/g, " ").toLowerCase() },
  ].filter(Boolean);

  // Long policy text goes here (clamped, full text on hover) instead of into chips.
  const conditions = [
    p.free_cancellation !== true && p.cancellation_policy,
    p.mileage_policy,
    p.fuel_policy,
    p.insurance_information,
  ].filter(Boolean).join(" · ");

  return (
    <article className="hotel">
      <div className={`media${hasImage ? "" : " no-img"}`}>
        {hasImage ? (
          // Plain <img>: works in the static Capacitor export without extra Next.js image config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)} />
        ) : (
          <span className="media-placeholder" aria-hidden="true"><CarIcon width={64} height={64} /></span>
        )}
        <div className="scrim" aria-hidden="true" />

        {p.free_cancellation === true && (
          <span className="media-tag"><CheckIcon width={14} height={14} /> Free cancellation</span>
        )}
        <button type="button" className="heart" aria-pressed={isFav}
          aria-label={isFav ? `Remove ${title} from saved` : `Save ${title}`}
          onClick={() => onToggleFav(p, meta?.search_url)}>
          <HeartIcon width={20} height={20} filled={isFav} />
        </button>

        <div className="media-text">
          <h3>{title}</h3>
          {place && (
            <p><CarIcon width={14} height={14} /> {place}</p>
          )}
        </div>
      </div>

      <div className="hotel-body">
        {p.supplier_rating != null && (
          <div className="rating-row">
            <span className="score">{p.supplier_rating}</span>
            <span className="rating-text">Supplier rating</span>
          </div>
        )}

        {meta?.pickup_location && (
          <p className="meta-line">
            <PinIcon width={14} height={14} />
            <span>
              {[meta.pickup_location,
                meta.pickup_date ? `${fmtDate(meta.pickup_date)}${meta.pickup_time ? ` · ${meta.pickup_time}` : ""}` : null,
              ].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}

        {specs.length > 0 && (
          <div className="tags">
            {specs.map((s, i) => (
              <span className="tag" key={`${s.text}-${i}`}>{s.icon}{s.text}</span>
            ))}
          </div>
        )}

        {conditions && (
          <p className="muted small car-note" title={conditions}>{conditions}</p>
        )}

        <div className="price-row">
          <div className="price-block">
            {total && <div><span className="price">{total}</span><span className="muted"> total</span></div>}
            {perDay && (
              <div className="muted small">
                {perDay} / day{days ? ` · ${plural(days, "day")}` : ""}
              </div>
            )}
          </div>
          <div className="card-actions">
            {bookHref && (
              <a className="btn btn-primary" href={bookHref} target="_blank" rel="noopener noreferrer"
                onClick={(e) => openExternal(e, bookHref)}>
                Book now
              </a>
            )}
            {!bookHref && <span className="muted small">Search again for a fresh booking link.</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
