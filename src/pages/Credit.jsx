import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Gauge, CreditCard, Wallet, CalendarClock, BadgeCheck, GraduationCap, CarFront,
  Landmark, IndianRupee, ChevronRight, Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { StatCard, Card, FadeIn, Stagger, Meter } from "../components/ui";
import { Sparkline } from "../components/charts";
import { creditCards, loans, creditScore } from "../data/finance";
import { loanMath, creditHealth, cardUtilization, minDueOf, daysUntil, utilizationTone } from "../lib/calc";

const LOAN_ICONS = { education: GraduationCap, car: CarFront, home: Landmark };

// ---------------- Physical card visual ----------------
function CardArt({ card, holder }) {
  return (
    <div
      className="relative rounded-2xl p-4 overflow-hidden text-white select-none"
      style={{ background: `linear-gradient(135deg, ${card.art[0]}, ${card.art[1]})`, aspectRatio: "1.62" }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: card.glow }}
      />
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-semibold">{card.bank}</p>
            <p className="font-display font-bold text-[15px] mt-0.5">{card.name}</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/60 border border-white/25 rounded-md px-1.5 py-0.5">
            {card.network}
          </span>
        </div>
        <div>
          {/* EMV chip */}
          <div className="w-9 h-6 rounded-md mb-2.5 grid grid-cols-2 gap-px overflow-hidden" style={{ background: "linear-gradient(135deg,#e8c87a,#c9a24b)" }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="border border-black/20" />
            ))}
          </div>
          <p className="font-mono2 text-[15px] tracking-[0.14em] text-white/90">•••• {card.last4}</p>
          <div className="flex items-end justify-between mt-1.5">
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/50 font-semibold">{holder}</span>
            <span className="font-mono2 font-bold text-[15px]">₹{card.balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Credit({ setPage }) {
  const { fmt, notify, settings } = useApp();
  const health = useMemo(() => creditHealth(creditCards), []);
  const loanRows = useMemo(() => loans.map((l) => ({ ...l, math: loanMath(l) })), []);
  const totalDebt = health.balance + loans.reduce((s, l) => s + l.outstanding, 0);
  const monthlyDebtLoad = loans.reduce((s, l) => s + l.emi, 0) + health.minDueTotal;

  // unified upcoming dues: EMIs + card due dates
  const dues = useMemo(() => {
    const items = [];
    for (const l of loans) {
      const d = loanMath(l);
      items.push({ label: `EMI — ${l.name}`, note: l.lender.split("·")[0], amount: l.emi, next: d.nextEmi, kind: "EMI" });
    }
    for (const c of creditCards) {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      d.setDate(c.dueDay);
      if (d.getTime() < Date.now()) d.setMonth(d.getMonth() + 1);
      items.push({ label: `Statement due — ${c.name}`, note: `${c.bank} ••${c.last4}`, amount: c.balance, next: d.toISOString(), kind: "Card" });
    }
    return items.sort((a, b) => new Date(a.next) - new Date(b.next)).slice(0, 4);
  }, []);

  const holderName = settings.profile.name;

  return (
    <div className="space-y-5 sm:space-y-6">
      <FadeIn>
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Credit & loans</h2>
          <p className="t3 text-sm mt-0.5">Card utilization, EMIs and your borrowing health — in one view.</p>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label={`${creditScore.bureau} score`} value={creditScore.score} format={(v) => `${Math.round(v)}`} icon={Gauge} tint="var(--pos)" delta={4.4} />
        <StatCard label="Total debt outstanding" value={totalDebt} format={fmt.money0} icon={Wallet} tint="var(--chart-5)" />
        <StatCard label="Card utilization" value={health.utilization} format={(v) => `${v.toFixed(1)}%`} icon={CreditCard} tint="var(--chart-2)" />
        <StatCard label="Monthly debt load" value={monthlyDebtLoad} format={fmt.money0} icon={IndianRupee} tint="var(--chart-4)" />
      </Stagger>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Credit cards */}
        <FadeIn className="xl:col-span-3">
          <Card
            title="Credit cards"
            subtitle={`${fmt.compact(health.limit)} combined limit · ${fmt.compact(health.available)} available`}
            className="h-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {creditCards.map((c) => {
                const util = cardUtilization(c);
                const minDue = minDueOf(c);
                const due = new Date();
                due.setDate(c.dueDay);
                if (due.getTime() < Date.now()) due.setMonth(due.getMonth() + 1);
                const days = daysUntil(due.toISOString());
                return (
                  <div key={c.id} className="space-y-3">
                    <CardArt card={c} holder={holderName} />
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-[12px]">
                        <span className="t3 font-semibold uppercase tracking-wider text-[10.5px]">Utilization</span>
                        <span className="font-mono2 font-bold" style={{ color: utilizationTone(util) }}>
                          {util.toFixed(1)}% <span className="t3 font-medium">of {fmt.compact(c.limit)}</span>
                        </span>
                      </div>
                      <Meter pct={util} color={utilizationTone(util)} height={7} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        ["Min due", fmt.money0(minDue)],
                        ["Due in", days <= 1 ? (days <= 0 ? "Today" : "Tomorrow") : `${days} days`],
                        ["APR", `${c.apr}%`],
                      ].map(([k, v]) => (
                        <div key={k} className="panel-inset rounded-xl py-2 px-1">
                          <p className="text-[9px] t3 uppercase tracking-[0.12em] font-bold">{k}</p>
                          <p className="font-mono2 text-[12px] font-semibold mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-ghost w-full !min-h-[38px] text-xs" onClick={() => notify(`Payment scheduled for ${c.name} ••${c.last4}`)}>
                      <Zap size={13} className="acc" /> Pay {fmt.money0(c.balance)} statement
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        {/* Credit score */}
        <FadeIn delay={0.08} className="xl:col-span-2">
          <Card
            title="Credit score"
            subtitle={`${creditScore.bureau} · refreshed ${creditScore.updated}`}
            action={
              <span className="chip" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>
                <BadgeCheck size={12} /> {creditScore.band}
              </span>
            }
            className="h-full"
          >
            <div className="relative mx-auto max-w-[240px]">
              <div className="h-[130px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="scoreG" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--chart-2)" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={[{ v: creditScore.score - 300 }, { v: 900 - creditScore.score }]}
                      dataKey="v"
                      startAngle={180}
                      endAngle={0}
                      innerRadius="72%"
                      outerRadius="100%"
                      strokeWidth={0}
                      cy="88%"
                      isAnimationActive={false}
                    >
                      <Cell fill="url(#scoreG)" />
                      <Cell fill="var(--border)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-x-0 bottom-1 text-center">
                <p className="font-display font-bold text-3xl font-mono2 leading-none">{creditScore.score}</p>
                <p className="text-[10px] t3 font-semibold uppercase tracking-[0.14em] mt-1">of 900 · {creditScore.band}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 mb-3">
              <span className="text-[10.5px] t3 font-semibold uppercase tracking-[0.12em]">8-month trend</span>
              <Sparkline data={creditScore.history.map((v) => ({ value: v }))} color="var(--pos)" id="score-spark" w={110} h={30} />
            </div>

            <div className="space-y-3">
              {creditScore.factors.map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium">{f.name}</span>
                    <span className="font-mono2 text-[11px] font-bold" style={{ color: f.pct >= 85 ? "var(--pos)" : f.pct >= 60 ? "var(--warn)" : "var(--neg)" }}>
                      {f.pct}%
                    </span>
                  </div>
                  <Meter pct={f.pct} color={f.pct >= 85 ? "var(--pos)" : f.pct >= 60 ? "var(--warn)" : "var(--neg)"} height={5} />
                  <p className="text-[10.5px] t3 mt-1">{f.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Loans */}
      <div>
        <FadeIn>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[15px]">Active loans</h3>
            <span className="chip" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {loans.length} open · {fmt.compact(loans.reduce((s, l) => s + l.outstanding, 0))} outstanding
            </span>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
          {loanRows.map((l, i) => {
            const Icon = LOAN_ICONS[l.kind] || Landmark;
            return (
              <FadeIn key={l.id} delay={i * 0.07}>
                <Card className="h-full">
                  <div className="p-5 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          <Icon size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-[15px] truncate">{l.name}</p>
                          <p className="text-[11px] t3 truncate">{l.lender} · since {l.started}</p>
                        </div>
                      </div>
                      <span className="chip shrink-0 font-mono2" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        {l.rate}% p.a.
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-4">
                      <span className="t3 text-[11px] font-semibold uppercase tracking-wider">Outstanding</span>
                      <span className="font-display font-bold text-2xl font-mono2">{fmt.money0(l.outstanding)}</span>
                    </div>
                    <div className="mt-2 mb-1.5">
                      <Meter pct={l.math.paidPct} color="var(--accent)" height={8} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] mb-4">
                      <span className="pos font-semibold font-mono2">{l.math.paidPct.toFixed(0)}% repaid</span>
                      <span className="t3">Payoff by {fmt.date(l.math.payoffDate)} · {l.math.tenureLabel}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        ["EMI", fmt.money0(l.emi)],
                        ["Next EMI", fmt.dateShort(l.math.nextEmi)],
                        ["Principal paid", fmt.money0(l.principal - l.outstanding)],
                        ["Interest left", fmt.money0(l.math.interestLeft)],
                      ].map(([k, v]) => (
                        <div key={k} className="panel-inset rounded-xl py-2 px-2 text-center">
                          <p className="text-[9px] t3 uppercase tracking-[0.12em] font-bold">{k}</p>
                          <p className="font-mono2 text-[12px] font-semibold mt-0.5 truncate">{v}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-ghost w-full mt-3 !min-h-[38px] text-xs"
                      onClick={() => notify(`Prepayment quote requested — ${l.name}`)}
                    >
                      <IndianRupee size={13} className="acc" /> Simulate prepayment
                    </button>
                  </div>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Upcoming dues */}
      <FadeIn>
        <Card
          title="Upcoming dues"
          subtitle="Next EMIs and card statements, in order"
          action={<CalendarClock size={16} className="t3" />}
        >
          <div className="divide-y-custom">
            {dues.map((d) => {
              const days = daysUntil(d.next);
              return (
                <div key={d.label} className="flex items-center gap-3 py-3">
                  <span
                    className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                    style={{ background: d.kind === "EMI" ? "var(--accent-soft)" : "var(--warn-soft)", color: d.kind === "EMI" ? "var(--accent)" : "var(--warn)" }}
                  >
                    {d.kind === "EMI" ? <Landmark size={15} /> : <CreditCard size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium truncate">{d.label}</span>
                    <span className="block text-[11px] t3">{d.note} · {fmt.date(d.next)}</span>
                  </span>
                  <span
                    className="chip shrink-0 hidden sm:inline-flex"
                    style={{ background: days <= 3 ? "var(--neg-soft)" : "var(--accent-soft)", color: days <= 3 ? "var(--neg)" : "var(--accent)" }}
                  >
                    {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days}d`}
                  </span>
                  <span className="font-mono2 text-[13px] font-semibold shrink-0">{fmt.money0(d.amount)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
