// ------------------------------------------------------------------
// Deterministic demo data engine — localized for Kolkata, WB, India.
// INR-denominated transactions, NSE holdings, SIPs, Indian banks,
// credit cards and loans. Generated once with a seeded PRNG.
// ------------------------------------------------------------------
import { MONTHS } from "../lib/format";

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const R = (min, max) => min + rand() * (max - min);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const round2 = (v) => Math.round(v * 100) / 100;

// ---------------- Categories ----------------
export const CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Subscriptions",
  "Health",
  "Travel",
  "Education",
  "Investments",
  "EMI & Loans",
  "Income",
];

export const CATEGORY_META = {
  "Food & Dining": { color: "var(--chart-2)", icon: "UtensilsCrossed" },
  Shopping: { color: "var(--chart-4)", icon: "ShoppingBag" },
  Transport: { color: "var(--chart-3)", icon: "CarFront" },
  Housing: { color: "var(--chart-6)", icon: "Building2" },
  Utilities: { color: "var(--chart-5)", icon: "PlugZap" },
  Entertainment: { color: "var(--chart-1)", icon: "Clapperboard" },
  Subscriptions: { color: "var(--accent)", icon: "Repeat" },
  Health: { color: "var(--chart-3)", icon: "HeartPulse" },
  Travel: { color: "var(--chart-2)", icon: "Plane" },
  Education: { color: "var(--chart-4)", icon: "GraduationCap" },
  Investments: { color: "var(--accent-2)", icon: "TrendingUp" },
  "EMI & Loans": { color: "var(--chart-6)", icon: "HandCoins" },
  Income: { color: "var(--pos)", icon: "Banknote" },
};

const ACCOUNTS_TX = ["HDFC Savings ••4521", "Regalia Card ••8890", "SBI Savings ••3307"];

// ---------------- Transaction generation (last 210 days) ----------------
const RECURRING = [
  { dom: 1, desc: "Salary — Nexovate Technologies LLP", cat: "Income", amt: 152000 },
  { dom: 8, desc: "Interest — SBI Savings", cat: "Income", amt: () => R(1500, 2600) },
  { dom: 21, desc: "Freelance payout — Upwork", cat: "Income", amt: () => R(12000, 40000), p: 0.45 },
  { dom: 26, desc: "Dividend — RELIANCE", cat: "Income", amt: () => R(280, 850), p: 0.5 },
  { dom: 1, desc: "Rent — Salt Lake Sector V 2BHK", cat: "Housing", amt: -18500 },
  { dom: 18, desc: "Society maintenance — Hiland Woods", cat: "Housing", amt: -2400, p: 0.95 },
  { dom: 7, desc: "CESC — Electricity Bill", cat: "Utilities", amt: () => -R(950, 2200) },
  { dom: 11, desc: "Airtel Postpaid", cat: "Utilities", amt: -479 },
  { dom: 12, desc: "JioFiber Broadband", cat: "Utilities", amt: -999 },
  { dom: 19, desc: "Indane LPG Refill", cat: "Utilities", amt: () => -R(850, 950), p: 0.6 },
  { dom: 3, desc: "Netflix", cat: "Subscriptions", amt: -499 },
  { dom: 9, desc: "Spotify Premium", cat: "Subscriptions", amt: -119 },
  { dom: 14, desc: "GitHub Copilot", cat: "Subscriptions", amt: -830 },
  { dom: 17, desc: "iCloud+ Storage", cat: "Subscriptions", amt: -75 },
  { dom: 23, desc: "YouTube Premium", cat: "Subscriptions", amt: -149 },
  { dom: 27, desc: "The Telegraph — ePaper", cat: "Subscriptions", amt: -99 },
  { dom: 4, desc: "Gym — Anytime Fitness Sector V", cat: "Health", amt: -2200 },
  { dom: 5, desc: "SIP — Parag Parikh Flexi Cap", cat: "Investments", amt: -5000 },
  { dom: 10, desc: "SIP — Mirae Asset Large Cap", cat: "Investments", amt: -5000 },
  { dom: 15, desc: "SIP — Axis Bluechip Fund", cat: "Investments", amt: -5000 },
  { dom: 6, desc: "EMI — SBI Scholar Education Loan", cat: "EMI & Loans", amt: -8420 },
  { dom: 9, desc: "EMI — HDFC Car Loan (Nexon EV)", cat: "EMI & Loans", amt: -19240 },
];

const POOLS = {
  "Food & Dining": [
    ["BigBasket", 900, 3200],
    ["Spencer's — South City", 750, 2100],
    ["Swiggy", 220, 680],
    ["Zomato", 180, 620],
    ["Wow! Momo", 140, 420],
    ["Arsalan — Biryani", 350, 900],
    ["Peter Cat — Chelo Kebab", 700, 1600],
    ["Coffee House — College St", 140, 380],
    ["Flurys — Park Street", 480, 1300],
    ["Balaram Mullick — Sweets", 180, 560],
    ["6 Ballygunge Place", 900, 2200],
  ],
  Transport: [
    ["Kolkata Metro — Smart Card", 100, 320],
    ["Ola Cabs", 120, 380],
    ["Uber", 130, 430],
    ["Yellow Taxi — Esplanade", 90, 260],
    ["UTS — Howrah Local", 15, 40],
    ["Indian Oil — Fuel", 500, 1400],
  ],
  Shopping: [
    ["Amazon.in", 450, 4800],
    ["Flipkart", 600, 4200],
    ["Myntra", 800, 3500],
    ["Croma — Acropolis Mall", 900, 7500],
    ["Gariahat Market", 400, 1800],
    ["New Market — SS Hogg", 300, 1500],
    ["Blinkit", 250, 900],
  ],
  Entertainment: [
    ["INOX — Quest Mall", 340, 760],
    ["BookMyShow", 300, 900],
    ["Steam", 300, 1500],
    ["Nazrul Mancha — Live", 500, 1500],
    ["Navina Cinema — Tollygunge", 180, 450],
  ],
  Travel: [
    ["IRCTC — HWH NJP Express", 900, 2800],
    ["IndiGo 6E — CCU BBI", 3800, 7400],
    ["OYO Rooms — Digha", 1600, 3400],
    ["Uber Intercity", 1100, 2600],
    ["MakeMyTrip — Darjeeling", 5500, 12000],
  ],
  Education: [
    ["Udemy", 449, 749],
    ["Coursera Plus", 3300, 3300],
    ["College Street — Books", 200, 850],
    ["GeeksforGeeks — Course", 500, 1200],
  ],
  Health: [
    ["Apollo Pharmacy", 250, 850],
    ["MedPlus", 180, 620],
    ["AMRI Diagnostics", 700, 1800],
  ],
};
const POOL_WEIGHTS = [
  ["Food & Dining", 0.36],
  ["Transport", 0.52],
  ["Shopping", 0.66],
  ["Entertainment", 0.75],
  ["Health", 0.82],
  ["Education", 0.88],
  ["Travel", 1],
];
const pickPool = () => {
  const x = rand();
  for (const [cat, w] of POOL_WEIGHTS) if (x < w) return cat;
  return "Travel";
};

const DAY = 86400000;
const now = Date.now();
const txs = [];
let idc = 1;
let travelThisMonth = 0;
let lastMonthIdx = -1;

for (let back = 209; back >= 0; back--) {
  const t = new Date(now - back * DAY);
  const dow = t.getDay();
  const monthIdx = t.getMonth();
  if (monthIdx !== lastMonthIdx) {
    travelThisMonth = 0;
    lastMonthIdx = monthIdx;
  }
  const iso = (h, m) => {
    const d = new Date(t);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const isRecent = back <= 2;
  const status = () => {
    if (isRecent) return rand() < 0.62 ? "pending" : "completed";
    return rand() < 0.012 ? "failed" : "completed";
  };
  const push = (desc, cat, amt, h = 10, m = 30) => {
    const v = round2(typeof amt === "function" ? amt() : amt);
    txs.push({
      id: `t${idc++}`,
      date: iso(h, m),
      desc,
      category: cat,
      account: v > 0 ? "HDFC Savings ••4521" : pick(ACCOUNTS_TX),
      amount: v,
      status: status(),
      type: v > 0 ? "income" : "expense",
    });
  };

  for (const r of RECURRING) {
    if (r.dom === t.getDate() && (r.p === undefined || rand() < r.p)) {
      push(r.desc, r.cat, r.amt, 8 + Math.floor(R(0, 4)), Math.floor(R(0, 59)));
    }
  }

  const weekend = dow === 0 || dow === 6;
  const rolls = weekend ? 1 + Math.floor(R(0, 3)) : rand() < 0.62 ? 1 : 0;
  for (let i = 0; i < rolls; i++) {
    const cat = pickPool();
    if (cat === "Travel") {
      if (travelThisMonth >= 2) continue;
      travelThisMonth++;
    }
    const [m, lo, hi] = pick(POOLS[cat]);
    push(m, cat, -R(lo, hi), 9 + Math.floor(R(0, 12)), Math.floor(R(0, 59)));
  }
}
txs.sort((a, b) => new Date(b.date) - new Date(a.date));
export const transactions = txs;

// ---------------- Cash flow (12 months) ----------------
const catAgg = (list) => {
  const byCat = {};
  for (const t of list) if (t.amount < 0) byCat[t.category] = round2((byCat[t.category] || 0) - t.amount);
  return byCat;
};

const realMonths = {};
for (const t of transactions) {
  const d = new Date(t.date);
  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  realMonths[k] = realMonths[k] || [];
  realMonths[k].push(t);
}

const EXPENSE_PROFILE = [
  ["Food & Dining", 15000, 22000],
  ["Shopping", 8000, 15500],
  ["Transport", 4500, 7800],
  ["Housing", 18500, 20900],
  ["Utilities", 3300, 4600],
  ["Entertainment", 2400, 5800],
  ["Subscriptions", 1771, 1771],
  ["Health", 3200, 6200],
  ["Education", 900, 2800],
  ["Investments", 15000, 15000],
  ["EMI & Loans", 27660, 27660],
];

export const cashFlow = (() => {
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * 30.44 * DAY);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const real = realMonths[key];
    if (real) {
      const income = round2(real.filter((x) => x.amount > 0).reduce((s, x) => s + x.amount, 0));
      const byCat = catAgg(real);
      const expenses = round2(Object.values(byCat).reduce((s, v) => s + v, 0));
      out.push({ key, label: MONTHS[d.getMonth()], income, expenses, byCat });
    } else {
      const income = round2(R(142000, 160000));
      const byCat = {};
      for (const [cat, lo, hi] of EXPENSE_PROFILE) byCat[cat] = round2(R(lo, hi));
      const expenses = round2(Object.values(byCat).reduce((s, v) => s + v, 0));
      out.push({ key, label: MONTHS[d.getMonth()], income, expenses, byCat });
    }
  }
  return out;
})();

// ---------------- Holdings & portfolio history ----------------
const makeCloses = (endPrice, n = 14, drift = 0.03, vol = 0.05, seed = 7) => {
  const r = mulberry32(seed);
  const closes = new Array(n);
  closes[n - 1] = endPrice;
  for (let i = n - 2; i >= 0; i--) closes[i] = round2(closes[i + 1] / (1 + drift + (r() - 0.5) * 2 * vol));
  return closes;
};

// NSE / BSE flavour — shares, avg cost, last traded price (₹)
const H = [
  { sym: "RELIANCE", name: "Reliance Industries", type: "Stock", shares: 20, avg: 2410.5, price: 2985.4, dcp: 0.92, drift: 0.03, vol: 0.045, seed: 11 },
  { sym: "TCS", name: "Tata Consultancy Svcs", type: "Stock", shares: 10, avg: 3650.2, price: 4580.75, dcp: 0.61, drift: 0.03, vol: 0.04, seed: 22 },
  { sym: "INFY", name: "Infosys Ltd.", type: "Stock", shares: 15, avg: 1420.4, price: 1865.9, dcp: 1.14, drift: 0.032, vol: 0.05, seed: 33 },
  { sym: "HDFCBANK", name: "HDFC Bank Ltd.", type: "Stock", shares: 12, avg: 1485.3, price: 1945.6, dcp: 0.44, drift: 0.028, vol: 0.04, seed: 44 },
  { sym: "ITC", name: "ITC Ltd.", type: "Stock", shares: 30, avg: 425.8, price: 492.35, dcp: -0.28, drift: 0.018, vol: 0.035, seed: 55 },
  { sym: "TATAMOTORS", name: "Tata Motors Ltd.", type: "Stock", shares: 12, avg: 640.2, price: 985.1, dcp: 1.83, drift: 0.038, vol: 0.07, seed: 66 },
  { sym: "NIFTYBEES", name: "Nippon Nifty 50 ETF", type: "ETF", shares: 120, avg: 218.6, price: 272.45, dcp: 0.52, drift: 0.024, vol: 0.028, seed: 77 },
  { sym: "GOLDBEES", name: "Nippon Gold BeES", type: "ETF", shares: 60, avg: 52.4, price: 68.15, dcp: 0.71, drift: 0.022, vol: 0.025, seed: 88 },
  { sym: "PPFAS", name: "Parag Parikh Flexi Cap", type: "Mutual Fund", shares: 180, avg: 62.35, price: 78.42, dcp: 0.32, drift: 0.024, vol: 0.026, seed: 99 },
  { sym: "MIRAE", name: "Mirae Asset Large Cap", type: "Mutual Fund", shares: 250, avg: 92.1, price: 108.94, dcp: 0.21, drift: 0.02, vol: 0.026, seed: 111 },
];

export const holdings = H.map((h) => {
  const closes = makeCloses(h.price, 14, h.drift, h.vol, h.seed);
  return { ...h, closes, spark: closes.slice(-6) };
});

const pfValueAt = (closeIdx) => holdings.reduce((s, h) => s + h.shares * h.closes[closeIdx], 0);

export const portfolioSeries = (() => {
  const r = mulberry32(777);
  const mk = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now - (13 - i) * 30.44 * DAY);
    mk.push({ label: MONTHS[d.getMonth()], value: Math.round(pfValueAt(i)) });
  }
  const [a, b] = [pfValueAt(12), pfValueAt(13)];
  const m1 = [];
  for (let i = 0; i < 30; i++) {
    const p = a + ((b - a) * i) / 29;
    m1.push({ label: `${i + 1}`, value: Math.round(p * (1 + (r() - 0.5) * 0.008)) });
  }
  return {
    "1M": m1,
    "6M": mk.slice(-6),
    "1Y": mk.slice(-12),
  };
})();

// ---------------- Credit cards ----------------
export const creditCards = [
  {
    id: "regalia",
    name: "Regalia Gold",
    bank: "HDFC Bank",
    network: "Visa Signature",
    last4: "8890",
    limit: 500000,
    balance: 12430.5,
    apr: 41.88,
    dueDay: 8,
    minDuePct: 5,
    art: ["#232c46", "#0d1322"],
    glow: "#e8b64c",
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    bank: "ICICI Bank",
    network: "Visa Platinum",
    last4: "4412",
    limit: 150000,
    balance: 9840,
    apr: 44.4,
    dueDay: 22,
    minDuePct: 5,
    art: ["#3d2e18", "#151009"],
    glow: "#fb923c",
  },
];

// ---------------- Loans ----------------
export const loans = [
  {
    id: "edu",
    name: "Education Loan",
    lender: "SBI Scholar · Jadavpur",
    kind: "education",
    principal: 800000,
    outstanding: 362400,
    rate: 9.15,
    emi: 8420,
    emiDay: 6,
    started: "Jul 2023",
    tenureMonths: 120,
  },
  {
    id: "car",
    name: "Car Loan — Nexon EV",
    lender: "HDFC Bank · Ruby Branch",
    kind: "car",
    principal: 950000,
    outstanding: 510200,
    rate: 8.1,
    emi: 19240,
    emiDay: 9,
    started: "Jan 2024",
    tenureMonths: 60,
  },
];

// ---------------- Credit score ----------------
export const creditScore = {
  bureau: "CIBIL",
  score: 782,
  band: "Excellent",
  updated: "This week",
  history: [734, 741, 748, 752, 761, 771, 775, 782],
  factors: [
    { name: "Payment history", pct: 100, note: "No missed payments in 30 months" },
    { name: "Credit utilization", pct: 96, note: "3.4% of total limit — very healthy" },
    { name: "Credit age", pct: 64, note: "Oldest line: 4 yrs 2 months" },
    { name: "Hard inquiries", pct: 88, note: "1 inquiry in the last 12 months" },
  ],
};

// ---------------- Accounts ----------------
export const portfolioValue = Math.round(pfValueAt(13));

export const accounts = [
  { id: "checking", name: "Salary Account", inst: "HDFC Bank — Salt Lake", kind: "checking", balance: 68420.55, tint: "var(--chart-2)" },
  { id: "savings", name: "Savings + FD Sweep", inst: "State Bank of India", kind: "savings", balance: 486230.4, tint: "var(--chart-1)" },
  { id: "credit", name: "Regalia Gold Credit Card", inst: "HDFC Bank", kind: "credit", balance: -12430.5, tint: "var(--chart-5)" },
  { id: "credit2", name: "Amazon Pay Credit Card", inst: "ICICI Bank", kind: "credit", balance: -9840, tint: "var(--chart-4)" },
  { id: "brokerage", name: "Demat — Kite", inst: "Zerodha", kind: "invest", balance: portfolioValue, tint: "var(--accent)" },
];

export const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

// ---------------- Upcoming bills ----------------
export const bills = RECURRING.filter((r) => r.cat === "Subscriptions")
  .map((r) => {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    d.setDate(r.dom);
    if (d.getTime() < now) d.setMonth(d.getMonth() + 1);
    return { name: r.desc, amount: typeof r.amt === "number" ? -r.amt : 99, next: d.toISOString() };
  })
  .sort((a, b) => new Date(a.next) - new Date(b.next));

export const avgMonthlySpend = round2(
  cashFlow.slice(0, 11).reduce((s, m) => s + m.expenses, 0) / 11
);
