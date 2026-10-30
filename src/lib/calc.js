// ------------------------------------------------------------------
// Pure financial calculations: filtering, aggregates, P&L, allocation
// ------------------------------------------------------------------
const DAY = 86400000;

export const RANGES = [
  { id: "7d", label: "7D", days: 7 },
  { id: "30d", label: "30D", days: 30 },
  { id: "90d", label: "90D", days: 90 },
  { id: "180d", label: "6M", days: 180 },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];

// ---------------- Transactions filtering ----------------
export function filterTx(tx, { q = "", category = "all", status = "all", type = "all", range = "30d", from = "", to = "" }) {
  const query = q.trim().toLowerCase();
  let since = null;
  let until = null;
  const now = Date.now();
  const preset = RANGES.find((r) => r.id === range);
  if (preset?.days) since = now - preset.days * DAY;
  if (range === "all") since = null;
  if (range === "custom") {
    if (from) since = new Date(from + "T00:00:00").getTime();
    if (to) until = new Date(to + "T23:59:59").getTime();
  }
  return tx.filter((t) => {
    const ts = new Date(t.date).getTime();
    if (since && ts < since) return false;
    if (until && ts > until) return false;
    if (category !== "all" && t.category !== category) return false;
    if (status !== "all" && t.status !== status) return false;
    if (type === "income" && t.amount <= 0) return false;
    if (type === "expense" && t.amount >= 0) return false;
    if (query) {
      const hay = `${t.desc} ${t.category} ${t.account}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

// ---------------- Aggregates ----------------
export const sumIn = (tx) => tx.reduce((s, t) => (t.amount > 0 ? s + t.amount : s), 0);
export const sumOut = (tx) => Math.abs(tx.reduce((s, t) => (t.amount < 0 ? s + t.amount : s), 0));

export function monthStats(tx) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const cur = tx.filter((t) => new Date(t.date).getTime() >= start);
  const prev = tx.filter((t) => {
    const ts = new Date(t.date).getTime();
    return ts >= prevStart && ts < start;
  });
  return {
    income: sumIn(cur),
    expenses: sumOut(cur),
    prevIncome: sumIn(prev),
    prevExpenses: sumOut(prev),
  };
}

export function categoryTotals(tx, { countAll = false } = {}) {
  const map = new Map();
  for (const t of tx) {
    if (t.amount >= 0 && !countAll) continue;
    const key = t.category;
    const cur = map.get(key) || { category: key, value: 0, count: 0 };
    cur.value += Math.abs(t.amount);
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export const savingsRateOf = (income, expenses) => (income > 0 ? ((income - expenses) / income) * 100 : 0);

export const deltaPct = (cur, prev) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : 0);

// ---------------- Portfolio ----------------
export function portfolioStats(holdings) {
  let value = 0;
  let cost = 0;
  let prevValue = 0;
  for (const h of holdings) {
    const v = h.shares * h.price;
    value += v;
    cost += h.shares * h.avg;
    prevValue += (h.shares * h.price) / (1 + h.dcp / 100);
  }
  const pnl = value - cost;
  const dayChange = value - prevValue;
  return {
    value: Math.round(value * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    pnl,
    pnlPct: (pnl / cost) * 100,
    dayChange,
    dayChangePct: (dayChange / prevValue) * 100,
  };
}

export function allocBy(holdings, key) {
  const total = holdings.reduce((s, h) => s + h.shares * h.price, 0);
  const map = new Map();
  for (const h of holdings) {
    const k = h[key];
    map.set(k, (map.get(k) || 0) + h.shares * h.price);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, value: Math.round(v), pct: (v / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

export const holdingPL = (h) => {
  const value = h.shares * h.price;
  const cost = h.shares * h.avg;
  return { value, cost, pnl: value - cost, pnlPct: ((h.price - h.avg) / h.avg) * 100 };
};

// ---------------- Analytics helpers ----------------
export const cashFlowSlice = (cashFlow, months) => cashFlow.slice(-months);

export function categoryStack(cashFlow, cats) {
  return cashFlow.map((m) => {
    const row = { label: m.label };
    for (const c of cats) row[c] = m.byCat[c] || 0;
    return row;
  });
}

export function categoryTotalsFromFlow(cashFlow) {
  const map = new Map();
  for (const m of cashFlow)
    for (const [cat, v] of Object.entries(m.byCat)) map.set(cat, (map.get(cat) || 0) + v);
  return [...map.entries()].map(([category, value]) => ({ category, value }));
}

// ---------------- Credit & loans ----------------
export function nextOccurrence(dayOfMonth) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(dayOfMonth);
  if (d.getTime() < Date.now()) d.setMonth(d.getMonth() + 1);
  return d;
}

// Standard amortization — months to payoff, payoff date, interest remaining
export function loanMath(loan) {
  const r = loan.rate / 1200;
  const P = loan.outstanding;
  const E = loan.emi;
  let n;
  if (E <= r * P) {
    n = 999; // EMI doesn't cover interest (guard)
  } else {
    n = Math.ceil(Math.log(E / (E - r * P)) / Math.log(1 + r));
  }
  const payoff = nextOccurrence(loan.emiDay);
  payoff.setMonth(payoff.getMonth() + n);
  const interestLeft = Math.max(0, n * E - P);
  const paidPct = ((loan.principal - loan.outstanding) / loan.principal) * 100;
  const yearsLeft = Math.floor(n / 12);
  const monthsLeft = n % 12;
  return {
    monthsRemaining: n,
    payoffDate: payoff.toISOString(),
    interestLeft,
    paidPct,
    tenureLabel: yearsLeft > 0 ? `${yearsLeft}y ${monthsLeft}m left` : `${monthsLeft}m left`,
    nextEmi: nextOccurrence(loan.emiDay).toISOString(),
  };
}

export const cardUtilization = (c) => (c.balance / c.limit) * 100;
export const minDueOf = (c) => Math.round((c.balance * c.minDuePct) / 100);

export const daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);

export function creditHealth(cards) {
  const limit = cards.reduce((s, c) => s + c.limit, 0);
  const balance = cards.reduce((s, c) => s + c.balance, 0);
  return {
    limit,
    balance,
    utilization: (balance / limit) * 100,
    available: limit - balance,
    minDueTotal: cards.reduce((s, c) => s + minDueOf(c), 0),
  };
}

export const utilizationTone = (pct) =>
  pct < 30 ? "var(--pos)" : pct < 70 ? "var(--warn)" : "var(--neg)";

export function buildInsights(cashFlow, tx) {
  const last6 = cashFlow.slice(-6);
  const avgSpend = last6.reduce((s, m) => s + m.expenses, 0) / last6.length;
  const avgIncome = last6.reduce((s, m) => s + m.income, 0) / last6.length;
  const rates = last6.map((m) => savingsRateOf(m.income, m.expenses));
  const avgRate = rates.reduce((s, r) => s + r, 0) / rates.length;
  const totals = categoryTotalsFromFlow(last6).sort((a, b) => b.value - a.value);
  const top = totals[0] || { category: "—", value: 0 };
  const topShare = (top.value / last6.reduce((s, m) => s + m.expenses, 0)) * 100;
  const subs = tx.filter((t) => t.category === "Subscriptions" && t.amount < 0);
  const subMonthly = sumOut(subs) / 7;
  const incomeFirst = cashFlow[0].income;
  const incomeLast = cashFlow[cashFlow.length - 1].income;
  const incomeGrowth = deltaPct(incomeLast, incomeFirst);
  const biggestMonth = [...cashFlow].sort((a, b) => b.expenses - a.expenses)[0];
  const retainedMonthly = (avgIncome * avgRate) / 100;
  return { avgSpend, avgIncome, avgRate, top, topShare, subMonthly, incomeGrowth, biggestMonth, retainedMonthly };
}
