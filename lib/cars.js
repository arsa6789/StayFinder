// Shared helpers for the car rental search form and request payload.
// buildCarPayload() produces exactly the fields app/api/cars/search/route.js
// validates, which match the Anything API function's declared variables
// (Rentalcars.com Car Rental Search — 527ffa59-a927-4afb-be04-ae6e260288b2).

export const CARS_POPULAR = [
  "London Heathrow Airport",
  "Paris CDG Airport",
  "Dubai DXB Airport",
  "Istanbul IST Airport",
  "Bangkok BKK Airport",
];

export const DEFAULT_CAR_FORM = {
  pickup: "",
  dropoff: "",
  pickupDate: "",
  pickupTime: "10:00",
  dropoffDate: "",
  dropoffTime: "10:00",
  driverAge: 30,
  currency: "USD",
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isTime = (s) => typeof s === "string" && TIME_RE.test(s);

export function validateCar(f) {
  if (!String(f.pickup ?? "").trim()) return "Please enter a pick-up location.";
  if (!f.pickupDate || !f.dropoffDate) return "Please choose both pick-up and drop-off dates.";
  if (f.dropoffDate < f.pickupDate) return "Drop-off can’t be before pick-up.";
  if (!isTime(f.pickupTime)) return "Please choose a valid pick-up time.";
  if (!isTime(f.dropoffTime)) return "Please choose a valid drop-off time.";
  if (f.dropoffDate === f.pickupDate && f.dropoffTime <= f.pickupTime) {
    return "Drop-off must be after pick-up on the same day.";
  }
  const age = Number(f.driverAge);
  if (!Number.isFinite(age) || age < 18 || age > 99) return "Driver age must be between 18 and 99.";
  return "";
}

export function buildCarPayload(f) {
  return {
    pickup_location: String(f.pickup ?? "").trim(),
    dropoff_location: String(f.dropoff ?? "").trim(), // "" = same as pick-up (function default)
    pickup_date: f.pickupDate,
    pickup_time: f.pickupTime || "10:00",
    dropoff_date: f.dropoffDate,
    dropoff_time: f.dropoffTime || "10:00",
    driver_age: Number(f.driverAge) || DEFAULT_CAR_FORM.driverAge,
    currency: f.currency || DEFAULT_CAR_FORM.currency,
    page: 1,
  };
}

// Stable id for React keys and the saved-cars list. Prefers the supplier's own
// id, then name+supplier (plus price so two offers of the same car stay
// distinct), then the booking link.
export const carId = (v) => {
  if (!v) return "";
  if (v.vehicle_id) return v.vehicle_id;
  const label = [v.vehicle_name, v.supplier_name].filter(Boolean).join("|");
  if (label) return `${label}|${v.total_price ?? ""}`;
  return v.booking_url || "";
};

// How many car filters are switched on (for badges). Only currency lives in
// the car filter sheet; driver age and dates are search fields, not filters.
export const activeCarFilterCount = (f) =>
  Boolean(f.currency && f.currency !== DEFAULT_CAR_FORM.currency) ? 1 : 0;
