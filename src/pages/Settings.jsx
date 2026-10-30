import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { UserRound, Mail, Coins, Target, Check, Download, RotateCcw, CheckCheck, LockKeyhole, TimerReset, KeyRound, ShieldCheck, Smartphone, BellRing, CloudDownload, Trash2, RefreshCw, Wifi, WifiOff, Share } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, Switch, FadeIn, Segmented } from "../components/ui";
import { THEMES } from "../lib/themes";
import { initials } from "../lib/format";
import { transactions } from "../data/finance";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

const NOTIFS = [
  { key: "weekly", label: "Weekly digest", desc: "A Monday-morning summary of balances, cash flow and movers." },
  { key: "largeTx", label: "Large transaction alerts", desc: "Notify when any transaction exceeds ₹25,000." },
  { key: "priceAlerts", label: "Portfolio price alerts", desc: "Flag holdings moving more than 5% in a day." },
  { key: "billReminders", label: "Bill reminders", desc: "Heads-up 2 days before recurring bills post." },
];

export default function Settings() {
  const { settings, updateSettings, resetSettings, themeId, setTheme, notify, lockCfg, lockNow, isDemoPin, DEMO_PIN, pwa } = useApp();
  const [pinA, setPinA] = useState("");
  const [pinB, setPinB] = useState("");
  const [changingPin, setChangingPin] = useState(false);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    if (pwa?.estimateStorage) pwa.estimateStorage().then(setStorage).catch(() => {});
  }, [pwa]);

  const kb = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  const enableNotifications = async () => {
    if (!pwa) return;
    const res = await pwa.requestPermission();
    if (res === "granted") {
      notify("Notifications enabled");
      pwa.sendNotification({
        title: "Finova notifications are on 🔔",
        body: "You'll get bill reminders, large-transaction alerts and weekly digests.",
        tag: "finova-welcome",
        page: "dashboard",
      });
    } else if (res === "denied") {
      notify("Notifications blocked in browser settings", "warn");
    }
  };

  const testNotification = async () => {
    if (!pwa) return;
    if (pwa.permission !== "granted") return enableNotifications();
    const samples = [
      { title: "Bill due tomorrow", body: "Netflix ₹499 will be debited from HDFC ••4521.", page: "credit", tag: "bill" },
      { title: "Large transaction alert", body: "₹7,480 spent at Croma — Acropolis Mall.", page: "transactions", tag: "largetx" },
      { title: "Portfolio mover", body: "TATAMOTORS is up 1.83% today. Portfolio +₹4,120.", page: "investments", tag: "price" },
      { title: "Weekly digest ready", body: "You saved 31% of income this week. Tap to review.", page: "analytics", tag: "digest" },
    ];
    const s = samples[Math.floor(Math.random() * samples.length)];
    const ok = await pwa.sendNotification(s);
    notify(ok ? "Notification sent" : "Could not send notification", ok ? "ok" : "warn");
  };

  const saveLock = (patch) => updateSettings({ lock: { ...lockCfg, ...patch } });

  const submitPin = () => {
    if (!/^\d{4}$/.test(pinA)) return notify("PIN must be exactly 4 digits", "warn");
    if (pinA !== pinB) return notify("PINs don't match — re-enter them", "warn");
    const wasArmed = lockCfg.enabled && lockCfg.pin;
    saveLock({ enabled: true, pin: pinA });
    setPinA(""); setPinB(""); setChangingPin(false);
    notify(wasArmed ? "PIN updated — it'll be required on next lock" : "App lock enabled — vault is armed");
  };

  const disableLock = () => {
    saveLock({ enabled: false, pin: null });
    setPinA(""); setPinB(""); setChangingPin(false);
    notify("App lock disabled");
  };

  const { register, handleSubmit, formState: { errors, isDirty }, reset, watch } = useForm({
    defaultValues: settings.profile,
  });
  const watchedName = watch("name");

  const onProfile = (data) => {
    updateSettings({ profile: data });
    notify("Profile preferences saved");
    reset(data);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ transactions, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finova-transactions.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Ledger exported as JSON");
  };

  const field = "input";
  const err = (m) => <p className="text-[11px] font-medium mt-1" style={{ color: "var(--neg)" }}>{m}</p>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 items-start">
      {/* Appearance — theme gallery */}
      <FadeIn className="xl:col-span-3">
        <Card title="Appearance" subtitle="Every option restyles the entire product instantly — pick your vibe">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); notify(`Theme switched to ${t.name}`); }}
                  className="relative text-left rounded-2xl p-3 transition-transform active:scale-[0.98]"
                  style={{
                    background: "var(--card-2)",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    boxShadow: active ? "0 0 0 3px var(--accent-soft)" : "none",
                  }}
                >
                  {/* mini preview */}
                  <div className="rounded-xl overflow-hidden h-[84px] relative" style={{ background: t.swatch[2], border: "1px solid var(--border)" }}>
                    <div className="absolute inset-0" style={{ background: t.vars["--bg-grad"] }} />
                    <div className="absolute left-2.5 top-2.5 right-2.5 flex flex-col gap-1.5">
                      <div className="h-2 w-1/2 rounded-full" style={{ background: t.swatch[0], opacity: 0.9 }} />
                      <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.swatch[1], opacity: 0.6 }} />
                      <div className="flex gap-1.5 mt-1">
                        {[42, 26, 34].map((w, i) => (
                          <div key={i} className="h-5 rounded-md" style={{ width: w, background: i === 0 ? t.swatch[0] : i === 1 ? t.swatch[1] : "rgba(128,128,128,.35)", opacity: 0.85 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 px-0.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{t.name}</p>
                      <p className="text-[10.5px] t3 truncate">{t.tagline}</p>
                    </div>
                    <span className="flex -space-x-1 shrink-0">
                      {t.swatch.map((c) => (
                        <span key={c} className="w-3.5 h-3.5 rounded-full border" style={{ background: c, borderColor: "var(--card)" }} />
                      ))}
                    </span>
                  </div>
                  {active && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full grid place-items-center" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-1 divide-y-custom">
            <Switch
              label="Reduce motion"
              desc="Minimize animation across pages and transitions."
              checked={!!settings.reduceMotion}
              onChange={(v) => { updateSettings({ reduceMotion: v }); notify(v ? "Motion reduced" : "Full motion enabled"); }}
            />
          </div>
        </Card>
      </FadeIn>

      {/* Profile + notifications + data */}
      <div className="xl:col-span-2 space-y-4 sm:space-y-5">
        <FadeIn delay={0.05}>
          <Card title="Profile" subtitle="Saved locally in your browser">
            <form onSubmit={handleSubmit(onProfile)} className="space-y-3.5">
              <div className="flex items-center gap-3 pb-1">
                <span
                  className="w-12 h-12 rounded-2xl grid place-items-center font-bold text-base"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "var(--accent-ink)" }}
                >
                  {initials(watchedName || settings.profile.name)}
                </span>
                <div>
                  <p className="font-semibold text-sm">{watchedName || settings.profile.name}</p>
                  <p className="text-[11px] t3">Kolkata, WB · Member since 2023 · Demo plan</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <UserRound size={11} /> Full name
                </label>
                <input
                  className={field}
                  placeholder="Your name"
                  {...register("name", { required: "Name is required", minLength: { value: 2, message: "At least 2 characters" } })}
                />
                {errors.name && err(errors.name.message)}
              </div>

              <div>
                <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Mail size={11} /> Email
                </label>
                <input
                  className={field}
                  placeholder="you@email.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
                  })}
                />
                {errors.email && err(errors.email.message)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Coins size={11} /> Currency
                  </label>
                  <select className={field} {...register("currency")}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Target size={11} /> Savings goal / mo
                  </label>
                  <input
                    type="number"
                    className={field}
                    {...register("goal", { valueAsNumber: true, min: { value: 0, message: "Must be ≥ 0" } })}
                  />
                  {errors.goal && err(errors.goal.message)}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full">
                <CheckCheck size={15} /> {isDirty ? "Save changes" : "Save profile"}
              </button>
            </form>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card title="Notifications" subtitle="Stored as preferences — no server required">
            <div className="divide-y-custom">
              {NOTIFS.map((n) => (
                <Switch
                  key={n.key}
                  label={n.label}
                  desc={n.desc}
                  checked={!!settings.notifications[n.key]}
                  onChange={async (v) => {
                    updateSettings({ notifications: { ...settings.notifications, [n.key]: v } });
                    notify(`${n.label} ${v ? "enabled" : "muted"}`);
                    // Turning one on with permission granted → confirm on-device
                    if (v && pwa?.permission === "granted") {
                      pwa.sendNotification({
                        title: `${n.label} on`,
                        body: n.desc,
                        tag: `pref-${n.key}`,
                        page: "settings",
                      });
                    }
                  }}
                />
              ))}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Card title="Security" subtitle="PIN lock, biometric simulation & auto-lock">
            {!lockCfg.enabled ? (
              <div>
                <div className="flex items-center gap-3 panel-inset rounded-2xl p-3.5 mb-4">
                  <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                    <LockKeyhole size={17} />
                  </span>
                  <p className="text-[12px] t2 leading-relaxed">
                    Finova is currently <span className="font-semibold" style={{ color: "var(--warn)" }}>unlocked</span>.
                    Set a 4-digit PIN to lock the vault on launch, after inactivity, and when the tab is hidden.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <KeyRound size={11} /> New PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      className="input text-center tracking-[0.5em] font-mono2"
                      value={pinA}
                      onChange={(e) => setPinA(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] t3 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <KeyRound size={11} /> Confirm PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      className="input text-center tracking-[0.5em] font-mono2"
                      value={pinB}
                      onChange={(e) => setPinB(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>
                </div>
                <button className="btn btn-primary w-full" onClick={submitPin}>
                  <ShieldCheck size={15} /> Enable app lock
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 panel-inset rounded-2xl p-3.5 mb-2">
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                    style={{ background: isDemoPin ? "var(--warn-soft)" : "var(--pos-soft)", color: isDemoPin ? "var(--warn)" : "var(--pos)" }}
                  >
                    <ShieldCheck size={17} />
                  </span>
                  <p className="text-[12px] t2 leading-relaxed flex-1">
                    {isDemoPin ? (
                      <>
                        Using the <span className="font-semibold" style={{ color: "var(--warn)" }}>demo PIN</span>{" "}
                        <span className="font-mono2 font-bold tracking-[0.15em]">{DEMO_PIN}</span> — set your own below.
                      </>
                    ) : (
                      <>
                        Vault is <span className="font-semibold pos">protected</span> with your PIN
                        {lockCfg.biometric ? " + fingerprint" : ""}.
                      </>
                    )}
                  </p>
                  <button
                    className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-xs shrink-0"
                    onClick={() => { notify("Vault locked — enter your PIN to resume"); lockNow(); }}
                  >
                    Lock now
                  </button>
                </div>

                <div className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="text-sm font-medium flex items-center gap-1.5"><TimerReset size={14} className="t3" /> Auto-lock after</span>
                      <span className="block text-xs t3 mt-0.5">Idle timer resets on any interaction.</span>
                    </span>
                    <Segmented
                      options={[{ id: 1, label: "1 min" }, { id: 3, label: "3 min" }, { id: 5, label: "5 min" }]}
                      value={lockCfg.autoLockMinutes}
                      onChange={(v) => { saveLock({ autoLockMinutes: v }); notify(`Auto-lock set to ${v} min`); }}
                    />
                  </div>
                </div>

                <div className="divide-y-custom">
                  <Switch
                    label="Biometric unlock"
                    desc="Simulated fingerprint scan — appears on mobile & tablet lock screens."
                    checked={!!lockCfg.biometric}
                    onChange={(v) => { saveLock({ biometric: v }); notify(v ? "Fingerprint unlock on (touch devices)" : "Fingerprint unlock off"); }}
                  />
                  <Switch
                    label="Lock when tab is hidden"
                    desc="Banking-style: vault locks the moment you switch away."
                    checked={!!lockCfg.lockOnHide}
                    onChange={(v) => { saveLock({ lockOnHide: v }); notify(v ? "Locks on tab switch" : "Stays open when tab hidden"); }}
                  />
                </div>

                {changingPin ? (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="password" inputMode="numeric" maxLength={4} placeholder="New PIN"
                        className="input text-center tracking-[0.4em] font-mono2"
                        value={pinA}
                        onChange={(e) => setPinA(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                      <input
                        type="password" inputMode="numeric" maxLength={4} placeholder="Confirm"
                        className="input text-center tracking-[0.4em] font-mono2"
                        value={pinB}
                        onChange={(e) => setPinB(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-primary flex-1" onClick={submitPin}><Check size={14} /> Update PIN</button>
                      <button className="btn btn-ghost" onClick={() => { setChangingPin(false); setPinA(""); setPinB(""); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <button className={`btn flex-1 ${isDemoPin ? "btn-primary" : "btn-ghost"}`} onClick={() => setChangingPin(true)}>
                      <KeyRound size={13} /> {isDemoPin ? "Set your own PIN" : "Change PIN"}
                    </button>
                    <button className="btn btn-ghost flex-1" onClick={disableLock}>
                      <LockKeyhole size={13} /> Disable lock
                    </button>
                  </div>
                )}
                <p className="text-[10.5px] t3 mt-3 leading-relaxed">
                  Demo-grade security: the PIN is stored in LocalStorage on this device and the fingerprint scan is simulated.
                </p>
              </div>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.14}>
          <Card title="App & offline" subtitle="Install Finova, manage cache and notifications">
            {/* status strip */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                {
                  k: "Mode",
                  v: pwa?.installed ? "Installed" : "Browser",
                  tone: pwa?.installed ? "var(--pos)" : "var(--text-2)",
                  Icon: Smartphone,
                },
                {
                  k: "Network",
                  v: pwa?.online === false ? "Offline" : "Online",
                  tone: pwa?.online === false ? "var(--neg)" : "var(--pos)",
                  Icon: pwa?.online === false ? WifiOff : Wifi,
                },
                {
                  k: "Offline cache",
                  v: pwa?.swReady ? "Ready" : "Off",
                  tone: pwa?.swReady ? "var(--pos)" : "var(--warn)",
                  Icon: CloudDownload,
                },
              ].map(({ k, v, tone, Icon }) => (
                <div key={k} className="panel-inset rounded-xl py-2.5 px-2 text-center">
                  <Icon size={14} className="mx-auto mb-1" style={{ color: tone }} />
                  <p className="text-[9px] t3 uppercase tracking-[0.1em] font-bold">{k}</p>
                  <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: tone }}>{v}</p>
                </div>
              ))}
            </div>

            {/* install */}
            {pwa?.installed ? (
              <div className="flex items-center gap-3 panel-inset rounded-2xl p-3.5 mb-3">
                <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>
                  <CheckCheck size={17} />
                </span>
                <p className="text-[12px] t2 leading-relaxed">
                  Running as an installed app — full screen, offline-ready and launchable from your home screen.
                </p>
              </div>
            ) : pwa?.canInstall ? (
              <button className="btn btn-primary w-full mb-3" onClick={async () => {
                const r = await pwa.promptInstall();
                if (r?.outcome === "accepted") notify("Finova installed");
              }}>
                <Download size={15} /> Install Finova on this device
              </button>
            ) : (
              <div className="panel-inset rounded-2xl p-3.5 mb-3">
                <p className="text-[12px] t2 leading-relaxed">
                  {pwa?.isIOS ? (
                    <>Tap <Share size={11} className="inline mx-0.5 -mt-0.5" /> <b>Share</b> → <b>Add to Home Screen</b> to install Finova on iOS.</>
                  ) : (
                    <>Install from your browser menu (⋮ → <b>Install app</b>) to get the full-screen experience.</>
                  )}
                </p>
              </div>
            )}

            {/* notifications permission */}
            <div className="divide-y-custom">
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="text-sm font-medium flex items-center gap-1.5"><BellRing size={14} className="t3" /> Push notifications</span>
                  <span className="block text-xs t3 mt-0.5">
                    {pwa?.permission === "granted"
                      ? "Allowed — alerts delivered via service worker."
                      : pwa?.permission === "denied"
                      ? "Blocked. Re-enable in browser site settings."
                      : "Allow Finova to send alerts to this device."}
                  </span>
                </span>
                {pwa?.permission === "granted" ? (
                  <button className="btn btn-ghost !min-h-[34px] !py-1.5 !px-3 text-xs shrink-0" onClick={testNotification}>
                    Send test
                  </button>
                ) : (
                  <button className="btn btn-primary !min-h-[34px] !py-1.5 !px-3 text-xs shrink-0" onClick={enableNotifications}>
                    Enable
                  </button>
                )}
              </div>
            </div>

            {/* cache + update */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <button
                className="btn btn-ghost flex-1"
                onClick={async () => {
                  const has = await pwa?.checkForUpdate();
                  notify(has ? "Update found — reload to apply" : "You're on the latest version");
                }}
              >
                <RefreshCw size={14} /> Check for updates
              </button>
              <button
                className="btn btn-ghost flex-1"
                onClick={async () => {
                  await pwa?.clearCaches();
                  if (pwa?.estimateStorage) setStorage(await pwa.estimateStorage());
                  notify("Offline cache cleared");
                }}
              >
                <Trash2 size={14} /> Clear cache
              </button>
            </div>
            {storage?.usage > 0 && (
              <p className="text-[10.5px] t3 mt-3">
                Using <span className="font-mono2 t2 font-semibold">{kb(storage.usage)}</span>
                {storage.quota > 0 && <> of <span className="font-mono2">{kb(storage.quota)}</span> available</>} on this device.
              </p>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.18}>
          <Card title="Data & privacy" subtitle="Everything lives in your browser">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button className="btn btn-ghost flex-1" onClick={exportData}>
                <Download size={14} /> Export ledger (JSON)
              </button>
              <button
                className="btn btn-ghost flex-1"
                onClick={() => { resetSettings(); notify("Preferences reset to defaults"); setTimeout(() => window.location.reload(), 600); }}
              >
                <RotateCcw size={14} /> Reset preferences
              </button>
            </div>
            <p className="text-[11px] t3 mt-3 leading-relaxed">
              Finova is a front-end demo: transactions, NSE holdings and analytics are generated locally in ₹. Your
              theme and settings persist via LocalStorage until you reset them.
            </p>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
