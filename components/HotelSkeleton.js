export default function HotelSkeleton() {
  return (
    <div className="hotel" aria-hidden="true">
      <div className="thumb sk" />
      <div className="info">
        <div className="sk sk-line" style={{ width: "75%", height: 18 }} />
        <div className="sk sk-line" style={{ width: "45%" }} />
        <div className="sk sk-line" style={{ width: "60%" }} />
        <div className="sk sk-line" style={{ width: "35%", height: 24, marginTop: 14 }} />
      </div>
    </div>
  );
}