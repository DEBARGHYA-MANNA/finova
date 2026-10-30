// Number / currency / date formatting helpers (Intl-based, currency-aware)
// en-IN locale → lakh/crore grouping (₹2,61,452) and Indian date style

export const makeFmt = (currency = "INR") => {
  const money = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const money0 = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  const full = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const short = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  });

  return {
    currency,
    money: (v) => money.format(v),
    money0: (v) => money0.format(v),
    compact: (v) => compact.format(v),
    num: (v) => num.format(v),
    signed: (v) => (v < 0 ? `-${money.format(Math.abs(v))}` : `+${money.format(v)}`),
    pct: (v, dp = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(dp)}%`,
    pctAbs: (v, dp = 1) => `${Math.abs(v).toFixed(dp)}%`,
    date: (iso) => full.format(new Date(iso)),
    dateShort: (iso) => short.format(new Date(iso)),
  };
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "F";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const monthLabel = (key) => MONTHS[Number(key.split("-")[1]) - 1];
