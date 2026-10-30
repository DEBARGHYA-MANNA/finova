import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Delete, LockKeyhole, Check, TrendingUp, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { initials } from "../lib/format";

const LETTERS = { 2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ" };

// Hoisted to module scope — an inner component would remount on every
// state change (clock tick, PIN entry) and replay its enter animation.
function KeyBtn({ digit, delay, disabled, onPush }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + delay * 0.02 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onPush(digit)}
      disabled={disabled}
      className="btn lock-key mx-auto rounded-full panel-inset !p-0 flex-col !gap-0 disabled:opacity-30 disabled:pointer-events-none"
      aria-label={`Digit ${digit}`}
    >
      <span className="font-mono2 lock-key-num font-semibold leading-none">{digit}</span>
      {LETTERS[digit] && (
        <span className="text-[7px] t3 font-bold tracking-[0.2em] mt-0.5 lock-hide-xs">{LETTERS[digit]}</span>
      )}
    </motion.button>
  );
}

export default function LockScreen() {
  const { settings, lockCfg, unlock, notify, isDemoPin, DEMO_PIN } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [ok, setOk] = useState(false);
  const [bio, setBio] = useState("idle"); // idle | scanning | ok
  const [fails, setFails] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [clock, setClock] = useState(new Date());

  // Biometric simulation only makes sense on touch devices (mobile / tablet)
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = (e) => setIsTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const bioAvailable = !!lockCfg.biometric && isTouch;

  // live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // freeze page scroll while locked (html is the scroll container)
  useEffect(() => {
    const de = document.documentElement;
    const scrollY = window.scrollY;
    de.classList.add("lock-open");
    return () => {
      de.classList.remove("lock-open");
      window.scrollTo(0, scrollY);
    };
  }, []);

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const check = (value) => {
    if (value === lockCfg.pin) {
      setOk(true);
      setTimeout(() => unlock(), 480);
    } else {
      const next = fails + 1;
      setError(true);
      setPin("");
      if (next >= 3) {
        setCooldown(8);
        setFails(0);
      } else {
        setFails(next);
      }
      setTimeout(() => setError(false), 500);
    }
  };

  const push = (d) => {
    if (ok || bio !== "idle" || cooldown > 0) return;
    setError(false);
    const next = (pin + String(d)).slice(0, 4);
    setPin(next);
    if (next.length === 4) setTimeout(() => check(next), 140);
  };

  const pop = () => {
    if (ok || bio !== "idle" || cooldown > 0) return;
    setPin((p) => p.slice(0, -1));
  };

  const scan = () => {
    if (bio !== "idle" || ok || cooldown > 0) return;
    setBio("scanning");
    setTimeout(() => {
      setBio("ok");
      setOk(true);
      setTimeout(() => unlock(), 480);
    }, 1500);
  };

  // hardware keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === "Backspace") pop();
      else if (e.key === "Escape") setPin("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[80]"
      style={{ background: "var(--bg)" }}
    >
      <div className="bg-art" />
      <div className="bg-noise" />

      <div className="lock-shell relative">
        {/* Brand — first to go on short screens */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 lock-hide-sm"
        >
          <span
            className="w-7 h-7 rounded-lg grid place-items-center"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            <TrendingUp size={15} strokeWidth={2.4} />
          </span>
          <span className="font-display font-bold text-[15px] tracking-tight">Finova</span>
        </motion.div>

        {/* Clock */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="text-center lock-hide-xs"
        >
          <p className="font-display font-bold lock-clock font-mono2 tracking-tight">
            {clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="t3 text-[11px] mt-1 font-medium">
            {clock.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="panel rounded-3xl lock-card"
        >
          {/* Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="lock-identity flex flex-col items-center">
              <div className="relative">
                <span
                  className="lock-avatar rounded-2xl grid place-items-center font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    color: "var(--accent-ink)",
                  }}
                >
                  {initials(settings.profile.name)}
                </span>
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full grid place-items-center border-2"
                  style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--accent)" }}
                >
                  <LockKeyhole size={10} />
                </span>
              </div>
              <p className="font-display font-semibold text-[14.5px] mt-2.5">{settings.profile.name}</p>
              <p className="t3 text-[11px] mt-0.5 lock-hide-xs">Enter your 4-digit PIN to resume</p>
            </div>

            {isDemoPin && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={() => {
                  if (ok || cooldown > 0) return;
                  setPin(DEMO_PIN);
                  setTimeout(() => check(DEMO_PIN), 260);
                }}
                className="chip mt-2"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                title="Tap to autofill"
              >
                <Sparkles size={11} /> Demo PIN{" "}
                <span className="font-mono2 font-bold tracking-[0.18em]">{DEMO_PIN}</span>
              </motion.button>
            )}
          </div>

          {/* PIN dots */}
          <motion.div
            animate={error ? { x: [0, -14, 14, -9, 9, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center justify-center gap-3.5 lock-dots"
          >
            {[0, 1, 2, 3].map((i) => {
              const filled = i < pin.length || ok;
              return (
                <span key={i} className="relative w-3 h-3">
                  <span className="absolute inset-0 rounded-full border-[1.5px]" style={{ borderColor: "var(--text-3)" }} />
                  <motion.span
                    initial={false}
                    animate={{ scale: filled ? 1 : 0.001 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: ok ? "var(--pos)" : "var(--accent)" }}
                  />
                </span>
              );
            })}
          </motion.div>

          {/* Status line */}
          <div className="h-5 text-center mb-1.5">
            <p
              className="text-[11px] font-medium transition-colors"
              style={{ color: ok ? "var(--pos)" : error ? "var(--neg)" : "var(--text-3)" }}
            >
              {ok
                ? "Vault unlocked"
                : cooldown > 0
                ? `Too many attempts — retry in ${cooldown}s`
                : error
                ? "Incorrect PIN, try again"
                : bio === "scanning"
                ? "Scanning fingerprint…"
                : "\u00a0"}
            </p>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 lock-grid place-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d, i) => (
              <KeyBtn key={d} digit={d} delay={i} disabled={cooldown > 0} onPush={push} />
            ))}

            {/* biometric — touch devices only */}
            {bioAvailable ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + 9 * 0.02 }}
                whileTap={{ scale: 0.92 }}
                onClick={scan}
                disabled={cooldown > 0}
                aria-label="Unlock with fingerprint"
                className="relative lock-key mx-auto rounded-full grid place-items-center disabled:opacity-30 disabled:pointer-events-none"
                style={{
                  background: bio === "idle" ? "var(--card-2)" : "transparent",
                  border: bio === "idle" ? "1px solid var(--border)" : "none",
                }}
              >
                {bio === "scanning" && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-[3px]"
                    style={{ borderColor: "transparent", borderTopColor: "var(--accent)" }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  />
                )}
                {bio === "ok" ? (
                  <Check size={22} style={{ color: "var(--pos)" }} />
                ) : (
                  <Fingerprint size={22} style={{ color: bio === "scanning" ? "var(--accent)" : "var(--text-2)" }} />
                )}
              </motion.button>
            ) : (
              <span />
            )}

            <KeyBtn digit={0} delay={10} disabled={cooldown > 0} onPush={push} />

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + 11 * 0.02 }}
              whileTap={{ scale: 0.92 }}
              onClick={pop}
              disabled={cooldown > 0}
              aria-label="Delete digit"
              className="lock-key mx-auto rounded-full grid place-items-center t2 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Delete size={20} />
            </motion.button>
          </div>

          {/* Footer hints */}
          <div
            className="flex items-center justify-between mt-4 pt-3 lock-hide-xs"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {bioAvailable ? (
              <button type="button" onClick={scan} className="text-[11px] font-semibold acc">
                Use fingerprint
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() =>
                notify(
                  isDemoPin
                    ? `Demo PIN is ${DEMO_PIN} — change it in Settings → Security`
                    : "Custom PIN set. Clear site data to restore the demo PIN.",
                  "warn"
                )
              }
              className="text-[11px] font-semibold t3"
            >
              Forgot PIN?
            </button>
          </div>
        </motion.div>

        <p className="t3 text-[10px] text-center max-w-[280px] lock-hide-sm">
          Auto-locks after {lockCfg.autoLockMinutes} min of inactivity
          {lockCfg.lockOnHide ? " and when the tab is hidden" : ""}.
        </p>
      </div>
    </motion.div>
  );
}
