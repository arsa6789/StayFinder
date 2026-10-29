import { CompassIcon, HeartIcon, SlidersIcon } from "./Icons";

// Floating pill on phones, moves to the top-right on desktop (see .nav in globals.css).
export default function BottomNav({ tab, onTab, savedCount, filterCount, onFilters }) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-pill">
        <button type="button" className="nav-item" aria-label="Explore" aria-current={tab === "explore" ? "page" : undefined}
          onClick={() => onTab("explore")}>
          <CompassIcon width={22} height={22} />
          <span className="nav-label">Explore</span>
        </button>
        <button type="button" className="nav-item" aria-label={`Saved${savedCount ? `, ${savedCount} stays` : ""}`}
          aria-current={tab === "saved" ? "page" : undefined} onClick={() => onTab("saved")}>
          <HeartIcon width={22} height={22} filled={tab === "saved"} />
          <span className="nav-label">Saved</span>
          {savedCount > 0 && <b className="nav-badge" aria-hidden="true">{savedCount > 9 ? "9+" : savedCount}</b>}
        </button>
        <button type="button" className="nav-item" aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`}
          aria-haspopup="dialog" onClick={onFilters}>
          <SlidersIcon width={22} height={22} />
          <span className="nav-label">Filters</span>
          {filterCount > 0 && <b className="nav-badge" aria-hidden="true">{filterCount}</b>}
        </button>
      </div>
    </nav>
  );
}
