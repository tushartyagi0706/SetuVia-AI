export function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function formatInterests(interests) {
  if (!interests?.length) return "Open to anything";
  return interests.join(" · ");
}

export function itemTypeLabel(type) {
  if (type === "restaurant") return "Restaurant";
  if (type === "activity") return "Activity";
  return "Place";
}

export function formatTripDate(value, options = {}) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function tripDateRange(startDate, days) {
  if (!startDate || !days) return "";
  const end = new Date(`${startDate}T00:00:00`);
  end.setDate(end.getDate() + Number(days) - 1);
  return `${formatTripDate(startDate)} - ${formatTripDate(end)}`;
}

export function tripEndDate(startDate, days) {
  if (!startDate || !days) return "";
  const end = new Date(`${startDate}T00:00:00`);
  end.setDate(end.getDate() + Number(days) - 1);
  return [end.getFullYear(), String(end.getMonth() + 1).padStart(2, "0"), String(end.getDate()).padStart(2, "0")].join("-");
}
