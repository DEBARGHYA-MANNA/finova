import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import { Gauge, ReceiptText, Layers, LineChart as LineIcon, Repeat, Flame, Lightbulb, PiggyBank } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, StatCard, Segmented, FadeIn, Stagger } from "../components/ui";
import { ChartTooltip, ChartLegend } from "../components/charts";
import { cashFlow, transactions, CATEGORY_META } from "../data/finance";
import { buildInsights, savingsRateOf, categoryStack, categoryTotalsFromFlow } from "../lib/calc";

const RANGE_OPTS = [
  { id: 3, label: "3M" },
  { id: 6, label: "6M" },
  { id: 12, label: "12M" },
];
const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const catColor = (c, i) => CATEGORY_META[c]?.color || CHART_COLORS[i % CHART_COLORS.length];

export default function Analytics() {
  const { fmt } = useApp();
  const [months, setMonths] = useState(12);
  const ins = useMemo(() => buildInsights(cashFlow, transactions), []);

  const flow = useMemo(() => cashFlow.slice(-months), [months]);

  const trend = flow.map((m) => ({
    label: m.label,
    Income: Math.round(m.income),
    Expenses: Math.round(m.expenses),
    Saved: Math.round(m.income - m.expenses),
  }));

  const rates = flow.map((m) => ({ label: m.label, rate: Math.round(savingsRateOf(m.income, m.expenses) * 10) / 10 }));
  const catTotals = useMemo(() => categoryTotalsFromFlow(flow).sort((a, b) => b.value - a.value), [flow]);
  const donut = catTotals.slice(0, 6);
  const other = catTotals.slice(6).reduce((s, c) => s + c.value, 0);
  const donutData = other > 0 ? [...donut, { category: "Other", value: other }] : donut;

  const topCats = catTotals.slice(0, 5).map((c) => c.category);
  const stack = useMemo(() => categoryStack(flow, topCats), [flow, months]);

  const totalSpend = flow.reduce((s, m) => s + m.expenses, 0);
  const totalIncome = flow.reduce((s, m) => s + m.income, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Spending intelligence</h2>
            <p className="t3 text-sm mt-0.5">Where money moves, and how much of it you keep.</p>
          </div>
          <Segmented options={RANGE_OPTS} value={months} onChange={setMonths} />
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg monthly spend" value={totalSpend / months} format={fmt.money0} icon={ReceiptText} tint="var(--chart-2)" />
        <StatCard label="Savings rate · avg" value={savingsRateOf(totalIncome, totalSpend)} format={(v) => `${v.toFixed(1)}%`} icon={Gauge} tint="var(--pos)" />
        <StatCard label="Top category" value={ins.topShare} format={(v) => `${v.toFixed(0)}% of spend`} icon={Layers} tint="var(--chart-4)" />
        <StatCard label="Income growth" value={ins.incomeGrowth} format={(v) => fmt.pct(v, 1)} icon={LineIcon} tint="var(--accent-2)" />
      </Stagger>

      {/* Income vs expenses trend */}
      <FadeIn>
        <Card
          title="Income vs. expenses trend"
          subtitle={`Trailing ${months} months · shaded area = retained savings`}
          action={<ChartLegend items={[{ name: "Income", color: "var(--chart-1)" }, { name: "Expenses", color: "var(--chart-5)" }]} />}
        >
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                <YAxis axisLine={false} tickLine={false} width={52} tickFormatter={(v) => fmt.compact(v)} />
                <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} cursor={{ stroke: "var(--border)" }} />
                <Area type="monotone" dataKey="Income" stroke="var(--chart-1)" strokeWidth={2.2} fill="url(#incG)" />
                <Area type="monotone" dataKey="Expenses" stroke="var(--chart-5)" strokeWidth={2} fill="url(#expG)" strokeDasharray="0" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        {/* Category stack */}
        <FadeIn>
          <Card title="Monthly spending breakdown" subtitle="Top 5 categories stacked" className="h-full">
            <div className="h-[280px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stack} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} barSize={months === 3 ? 34 : months === 6 ? 22 : 14}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                  <YAxis axisLine={false} tickLine={false} width={52} tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} cursor={{ fill: "var(--accent-soft)" }} />
                  {topCats.map((c, i) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={catColor(c, i)} radius={i === topCats.length - 1 ? [4, 4, 0, 0] : 0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              <ChartLegend items={topCats.map((c, i) => ({ name: c, color: catColor(c, i) }))} />
            </div>
          </Card>
        </FadeIn>

        {/* Category donut */}
        <FadeIn delay={0.06}>
          <Card title="Category-wise expenses" subtitle={`Share of ${fmt.compact(totalSpend)} total spend`} className="h-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="relative h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} />
                    <Pie data={donutData} dataKey="value" nameKey="category" innerRadius={62} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                      {donutData.map((d, i) => (
                        <Cell key={d.category} fill={catColor(d.category, i)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center px-8">
                    <p className="text-[9.5px] t3 uppercase tracking-[0.14em] font-bold">{months}M spend</p>
                    <p className="font-display font-bold text-lg font-mono2">{fmt.compact(totalSpend)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {donutData.map((d, i) => (
                  <div key={d.category} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-[4px] shrink-0" style={{ background: catColor(d.category, i) }} />
                    <span className="text-[12.5px] font-medium flex-1 truncate">{d.category}</span>
                    <span className="font-mono2 text-[11.5px] t2">{fmt.money0(d.value)}</span>
                    <span className="font-mono2 text-[11.5px] font-semibold w-11 text-right acc">
                      {((d.value / totalSpend) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Savings rate */}
      <FadeIn>
        <Card
          title="Savings rate"
          subtitle="Share of income retained each month — dashed line marks the 25% target"
          action={<span className="chip" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}><PiggyBank size={12} /> {savingsRateOf(totalIncome, totalSpend).toFixed(1)}% avg</span>}
        >
          <div className="h-[230px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rates} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} barSize={30}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                <YAxis axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} domain={[0, 50]} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}%`} />} cursor={{ fill: "var(--accent-soft)" }} />
                <ReferenceLine y={25} stroke="var(--accent-2)" strokeDasharray="5 5" strokeWidth={1.4} />
                <Bar dataKey="rate" name="Savings rate" radius={[5, 5, 0, 0]}>
                  {rates.map((r) => (
                    <Cell key={r.label} fill={r.rate >= 25 ? "var(--accent)" : "var(--chart-4)"} fillOpacity={r.rate >= 25 ? 1 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </FadeIn>

      {/* Insights */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" gap={0.08}>
        {[
          {
            icon: Flame,
            color: "var(--chart-4)",
            title: "Peak spend month",
            body: `${ins.biggestMonth.label} was your costliest at ${fmt.money0(ins.biggestMonth.expenses)} — ${fmt.pct(((ins.biggestMonth.expenses - ins.avgSpend) / ins.avgSpend) * 100, 1)} above your average.`,
          },
          {
            icon: Layers,
            color: "var(--chart-2)",
            title: `Dominant category: ${ins.top.category}`,
            body: `${ins.top.category} accounts for ${ins.topShare.toFixed(0)}% of trailing 6-month spending (${fmt.money0(ins.top.value)}).`,
          },
          {
            icon: Repeat,
            color: "var(--chart-3)",
            title: "Recurring drain",
            body: `Subscriptions cost ≈ ${fmt.money(ins.subMonthly)}/month. Annualized, that's ${fmt.money0(ins.subMonthly * 12)} of silent outflow.`,
          },
          {
            icon: Lightbulb,
            color: "var(--pos)",
            title: "Wealth momentum",
            body: `At a ${ins.avgRate.toFixed(1)}% savings rate you're retaining ≈ ${fmt.money0(ins.retainedMonthly)} every month — compounding quietly.`,
          },
        ].map((c) => (
          <div key={c.title} className="panel-flat rounded-2xl p-4 h-full">
            <span className="w-9 h-9 rounded-xl grid place-items-center mb-2.5" style={{ background: "var(--accent-soft)", color: c.color }}>
              <c.icon size={16} />
            </span>
            <p className="font-display font-semibold text-[13.5px]">{c.title}</p>
            <p className="t3 text-[12px] leading-relaxed mt-1">{c.body}</p>
          </div>
        ))}
      </Stagger>
    </div>
  );
}
