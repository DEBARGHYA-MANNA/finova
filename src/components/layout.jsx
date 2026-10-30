import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, ArrowLeftRight, PieChart, BarChart3, Settings as SettingsIcon,
  TrendingUp, Check, ChevronDown, ShieldCheck, CreditCard,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { THEMES } from "../lib/themes";
import { initials } from "../lib/format";
import { totalBalance, accounts } from "../data/finance";

export const NAV = [
  { id: "dashboard", label: "Overview", short: "Home", icon: LayoutGrid },
  { id: "transactions", label: "Transactions", short: "History", icon: ArrowLeftRight },
  { id: "investments", label: "Investments", short: "Invest", icon: PieChart },
  { id: "credit", label: "Credit & Loans", short: "Credit", icon: CreditCard },
  { id: "analytics", label: "Analytics", short: "Stats", icon: BarChart3 },
  { id: "settings", label: "Settings", short: "Settings", icon: SettingsIcon },
];

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span
      className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
      style={{ background: "var(--accent)", color: "var(--accent-ink)", boxShadow: "0 8px 20px -8px var(--accent)" }}
    >
      <TrendingUp size={18} strokeWidth={2.4} />
    </span>
    <div className="leading-none">
      <span className="font-display font-bold text-[17px] tracking-tight">Finova</span>
      <span className="block text-[9.5px] t3 font-semibold uppercase tracking-[0.16em] mt-1">Wealth OS</span>
    </div>
  </div>
);

// ---------------- Desktop Sidebar ----------------
export function Sidebar({ page, setPage }) {
  const { fmt } = useApp();
  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[256px] z-40 border-r"
      style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
    >
      <div className="px-5 pt-6 pb-2">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] t3">Manage</p>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors"
              style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <item.icon size={17} strokeWidth={2} className="relative z-10" style={active ? { color: "var(--accent)" } : {}} />
              <span className="relative z-10">{item.label}</span>
              {active && <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-3">
        <div className="panel-inset rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] t3 relative">Net balance</p>
          <p className="font-display font-bold text-xl mt-1 relative font-mono2">{fmt.money(totalBalance)}</p>
          <p className="text-[11px] t3 mt-1 relative flex items-center gap-1">
            <ShieldCheck size={12} className="pos" /> {accounts.length} linked accounts
          </p>
        </div>
        <p className="text-[10px] t3 text-center">Finova demo · data simulated locally</p>
      </div>
    </aside>
  );
}

// ---------------- Mobile bottom navigation ----------------
export function BottomNav({ page, setPage }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t safe-bottom"
      style={{
        background: "color-mix(in srgb, var(--sidebar) 88%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div className="grid max-w-lg mx-auto" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className="relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[58px]"
              style={{ color: active ? "var(--accent)" : "var(--text-3)" }}
              aria-label={item.label}
            >
              {active && (
                <motion.span
                  layoutId="bnav-pill"
                  className="absolute top-0 w-9 h-[3px] rounded-b-full"
                  style={{ background: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <item.icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9.5px] font-semibold tracking-tight">{item.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------- Theme picker (dropdown) ----------------
function ThemeMenu() {
  const { themeId, setTheme, notify } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = THEMES.find((t) => t.id === themeId);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost !py-2 !px-3 !min-h-[40px]"
        aria-label="Switch theme"
      >
        <span className="flex -space-x-1.5">
          {current.swatch.map((c) => (
            <span key={c} className="w-3.5 h-3.5 rounded-full border" style={{ background: c, borderColor: "var(--card)" }} />
          ))}
        </span>
        <span className="hidden sm:inline text-xs font-semibold">{current.name}</span>
        <ChevronDown size={13} className="t3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-60 panel rounded-2xl p-1.5 z-50"
          >
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] t3">Appearance</p>
            {THEMES.map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                    notify(`Theme switched to ${t.name}`);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-[var(--accent-soft)]"
                >
                  <span className="flex -space-x-1.5">
                    {t.swatch.map((c) => (
                      <span key={c} className="w-4 h-4 rounded-full border" style={{ background: c, borderColor: "var(--card)" }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold truncate">{t.name}</span>
                    <span className="block text-[11px] t3 truncate">{t.tagline}</span>
                  </span>
                  {active && <Check size={15} className="acc shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Topbar ----------------
export function Topbar({ title, subtitle }) {
  const { settings } = useApp();
  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: "color-mix(in srgb, var(--bg) 78%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-[64px] max-w-[1440px] mx-auto w-full">
        <div className="flex items-center gap-3 min-w-0">
          <span className="lg:hidden"><Logo /></span>
          <div className="min-w-0 hidden lg:block">
            <h1 className="font-display font-bold text-[17px] tracking-tight truncate">{title}</h1>
            {subtitle && <p className="t3 text-xs truncate">{subtitle}</p>}
          </div>
          <h1 className="lg:hidden font-display font-bold text-[15px] tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeMenu />
          <div
            className="w-10 h-10 rounded-xl grid place-items-center font-bold text-sm select-none"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "var(--accent-ink)" }}
            title={settings.profile.name}
          >
            {initials(settings.profile.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
