import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import { useApp } from "./context/AppContext";
import { Sidebar, BottomNav, Topbar, NAV } from "./components/layout";
import LockScreen from "./components/LockScreen";
import { usePWA } from "./pwa/usePWA";
import { ConnectionBanner, UpdatePrompt, InstallBanner } from "./components/PWAUI";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Investments from "./pages/Investments";
import Credit from "./pages/Credit";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const PAGES = {
  dashboard: { title: "Overview", subtitle: "Balances, cash flow and wealth at a glance" },
  transactions: { title: "Transactions", subtitle: "Every inflow and outflow, searchable" },
  investments: { title: "My Investments", subtitle: "Stocks, ETFs and funds in one view" },
  credit: { title: "Credit & Loans", subtitle: "Cards, EMIs and borrowing health" },
  analytics: { title: "Analytics", subtitle: "Deep-dive into spending behavior" },
  settings: { title: "Settings", subtitle: "Personalize Finova to your taste" },
};

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="panel rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-medium w-auto"
          >
            {t.kind === "ok" ? <CheckCircle2 size={15} className="acc shrink-0" /> : <Info size={15} className="acc shrink-0" />}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const VALID_PAGES = ["dashboard", "transactions", "investments", "credit", "analytics", "settings"];

export default function App() {
  // Deep-link support: manifest shortcuts & notification clicks (?page=…)
  const [page, setPage] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("page");
    return VALID_PAGES.includes(p) ? p : "dashboard";
  });
  const { reduceMotion, locked, lockCfg, lockNow, setPwa, notify } = useApp();

  const handleNavigate = useCallback((p) => {
    if (VALID_PAGES.includes(p)) setPage(p);
  }, []);

  const pwa = usePWA({ onNavigate: handleNavigate });
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => sessionStorage.getItem("finova-install-dismissed") === "1"
  );
  const [showInstall, setShowInstall] = useState(false);

  // Share the PWA controller with the rest of the app (Settings panel)
  useEffect(() => {
    setPwa(pwa);
  }, [pwa, setPwa]);

  // Surface the install banner a moment after unlock, once per session
  useEffect(() => {
    if (locked || installDismissed || pwa.installed) return;
    if (!pwa.canInstall && !pwa.isIOS) return;
    const t = setTimeout(() => setShowInstall(true), 6000);
    return () => clearTimeout(t);
  }, [locked, installDismissed, pwa.installed, pwa.canInstall, pwa.isIOS]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  // ---- App lock: inactivity timer + lock-on-tab-hidden ----
  useEffect(() => {
    if (!lockCfg.enabled || !lockCfg.pin || locked) return;
    const ms = lockCfg.autoLockMinutes * 60000;
    let timer = setTimeout(lockNow, ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(lockNow, ms);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    const onVis = () => {
      if (document.hidden && lockCfg.lockOnHide) {
        clearTimeout(timer);
        lockNow();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lockCfg.enabled, lockCfg.pin, lockCfg.autoLockMinutes, lockCfg.lockOnHide, locked, lockNow]);

  const showLock = locked && lockCfg.enabled && !!lockCfg.pin;
  const meta = PAGES[page];

  return (
    <div className="surface min-h-screen">
      <div className="bg-art" />
      <div className="bg-noise" />

      <Sidebar page={page} setPage={setPage} />

      <div className="relative z-10 lg:pl-[256px] flex flex-col min-h-screen">
        <Topbar title={meta.title} subtitle={meta.subtitle} />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-28 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {page === "dashboard" && <Dashboard setPage={setPage} />}
              {page === "transactions" && <Transactions />}
              {page === "investments" && <Investments />}
              {page === "credit" && <Credit setPage={setPage} />}
              {page === "analytics" && <Analytics />}
              {page === "settings" && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden lg:block border-t py-5" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between">
            <p className="t3 text-[11px]">
              Finova · Wealth OS — Kolkata, WB, India · INR-first demo data, fully client-side
            </p>
            <p className="t3 text-[11px] font-mono2">React · Recharts · Framer Motion · React Hook Form</p>
          </div>
        </footer>
      </div>

      <BottomNav page={page} setPage={setPage} />
      <Toasts />

      {/* ---- PWA surfaces ---- */}
      <ConnectionBanner online={pwa.online} />
      <UpdatePrompt
        show={pwa.updateReady && !updateDismissed && !showLock}
        onApply={pwa.applyUpdate}
        onDismiss={() => setUpdateDismissed(true)}
      />
      <InstallBanner
        show={showInstall && !showLock && !pwa.installed}
        isIOS={pwa.isIOS && !pwa.canInstall}
        onInstall={async () => {
          const res = await pwa.promptInstall();
          setShowInstall(false);
          if (res?.outcome === "accepted") notify("Finova installed to your home screen");
        }}
        onDismiss={() => {
          setShowInstall(false);
          setInstallDismissed(true);
          sessionStorage.setItem("finova-install-dismissed", "1");
        }}
      />

      <AnimatePresence>{showLock && <LockScreen key="lock" />}</AnimatePresence>
    </div>
  );
}
