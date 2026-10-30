import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { Briefcase, Coins, TrendingUp, Activity, ChevronDown, Trophy, TriangleAlert } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, StatCard, Segmented, TypeBadge, FadeIn, Stagger } from "../components/ui";
import { ChartTooltip, Sparkline } from "../components/charts";
import DataTable from "../components/DataTable";
import { holdings, portfolioSeries } from "../data/finance";
import { portfolioStats, allocBy, holdingPL } from "../lib/calc";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const RANGE_OPTS = [
  { id: "1M", label: "1M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
];

export default function Investments() {
  const { fmt } = useApp();
  const stats = useMemo(() => portfolioStats(holdings), []);
  const alloc = useMemo(() => allocBy(holdings, "type"), []);
  const [range, setRange] = useState("1Y");
  const [expanded, setExpanded] = useState(null);

  const series = portfolioSeries[range];
  const rangeReturn = ((series[series.length - 1].value - series[0].value) / series[0].value) * 100;
  const gainColor = rangeReturn >= 0 ? "var(--pos)" : "var(--neg)";

  const [best, worst] = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => holdingPL(b).pnlPct - holdingPL(a).pnlPct);
    return [sorted[0], sorted[sorted.length - 1]];
  }, []);

  const columns = [
    {
      key: "asset",
      label: "Holding",
      accessor: (h) => h.name,
      render: (h) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <span
            className="w-9 h-9 rounded-xl grid place-items-center font-mono2 font-bold text-[11px] shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {h.sym.slice(0, 4)}
          </span>
          <span className="min-w-0">
            <span className="block font-semibold truncate">{h.name}</span>
            <span className="flex items-center gap-1.5 text-[11px] t3">
              {h.sym} <TypeBadge type={h.type} />
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`t3 transition-transform ml-1 ${expanded === h.sym ? "rotate-180" : ""}`}
          />
        </div>
      ),
    },
    {
      key: "shares",
      label: "Shares",
      align: "right",
      mobile: true,
      accessor: (h) => h.shares,
      render: (h) => <span className="font-mono2 t2">{h.shares}</span>,
    },
    {
      key: "avg",
      label: "Avg cost",
      align: "right",
      mobile: true,
      accessor: (h) => h.avg,
      render: (h) => <span className="font-mono2 t2">{fmt.money(h.avg)}</span>,
    },
    {
      key: "price",
      label: "Price",
      align: "right",
      accessor: (h) => h.price,
      render: (h) => (
        <div className="inline-flex flex-col items-end">
          <span className="font-mono2 font-semibold">{fmt.money(h.price)}</span>
          <span className={`text-[10.5px] font-mono2 ${h.dcp >= 0 ? "pos" : "neg"}`}>{fmt.pct(h.dcp, 2)}</span>
        </div>
      ),
    },
    {
      key: "value",
      label: "Market value",
      align: "right",
      accessor: (h) => h.shares * h.price,
      render: (h) => <span className="font-mono2 font-semibold">{fmt.money(h.shares * h.price)}</span>,
    },
    {
      key: "pnl",
      label: "Unrealized P&L",
      align: "right",
      mobile: true,
      accessor: (h) => holdingPL(h).pnl,
      render: (h) => {
        const { pnl, pnlPct } = holdingPL(h);
        return (
          <span className={`chip font-mono2`} style={{ background: pnl >= 0 ? "var(--pos-soft)" : "var(--neg-soft)", color: pnl >= 0 ? "var(--pos)" : "var(--neg)" }}>
            {pnl >= 0 ? "+" : "−"}{fmt.money0(Math.abs(pnl))} · {fmt.pct(pnlPct, 1)}
          </span>
        );
      },
    },
    {
      key: "spark",
      label: "6M",
      sortable: false,
      align: "right",
      mobile: true,
      render: (h) => (
        <div className="flex justify-end">
          <Sparkline data={h.spark.map((v) => ({ value: v }))} color={h.closes[13] >= h.closes[8] ? "var(--pos)" : "var(--neg)"} id={`hk-${h.sym}`} w={76} h={26} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <Stagger className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Portfolio value" value={stats.value} format={fmt.money0} icon={Briefcase} delta={stats.pnlPct} />
        <StatCard label="Invested capital" value={stats.cost} format={fmt.money0} icon={Coins} tint="var(--chart-2)" />
        <StatCard label="Total return" value={stats.pnl} format={(v) => fmt.signed(v)} icon={TrendingUp} tint="var(--pos)" />
        <StatCard label="Day change" value={stats.dayChange} format={(v) => fmt.signed(v)} icon={Activity} tint="var(--chart-2)" delta={stats.dayChangePct} />
      </Stagger>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* Performance chart */}
        <FadeIn className="xl:col-span-2">
          <Card
            title="Portfolio performance"
            subtitle="Aggregate market value of all holdings"
            action={<Segmented options={RANGE_OPTS} value={range} onChange={setRange} />}
          >
            <div className="flex items-baseline gap-2.5 mb-1">
              <span className="font-display font-bold text-xl font-mono2">{fmt.money0(stats.value)}</span>
              <span className="chip font-mono2" style={{ background: rangeReturn >= 0 ? "var(--pos-soft)" : "var(--neg-soft)", color: gainColor }}>
                {fmt.pct(rangeReturn, 1)} <span className="opacity-70">past {range}</span>
              </span>
            </div>
            <div className="h-[260px] sm:h-[300px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pfMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gainColor} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={gainColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis axisLine={false} tickLine={false} width={56} domain={["dataMin - 800", "auto"]} tickFormatter={(v) => fmt.compact(v)} />
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} cursor={{ stroke: "var(--border)" }} />
                  <Area type="monotone" dataKey="value" name="Value" stroke={gainColor} strokeWidth={2.2} fill="url(#pfMain)" animationDuration={700} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>

        {/* Allocation */}
        <FadeIn delay={0.08}>
          <Card title="Portfolio allocation" subtitle="By asset class" className="h-full">
            <div className="relative h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ChartTooltip formatter={(v) => fmt.money0(v)} />} />
                  <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                    {alloc.map((a, i) => (
                      <Cell key={a.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[9.5px] t3 uppercase tracking-[0.14em] font-bold">Total</p>
                  <p className="font-display font-bold text-lg font-mono2">{fmt.compact(stats.value)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 mt-3">
              {alloc.map((a, i) => (
                <div key={a.name} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-[4px] shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[13px] font-medium flex-1">{a.name}</span>
                  <span className="font-mono2 text-[12px] t2">{fmt.money0(a.value)}</span>
                  <span className="font-mono2 text-[12px] font-semibold w-12 text-right acc">{a.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Movers strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FadeIn>
          <div className="panel-flat rounded-2xl p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>
              <Trophy size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] t3 font-semibold uppercase tracking-[0.1em]">Best performer</p>
              <p className="text-sm font-semibold truncate">
                {best.sym} <span className="pos font-mono2 text-[12.5px]">{fmt.pct(holdingPL(best).pnlPct, 1)}</span>
              </p>
            </div>
            <span className="ml-auto font-mono2 text-xs t2">{fmt.money0(holdingPL(best).pnl)} unrealized</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.06}>
          <div className="panel-flat rounded-2xl p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
              <TriangleAlert size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] t3 font-semibold uppercase tracking-[0.1em]">Needs attention</p>
              <p className="text-sm font-semibold truncate">
                {worst.sym} <span className={`${holdingPL(worst).pnlPct >= 0 ? "pos" : "neg"} font-mono2 text-[12.5px]`}>{fmt.pct(holdingPL(worst).pnlPct, 1)}</span>
              </p>
            </div>
            <span className="ml-auto font-mono2 text-xs t2">{fmt.pct(holdingPL(worst).pnlPct, 1)} all-time</span>
          </div>
        </FadeIn>
      </div>

      {/* Holdings table */}
      <FadeIn>
        <Card title="Holdings" subtitle={`${holdings.length} positions · tap a row to expand`} pad={false}>
          <div className="px-1 sm:px-3 pb-4">
            <DataTable
              columns={columns}
              rows={holdings}
              rowKey="sym"
              pageSize={10}
              expandedKey={expanded}
              onRowClick={(h) => setExpanded((k) => (k === h.sym ? null : h.sym))}
              expandedRender={(h) => <HoldingDetail h={h} fmt={fmt} totalValue={stats.value} />}
            />
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

function HoldingDetail({ h, fmt, totalValue }) {
  const { value, cost, pnl, pnlPct } = holdingPL(h);
  const data = h.closes.slice(-10).map((v, i) => ({ i, value: v }));
  const stats2 = [
    ["Shares", h.shares],
    ["Avg cost", fmt.money(h.avg)],
    ["Cost basis", fmt.money0(cost)],
    ["Market value", fmt.money0(value)],
    ["Weight", `${((value / totalValue) * 100).toFixed(1)}%`],
    ["Day change", fmt.pct(h.dcp, 2)],
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-[10.5px] t3 font-semibold uppercase tracking-[0.12em] mb-2">Price · trailing 10 periods</p>
        <div className="h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`hd-${h.sym}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<ChartTooltip formatter={(v) => fmt.money(v)} />} cursor={{ stroke: "var(--border)" }} />
              <Area type="monotone" dataKey="value" name={h.sym} stroke="var(--accent)" strokeWidth={2} fill={`url(#hd-${h.sym})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="text-[10.5px] t3 font-semibold uppercase tracking-[0.12em] mb-2">Position detail</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {stats2.map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] t3 uppercase tracking-wider font-semibold">{k}</p>
              <p className="font-mono2 text-[13px] font-semibold mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 panel-inset rounded-xl px-3 py-2 inline-flex items-center gap-2">
          <span className="text-[11px] t3 font-semibold uppercase tracking-wider">Unrealized</span>
          <span className={`font-mono2 text-[13px] font-bold ${pnl >= 0 ? "pos" : "neg"}`}>
            {pnl >= 0 ? "+" : "−"}{fmt.money(Math.abs(pnl))} ({fmt.pct(pnlPct, 1)})
          </span>
        </div>
      </div>
    </div>
  );
}
