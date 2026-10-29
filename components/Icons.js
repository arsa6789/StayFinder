// Small inline icon set (no icon library is installed, so no new dependency).
const base = {
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: "false",
};
const I = (children) => function Icon(props) { return <svg {...base} {...props}>{children}</svg>; };

export const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const PinIcon = I(<><path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.4" /></>);
export const CalendarIcon = I(<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
export const UsersIcon = I(<><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c.4-3.4 2.7-5.2 6-5.2s5.6 1.8 6 5.2" /><path d="M16 5.6a3 3 0 0 1 0 5.8M18 14.9c1.8.6 3 2.2 3.2 4.6" /></>);
export const SlidersIcon = I(<><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>);
export const CompassIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></>);
export const BedIcon = I(<><path d="M3 18V7M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5" /><circle cx="7" cy="11" r="1.6" /></>);
export const ChevronIcon = I(<path d="M6 9l6 6 6-6" />);
export const CloseIcon = I(<path d="M6 6l12 12M18 6L6 18" />);
export const CheckIcon = I(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const AlertIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></>);
export const ExternalIcon = I(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>);
export const HeartIcon = ({ filled, ...p }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.5s-7.8-4.7-9.4-9.6C1.5 7.6 3.4 4.5 6.7 4.5c2 0 3.5 1 5.3 2.9 1.8-1.9 3.3-2.9 5.3-2.9 3.3 0 5.2 3.1 4.1 6.4-1.6 4.9-9.4 9.6-9.4 9.6z" />
  </svg>
);
export const StarIcon = (p) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8z" />
  </svg>
);
