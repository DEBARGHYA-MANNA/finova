import React, { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from "recharts";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Briefcase, ChevronRight, Landmark,
  PiggyBank, CreditCard, BellRing, CalendarClock, GraduationCap, CarFront, BadgeCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { StatCard, Card, Stagger, CategoryIcon, Meter, FadeIn } from "../components/ui";
import { ChartTooltip, ChartLegend, Sparkline } from "../components/charts";
import { transactions, cashFlow, accounts, totalBalance, bills, portfolioSeries, holdings, loans, creditCards, creditScore } from "../data/finance";
import { monthStats, deltaPct, portfolioStats, loanMath, creditHealth, cardUtilization, utilizationTone } from "../lib/calc";

const ACCOUNT_ICONS = { checking: Landmark, savings: PiggyBank, credit: CreditCard, invest: Briefcase };
const LOAN_ICONS = { education: GraduationCap, car: CarFront, home: Landmark };

export default function Dashboard({ setPage }) {
  const { fmt, settings } = useApp();
  const stats = useMemo(() => portfolioStats(holdings), []);
  const ms = useMemo(() => monthStats(transactions), []);

  const flowData = useMemo(
    () => cashFlow.map((m) => ({ label: m.label, Income: m.income, Expenses: m.expenses, Net: Math.round(m.income - m.expenses) })),
    []
  );

  const sparkIncome = cashFlow.slice(-8).map((m) => ({ value: m.income }));
  const sparkExpenses = cashFlow.slice(-8).map((m) => ({ value: m.expenses }));
  const sparkPortfolio = portfolioSeries["1Y"].slice(-8);
  const sparkBalance = portfolioSeries["1Y"].slice(-8).map((p, i) => ({ value: p.value + 59900 }));

  const recent = useMemo(() => transactions.slice(0, 7), []);

  const cats = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const cur = transactions.filter((t) => t.amount < 0 && new Date(t.date).getTime() >= start);
    const by = {};
    for (const t of cur) by[t.category] = (by[t.category] || 0) + Math.abs(t.amount);
    const rows = Object.entries(by).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { rows: rows.slice(0, 5), total };
  }, []);

  const firstName = settings.profile.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="t3 text-xs font-mono2 uppercase tracking-[0.14em]">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-[28px] tracking-tight mt-1">
              {greeting}, <span className="acc">{firstName}</span>
            </h2>
          </div>
          <div className="panel-flat rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="t3 text-[11px] font-semibold uppercase tracking-wider">Net cash flow · MTD</span>
            <span className={`font-mono2 font-bold ${ms.income - ms.expenses >= 0 ? "pos" : "neg"}`}>
              {fmt.signed(ms.income - ms.expenses)}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* KPI row */}
      <Stagger className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total balance" value={totalBalance} format={fmt.money0} icon={Wallet}
          delta={deltaPct(ms.income - ms.expenses, ms.prevIncome - ms.prevExpenses)}
          spark={<Sparkline data={sparkBalance} color="var(--accent)" />} />
        <StatCard label="Income · MTD" value={ms.income} format={fmt.money0} icon={ArrowDownToLine} tint="var(--pos)"
          delta={deltaPct(ms.income, ms.prevIncome)} spark={<Sparkline data={sparkIncome} color="var(--pos)" />} />
        <StatCard label="Expenses · MTD" value={ms.expenses} format={fmt.money0} icon={ArrowUpFromLine} tint="var(--neg)"
          delta={deltaPct(ms.expenses, ms.prevExpenses)} deltaInvert spark={<Sparkline data={sparkExpenses} color="var(--neg)" />} />
        <StatCard label="Portfolio value" value={stats.value} format={fmt.money0} icon={Briefcase} tint="var(--accent-2)"
          delta={stats.pnlPct} spark={<Sparkline data={sparkPortfolio} color="var(--accent-2)" />} />
      </Stagger>

      {/* Cash flow + right column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
        <FadeIn className="xl:col-span-2">
          <Card
            title="Monthly cash flow"
            subtitle="Income vs. expenses with net balance — trailing 12 months"
            action={<ChartLegend items={[{ name: "Income", color: "var(--chart-1)" }, { name: "Expenses", color: "var(--chart-5)" }, { name: "Net", color: "var(--accent-2)" }]} />}
          >
            <div className="h-[280px] sm:h-[320px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flowData} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} barGap={3}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis axisLine={false} tickLine={false} width={52} tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} cursor={{ fill: "var(--accent-soft)" }} />
                  <Bar dataKey="Income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="Expenses" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={14} fillOpacity={0.85} />
                  <Line type="monotone" dataKey="Net" stroke="var(--accent-2)" strokeWidth={2.2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="flex flex-col gap-4 sm:gap-5 h-full">
            {/* Portfolio mini */}
            <Card
              title="Portfolio performance"
              subtitle="12-month trend"
              action={
                <button onClick={() => setPage("investments")} className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-xs">
                  Details <ChevronRight size={13} />
                </button>
              }
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-2xl font-mono2">{fmt.money0(stats.value)}</span>
                <span className="chip" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>{fmt.pct(stats.pnlPct)}</span>
              </div>
              <div className="h-[120px] mt-2 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioSeries["1Y"]} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="pfMini" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} cursor={{ stroke: "var(--border)" }} />
                    <Area type="monotone" dataKey="value" name="Value" stroke="var(--accent-2)" strokeWidth={2} fill="url(#pfMini)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Accounts */}
            <Card title="Accounts" subtitle="Linked balances" className="flex-1">
              <div className="space-y-1">
                {accounts.map((a) => {
                  const Icon = ACCOUNT_ICONS[a.kind];
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2 group">
                      <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--accent-soft)", color: a.tint }}>
                        <Icon size={16} strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold truncate">{a.name}</span>
                        <span className="block text-[11px] t3 truncate">{a.inst}</span>
                      </span>
                      <span className={`font-mono2 text-[13px] font-semibold ${a.balance < 0 ? "neg" : ""}`}>
                        {a.balance < 0 ? "−" : ""}{fmt.money(Math.abs(a.balance))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>

      {/* Loans & credit health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <FadeIn>
          <Card
            title="Active loans"
            subtitle={`${loans.length} open · ${fmt.compact(loans.reduce((s, l) => s + l.outstanding, 0))} outstanding`}
            action={
              <button onClick={() => setPage("credit")} className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-xs">
                Manage <ChevronRight size={13} />
              </button>
            }
            className="h-full"
          >
            <div className="space-y-4 pt-1">
              {loans.map((l) => {
                const m = loanMath(l);
                const Icon = LOAN_ICONS[l.kind] || Landmark;
                return (
                  <button key={l.id} onClick={() => setPage("credit")} className="w-full text-left group">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-transform group-hover:scale-105" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold truncate">{l.name}</span>
                        <span className="block text-[11px] t3 truncate">EMI {fmt.money0(l.emi)} · {l.rate}% p.a. · {m.tenureLabel}</span>
                      </span>
                      <span className="font-mono2 text-[13px] font-semibold shrink-0">{fmt.money0(l.outstanding)}</span>
                    </div>
                    <div className="mt-2 ml-12">
                      <Meter pct={m.paidPct} color="var(--accent)" height={6} />
                      <div className="flex justify-between mt-1 text-[10.5px]">
                        <span className="pos font-semibold font-mono2">{m.paidPct.toFixed(0)}% repaid</span>
                        <span className="t3">payoff {fmt.dateShort(m.payoffDate)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.07}>
          <Card
            title="Credit health"
            subtitle="Card utilization & score"
            action={
              <span className="chip" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>
                <BadgeCheck size={12} /> {creditScore.bureau} {creditScore.score}
              </span>
            }
            className="h-full"
          >
            {(() => {
              const h = creditHealth(creditCards);
              return (
                <button onClick={() => setPage("credit")} className="w-full text-left mb-4 group">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="font-display font-bold text-2xl font-mono2" style={{ color: utilizationTone(h.utilization) }}>
                      {h.utilization.toFixed(1)}%
                    </span>
                    <span className="text-[11px] t3">{fmt.compact(h.balance)} of {fmt.compact(h.limit)} limit</span>
                  </div>
                  <Meter pct={h.utilization} color={utilizationTone(h.utilization)} height={8} />
                </button>
              );
            })()}
            <div className="divide-y-custom">
              {creditCards.map((c) => {
                const util = cardUtilization(c);
                return (
                  <button key={c.id} onClick={() => setPage("credit")} className="w-full flex items-center gap-3 py-2.5 text-left group">
                    <span className="w-9 h-6 rounded-md grid place-items-center shrink-0 font-mono2 text-[9px] font-bold text-white/80 transition-transform group-hover:scale-105"
                      style={{ background: `linear-gradient(135deg, ${c.art[0]}, ${c.art[1]})`, border: "1px solid var(--border)" }}>
                      ••{c.last4}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{c.name}</span>
                      <span className="block text-[10.5px] t3">{c.bank}</span>
                    </span>
                    <span className="font-mono2 text-[11.5px] font-semibold shrink-0" style={{ color: utilizationTone(util) }}>{util.toFixed(1)}%</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent transactions */}
        <FadeIn className="lg:col-span-1">
          <Card
            title="Recent activity"
            subtitle={`${transactions.length} transactions synced`}
            action={
              <button onClick={() => setPage("transactions")} className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-xs">
                View all <ChevronRight size={13} />
              </button>
            }
          >
            <div className="divide-y-custom">
              {recent.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPage("transactions")}
                  className="w-full flex items-center gap-3 py-2.5 text-left group"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: "var(--accent-soft)", color: t.amount > 0 ? "var(--pos)" : "var(--accent)" }}>
                    <CategoryIcon category={t.category} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{t.desc}</span>
                    <span className="block text-[11px] t3">{fmt.dateShort(t.date)} · {t.account}</span>
                  </span>
                  <span className={`font-mono2 text-[12.5px] font-semibold shrink-0 ${t.amount > 0 ? "pos" : "t2"}`}>
                    {t.amount > 0 ? "+" : "−"}{fmt.money(Math.abs(t.amount))}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* Category breakdown */}
        <FadeIn delay={0.06} className="lg:col-span-1">
          <Card title="Spending by category" subtitle="Current month to date">
            <div className="space-y-4 pt-1">
              {cats.rows.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="flex items-center gap-2 text-[13px] font-medium min-w-0">
                      <span className="w-6 h-6 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <CategoryIcon category={c.category} size={13} />
                      </span>
                      <span className="truncate">{c.category}</span>
                    </span>
                    <span className="shrink-0 text-[12px]">
                      <span className="font-mono2 font-semibold">{fmt.money0(c.value)}</span>
                      <span className="t3 font-mono2"> · {((c.value / cats.total) * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                  <Meter pct={(c.value / cats.total) * 100} color={`var(--chart-${(cats.rows.indexOf(c) % 6) + 1})`} />
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* Upcoming bills */}
        <FadeIn delay={0.12} className="lg:col-span-1">
          <Card title="Upcoming bills" subtitle="Recurring subscriptions" action={<BellRing size={16} className="t3" />}>
            <div className="space-y-1">
              {bills.slice(0, 4).map((b) => {
                const days = Math.ceil((new Date(b.next) - Date.now()) / 86400000);
                return (
                  <div key={b.name} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 panel-inset" style={{ color: "var(--accent)" }}>
                      <CalendarClock size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{b.name}</span>
                      <span className="block text-[11px] t3">
                        {days <= 0 ? "Due today" : days === 1 ? "Tomorrow" : `In ${days} days`} · {fmt.date(b.next)}
                      </span>
                    </span>
                    <span className="font-mono2 text-[12.5px] font-semibold t2 shrink-0">{fmt.money(b.amount)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 panel-inset rounded-xl p-3 flex items-center justify-between">
              <span className="text-[11px] t3 font-semibold uppercase tracking-wider">Monthly recurring total</span>
              <span className="font-mono2 text-sm font-bold">{fmt.money(bills.reduce((s, b) => s + b.amount, 0))}</span>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
