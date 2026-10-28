const money = (n, c) => {
  if (n == null) return "–";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c || "USD", maximumFractionDigits: 0 }).format(n); }
  catch { return `${Math.round(n)} ${c || ""}`; }
};
const safe = (u) => (/^https:\/\//.test(u || "") ? u : "#");

export default function HotelCard({ p, fallbackCurrency }) {
  const room = p.available_rooms?.[0] || {};
  const cur = p.currency || fallbackCurrency;
  return (
    <article className="card hotel">
      <div className="top2">
        <div>
          <h2>{p.name}</h2>
          {p.star_rating ? <div aria-label={`${p.star_rating} stars`}>{"★".repeat(p.star_rating)}</div> : null}
        </div>
        {p.rating_score != null && (
          <div style={{ textAlign: "right" }}>
            <span className="score">{p.rating_score}</span>
            <div className="small">{p.rating_text}{p.reviews_count ? ` · ${p.reviews_count.toLocaleString()} reviews` : ""}</div>
          </div>
        )}
      </div>
      <div className="small">{p.display_location || p.city}{p.distance_from_center ? ` · ${p.distance_from_center}` : ""}</div>
      <div className="badges">
        {p.has_free_cancellation && <span className="b ok">Free cancellation</span>}
        {p.no_prepayment && <span className="b ok">No prepayment</span>}
        {p.is_sold_out && <span className="b">Sold out</span>}
        {room.name && <span className="b">{room.name}{room.bed_type ? ` · ${room.bed_type}` : ""}</span>}
      </div>
      <div>
        <span className="price">{money(p.price_per_night, cur)}</span> <span className="small">per night</span>
        <div className="small">
          Total {money(p.total_price, cur)}
          {p.excluded_taxes_and_fees ? ` + ${money(p.excluded_taxes_and_fees, cur)} taxes & fees` : ""}
        </div>
      </div>
      <div className="cta">
        <a className="btn" target="_blank" rel="noopener noreferrer" href={safe(room.checkout_url || p.booking_url)}>Book room</a>
        <a className="btn alt" target="_blank" rel="noopener noreferrer" href={safe(p.booking_url)}>View hotel</a>
      </div>
    </article>
  );
}
