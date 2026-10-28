const base = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
};

export const PinIcon = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
);
export const BedIcon = (p) => (
  <svg {...base} {...p}><path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 15h18M7 9V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" /></svg>
);
export const BackIcon = (p) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>
);
export const ChevronIcon = (p) => (
  <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const SlidersIcon = (p) => (
  <svg {...base} {...p}><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const HeartIcon = ({ filled, ...p }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3 2-1.9 3.5-3 5.5-3C21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21z" />
  </svg>
);
export const StarIcon = (p) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.5 5.8 21 7.2 14 2 9.3 8.9 8.6" />
  </svg>
);