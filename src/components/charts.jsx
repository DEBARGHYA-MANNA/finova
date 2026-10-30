import React from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

// Themed chart tooltip — reads live CSS variables so it re-themes instantly
export const ChartTooltip = ({ active, payload, label, formatter, labelKey = "name" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{ background: "var(--tooltip)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
    >
      {label != null && (
        <div className="t3 font-semibold mb-1 font-mono2 text-[10.5px] uppercase tracking-wider">{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-5 py-0.5">
          <span className="flex items-center gap-1.5 t2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.payload?.fill || "var(--accent)" }} />
            {p.name}
          </span>
          <span className="font-mono2 font-semibold" style={{ color: "var(--text-1)" }}>
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom legend row
export const ChartLegend = ({ items }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
    {items.map((it) => (
      <span key={it.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium t2">
        <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: it.color }} />
        {it.name}
      </span>
    ))}
  </div>
);

// Mini sparkline (no axes) for stat cards / table cells
export const Sparkline = ({ data, color = "var(--accent)", w = 96, h = 32, id }) => {
  const gid = id || `sp-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{ width: w, height: h }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.6} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
