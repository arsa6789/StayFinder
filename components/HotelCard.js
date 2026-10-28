"use client";
import { useState } from "react";
import { PinIcon, HeartIcon, StarIcon } from "./Icons";

const money = (n, c) => {
  if (n == null) return "–";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c || "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n)} ${c || ""}`;
  }
};
const safe = (u) => (/^https:\/\//.test(u || "") ? u : "#");

export default function HotelCard({ p, fallbackCurrency, nights, isFav, onToggleFav }) {
  const [imgFailed, setImgFailed] = useState(false);
  const room = p.available_rooms?.[0] || {};
  const cur = p.currency || fallbackCurrency;

  return (
    <article className="hotel">
      <div className="thumb">
        {p.thumbnail && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnail} alt={`Photo of ${p.name}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} />
        ) : (
          <div className="thumb-fallback" aria-hidden="true">🏨</div>
        )}
        {p.has_free_cancellation && <span className="deal">Free cancellation</span>}
      </div>

      <button type="button" className="heart" aria-pressed={isFav} aria-label={isFav ? `Remove ${p.name} from saved` : `Save ${p.name}`}
        onClick={() => onToggleFav(p.property_id)}>
        <HeartIcon filled={isFav} width={18} height={18} />
      </button>

      <div className="info">
        <h2>{p.name}</h2>
        <div className="rating-row">
          {p.star_rating ? (
            <span className="stars" aria-label={`${p.star_rating} stars`}>
              {Array.from({ length: p.star_rating }, (_, i) => <StarIcon key={i} width={12} height={12} />)}
            </span>
          ) : null}
          {p.rating_score != null && (
            <>
              <span className="score">{p.rating_score}</span>
              <span className="small">{p.rating_text}{p.reviews_count ? ` · ${p.reviews_count.toLocaleString()}` : ""}</span>
            </>
          )}
        </div>
        <div className="loc small">
          <PinIcon width={14} height={14} />
          {p.distance_from_center || p.display_location || p.city}
        </div>
        {room.name && <div className="small room">{room.name}{room.bed_type ? ` · ${room.bed_type}` : ""}</div>}
        {p.no_prepayment && <div className="ok small">No prepayment needed</div>}

        <div className="price-row">
          <div>
            <span className="price">{money(p.price_per_night, cur)}</span>
            <span className="small"> /night</span>
            <div className="small">
              {money(p.total_price, cur)} total{nights ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}
            </div>
            {p.excluded_taxes_and_fees ? (
              <div className="small">+ {money(p.excluded_taxes_and_fees, cur)} taxes &amp; fees</div>
            ) : null}
          </div>
          <a className="btn-sm" target="_blank" rel="noopener noreferrer" href={safe(room.checkout_url || p.booking_url)}>
            {p.is_sold_out ? "View" : "Book now"}
          </a>
        </div>
      </div>
    </article>
  );
}