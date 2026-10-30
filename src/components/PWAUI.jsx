import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw, WifiOff, Wifi, Share, Plus, Smartphone } from "lucide-react";

// ---------------- Offline / back-online banner ----------------
export function ConnectionBanner({ online }) {
  const [showBack, setShowBack] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    if (online) {
      setShowBack(true);
      const t = setTimeout(() => setShowBack(false), 2600);
      return () => clearTimeout(t);
    }
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = !online || showBack;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed top-0 inset-x-0 z-[90] flex justify-center pointer-events-none px-3 pt-2"
        >
          <span
            className="chip !text-[11.5px] !py-1.5 !px-3.5 shadow-lg"
            style={{
              background: online ? "var(--pos-soft)" : "var(--neg-soft)",
              color: online ? "var(--pos)" : "var(--neg)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(14px)",
            }}
          >
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? "Back online — data synced" : "Offline — showing cached data"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------- Update available snackbar ----------------
export function UpdatePrompt({ show, onApply, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[95] w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="panel rounded-2xl p-3.5 flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <RefreshCw size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">Update available</p>
              <p className="text-[11px] t3">A new version of Finova is ready.</p>
            </div>
            <button className="btn btn-primary !min-h-[34px] !py-1.5 !px-3 text-xs shrink-0" onClick={onApply}>
              Reload
            </button>
            <button className="t3 shrink-0 p-1" onClick={onDismiss} aria-label="Dismiss update">
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------- Install app banner ----------------
export function InstallBanner({ show, isIOS, onInstall, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[92] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="panel rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span
                className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                <Smartphone size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold font-display">Install Finova</p>
                {isIOS ? (
                  <p className="text-[11.5px] t3 mt-1 leading-relaxed">
                    Tap <Share size={11} className="inline mx-0.5 -mt-0.5" /> <b>Share</b> then{" "}
                    <Plus size={11} className="inline mx-0.5 -mt-0.5" /> <b>Add to Home Screen</b> for the full-screen app.
                  </p>
                ) : (
                  <p className="text-[11.5px] t3 mt-0.5">
                    Full-screen, offline-ready, launches from your home screen.
                  </p>
                )}
              </div>
              <button className="t3 shrink-0 p-1 -mt-1" onClick={onDismiss} aria-label="Dismiss install">
                <X size={15} />
              </button>
            </div>
            {!isIOS && (
              <button className="btn btn-primary w-full mt-3" onClick={onInstall}>
                <Download size={15} /> Install app
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
