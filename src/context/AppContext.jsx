import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { THEMES, themeById } from "../lib/themes";
import { makeFmt } from "../lib/format";
import { useLocalStorage } from "../hooks/useLocalStorage";

const AppCtx = createContext(null);

// Ships armed: the vault is locked on every fresh load with a demo PIN.
// Setting a new PIN in Settings → Security replaces it permanently.
export const DEMO_PIN = "1234";

const DEFAULT_SETTINGS = {
  profile: { name: "Debarghya Manna", email: "debarghya@finova.io", currency: "INR", goal: 40000 },
  notifications: { weekly: true, largeTx: true, priceAlerts: false, billReminders: true },
  reduceMotion: false,
  lock: { enabled: true, pin: DEMO_PIN, autoLockMinutes: 3, biometric: true, lockOnHide: true },
};

export function AppProvider({ children }) {
  const [themeId, setThemeId] = useLocalStorage("finova-theme", "obsidian");
  const [settings, setSettings, resetSettings] = useLocalStorage("finova-settings-v3", DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const [locked, setLocked] = useState(() => !!(settings.lock?.enabled && settings.lock?.pin));
  const [pwa, setPwa] = useState(null);

  const theme = themeById(themeId);

  // Apply CSS variables to :root whenever the theme changes
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", theme.id);
    root.setAttribute("data-scheme", theme.scheme);
    root.style.colorScheme = theme.scheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.vars["--bg"]);
    document.body.style.background = theme.vars["--bg"];
  }, [theme]);

  const notify = useCallback((msg, kind = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const updateSettings = useCallback(
    (patch) => setSettings((s) => ({ ...s, ...patch })),
    [setSettings]
  );

  const fmt = useMemo(() => makeFmt(settings.profile.currency), [settings.profile.currency]);

  const lockCfg = useMemo(
    () => ({ ...DEFAULT_SETTINGS.lock, ...(settings.lock || {}) }),
    [settings.lock]
  );

  const lockNow = useCallback(() => {
    setLocked((was) => {
      if (was) return was;
      return lockCfg.enabled && lockCfg.pin ? true : was;
    });
  }, [lockCfg.enabled, lockCfg.pin]);

  const unlock = useCallback(() => setLocked(false), []);

  const value = useMemo(
    () => ({
      theme,
      themeId,
      setTheme: (id) => {
        setThemeId(id);
      },
      settings,
      updateSettings,
      resetSettings,
      fmt,
      notify,
      toasts,
      reduceMotion: !!settings.reduceMotion,
      locked,
      lockNow,
      unlock,
      lockCfg,
      isDemoPin: lockCfg.pin === DEMO_PIN,
      DEMO_PIN,
      pwa,
      setPwa,
    }),
    [theme, themeId, setThemeId, settings, updateSettings, resetSettings, fmt, notify, toasts, locked, lockNow, unlock, lockCfg, pwa]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
