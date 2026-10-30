import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  UtensilsCrossed, ShoppingBag, CarFront, Building2, PlugZap, Clapperboard, Repeat,
  HeartPulse, Plane, GraduationCap, TrendingUp, Banknote, Landmark, PiggyBank,
  CreditCard, Briefcase, ArrowUpRight, ArrowDownRight, Search, HandCoins,
} from "lucide-react";
import { CATEGORY_META } from "../data/finance";

// ---------------- Icon registry ----------------
const ICONS = {
  UtensilsCrossed, ShoppingBag, CarFront, Building2, PlugZap, Clapperboard, Repeat,
  HeartPulse, Plane, GraduationCap, TrendingUp, Banknote, Landmark, PiggyBank,
  CreditCard, Briefcase, HandCoins,
};
export const CategoryIcon = ({ category, size = 15, ...rest }) => {
  const Cmp = ICONS[CATEGORY_META[category]?.icon] || Landmark;
  return <Cmp size={size} strokeWidth={1.9} {...rest} />;
};

// ---------------- Motion helpers ----------------
export const FadeIn = ({ children, delay = 0, y = 14, className = "", once = true }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const Stagger = ({ children, className = "", gap = 0.06 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <div ref={ref} className={className}>
      {inView &&
        React.Children.map(children, (c, i) => (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * gap, ease: [0.22, 1, 0.36, 1] }}
          >
            {c}
          </motion.div>
        ))}
    </div>
  );
};

// ---------------- Animated number ----------------
export function NumberTicker({ value = 0, format = (v) => Math.round(v).toLocaleString(), duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * eased;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="font-mono2">{format(display)}</span>;
}

// ---------------- Card ----------------
export const Card = ({ title, subtitle, action, children, className = "", pad = true }) => (
  <div className={`panel rounded-2xl ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
        <div className="min-w-0">
          {title && <h3 className="font-display font-semibold text-[15px] truncate">{title}</h3>}
          {subtitle && <p className="t3 text-xs mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={pad ? "p-5 pt-3" : ""}>{children}</div>
  </div>
);

// ---------------- Stat card ----------------
export function StatCard({ label, value, format, delta, deltaInvert = false, spark, icon: Icon, tint = "var(--accent)" }) {
  const good = deltaInvert ? delta <= 0 : delta >= 0;
  return (
    <div className="panel rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
        style={{ background: tint }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="t3 text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
        {Icon && (
          <span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--accent-soft)", color: tint }}>
            <Icon size={14} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-tight">
        <NumberTicker value={value} format={format} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {delta != null ? (
          <span className="chip" style={{ background: good ? "var(--pos-soft)" : "var(--neg-soft)", color: good ? "var(--pos)" : "var(--neg)" }}>
            {good ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(delta).toFixed(1)}%
            <span className="t3 font-medium hidden sm:inline">vs last month</span>
          </span>
        ) : (
          <span />
        )}
        {spark}
      </div>
    </div>
  );
}

// ---------------- Badges ----------------
const STATUS_STYLE = {
  completed: { bg: "var(--pos-soft)", fg: "var(--pos)" },
  pending: { bg: "var(--warn-soft)", fg: "var(--warn)" },
  failed: { bg: "var(--neg-soft)", fg: "var(--neg)" },
};
export const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.completed;
  return (
    <span className="chip capitalize" style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.fg }} />
      {status}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1.5 t2 text-[12.5px]">
      <span className="w-6 h-6 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--accent-soft)", color: meta?.color || "var(--accent)" }}>
        <CategoryIcon category={category} size={13} />
      </span>
      <span className="truncate">{category}</span>
    </span>
  );
};

export const TypeBadge = ({ type }) => (
  <span
    className="chip"
    style={{
      background: type === "Stock" ? "var(--accent-soft)" : type === "ETF" ? "var(--pos-soft)" : "var(--warn-soft)",
      color: type === "Stock" ? "var(--accent)" : type === "ETF" ? "var(--pos)" : "var(--warn)",
    }}
  >
    {type}
  </span>
);

// ---------------- Segmented control ----------------
export const Segmented = ({ options, value, onChange, className = "" }) => (
  <div className={`seg ${className}`}>
    {options.map((o) => (
      <button key={o.id} type="button" className={value === o.id ? "on" : ""} onClick={() => onChange(o.id)}>
        {o.label}
      </button>
    ))}
  </div>
);

// ---------------- Switch ----------------
export const Switch = ({ checked, onChange, label, desc }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 py-3 text-left"
  >
    {(label || desc) && (
      <span className="min-w-0">
        {label && <span className="block text-sm font-medium">{label}</span>}
        {desc && <span className="block text-xs t3 mt-0.5">{desc}</span>}
      </span>
    )}
    <span
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? "" : ""}`}
      style={{ background: checked ? "var(--accent)" : "var(--border)" }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </span>
  </button>
);

// ---------------- Search input ----------------
export const SearchInput = ({ value, onChange, placeholder = "Search…", className = "" }) => (
  <div className={`relative ${className}`}>
    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 t3 pointer-events-none" />
    <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// ---------------- Empty state ----------------
export const EmptyState = ({ icon: Icon = Search, title = "Nothing here", desc }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <span className="w-12 h-12 rounded-2xl grid place-items-center mb-3" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
      <Icon size={20} />
    </span>
    <p className="font-semibold text-sm">{title}</p>
    {desc && <p className="t3 text-xs mt-1 max-w-[240px]">{desc}</p>}
  </div>
);

// ---------------- Progress bar ----------------
export const Meter = ({ pct, color = "var(--accent)", height = 6 }) => (
  <div className="w-full rounded-full overflow-hidden" style={{ background: "var(--card-2)", border: "1px solid var(--border)", height }}>
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${Math.min(100, pct)}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="h-full rounded-full"
      style={{ background: color }}
    />
  </div>
);
