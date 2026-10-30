import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ------------------------------------------------------------------
// Central PWA controller: SW registration, update flow, install prompt,
// connectivity, notification permission + local "push" dispatch.
// ------------------------------------------------------------------

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: window-controls-overlay)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

export function usePWA({ onNavigate } = {}) {
  const [registration, setRegistration] = useState(null);
  const [swReady, setSwReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [online, setOnline] = useState(navigator.onLine);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [lastSync, setLastSync] = useState(null);
  const waitingRef = useRef(null);

  const supported = "serviceWorker" in navigator;
  const notifySupported = typeof Notification !== "undefined" && "serviceWorker" in navigator;

  // ---------------- Register service worker ----------------
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
        if (cancelled) return;
        setRegistration(reg);
        setSwReady(true);

        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingRef.current = reg.waiting;
          setUpdateReady(true);
        }

        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              waitingRef.current = nw;
              setUpdateReady(true);
            }
          });
        });

        // hourly update check
        const t = setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        return () => clearInterval(t);
      } catch (e) {
        // SW unavailable (e.g. single-file hosting) — app still works
        setSwReady(false);
      }
    };

    register();

    const onMessage = (e) => {
      const d = e.data || {};
      if (d.type === "NAVIGATE" && onNavigate) onNavigate(d.page);
      if (d.type === "SYNC_COMPLETE") setLastSync(d.at);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [supported, onNavigate]);

  // ---------------- Install prompt ----------------
  useEffect(() => {
    const onBIP = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplay = (e) => setInstalled(e.matches);
    mq.addEventListener?.("change", onDisplay);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplay);
    };
  }, []);

  // ---------------- Connectivity ----------------
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // ---------------- Actions ----------------
  const promptInstall = useCallback(async () => {
    if (!installEvent) return { outcome: "unavailable" };
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallEvent(null);
    return choice;
  }, [installEvent]);

  const applyUpdate = useCallback(() => {
    const w = waitingRef.current || registration?.waiting;
    if (w) {
      w.postMessage({ type: "SKIP_WAITING" });
      setUpdateReady(false);
    } else {
      window.location.reload();
    }
  }, [registration]);

  const checkForUpdate = useCallback(async () => {
    if (!registration) return false;
    try {
      await registration.update();
      return !!registration.waiting;
    } catch (e) {
      return false;
    }
  }, [registration]);

  const requestPermission = useCallback(async () => {
    if (!notifySupported) return "unsupported";
    const res = await Notification.requestPermission();
    setPermission(res);
    return res;
  }, [notifySupported]);

  // Local push dispatch — routed through the SW so it behaves like a
  // real push notification (actions, click routing, works backgrounded).
  const sendNotification = useCallback(
    async ({ title, body, tag, page }) => {
      if (typeof Notification === "undefined") return false;
      if (Notification.permission !== "granted") return false;
      const reg = registration || (await navigator.serviceWorker?.ready.catch(() => null));
      if (reg) {
        if (reg.active) {
          reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload: { title, body, tag, page } });
        } else {
          reg.showNotification(title, {
            body,
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png",
            tag,
            data: { page },
          });
        }
        return true;
      }
      new Notification(title, { body, icon: "./icons/icon-192.png" });
      return true;
    },
    [registration]
  );

  const requestSync = useCallback(async () => {
    try {
      const reg = registration || (await navigator.serviceWorker.ready);
      if ("sync" in reg) {
        await reg.sync.register("finova-sync");
        return true;
      }
    } catch (e) {
      /* noop */
    }
    setLastSync(Date.now());
    return false;
  }, [registration]);

  const clearCaches = useCallback(async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      return true;
    }
    return false;
  }, []);

  const estimateStorage = useCallback(async () => {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return { usage, quota };
    }
    return { usage: 0, quota: 0 };
  }, []);

  // Memoized so the object identity is stable across renders — consumers
  // (and the context bridge) would otherwise re-render infinitely.
  return useMemo(
    () => ({
      supported,
      notifySupported,
      swReady,
      registration,
      updateReady,
      applyUpdate,
      checkForUpdate,
      canInstall: !!installEvent,
      installed,
      isIOS: isIOS(),
      promptInstall,
      online,
      permission,
      requestPermission,
      sendNotification,
      requestSync,
      lastSync,
      clearCaches,
      estimateStorage,
    }),
    [
      supported,
      notifySupported,
      swReady,
      registration,
      updateReady,
      applyUpdate,
      checkForUpdate,
      installEvent,
      installed,
      promptInstall,
      online,
      permission,
      requestPermission,
      sendNotification,
      requestSync,
      lastSync,
      clearCaches,
      estimateStorage,
    ]
  );
}
