// Same silhouette as CarCard so nothing jumps when results arrive.
export default function CarSkeleton() {
  return (
    <div className="hotel" aria-hidden="true">
      <div className="media sk" />
      <div className="hotel-body">
        <div className="sk sk-line" style={{ width: "55%" }} />
        <div className="sk sk-line" style={{ width: "40%" }} />
        <div className="tags">
          <div className="sk sk-tag" />
          <div className="sk sk-tag" />
          <div className="sk sk-tag" />
        </div>
        <div className="price-row">
          <div className="sk sk-line" style={{ width: "38%", height: 28 }} />
          <div className="sk sk-pill" />
        </div>
      </div>
    </div>
  );
}
