import React, { useMemo, useState } from "react";
import { FilterX, ArrowDownToLine, ArrowUpFromLine, Scale, SlidersHorizontal } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, SearchInput, Segmented, StatusBadge, CategoryBadge, FadeIn } from "../components/ui";
import DataTable from "../components/DataTable";
import { transactions, CATEGORIES } from "../data/finance";
import { filterTx, sumIn, sumOut, RANGES } from "../lib/calc";

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];
const TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expenses" },
];

export default function Transactions() {
  const { fmt } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [range, setRange] = useState("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () => filterTx(transactions, { q, category, status, type, range, from, to }),
    [q, category, status, type, range, from, to]
  );

  const inSum = sumIn(filtered);
  const outSum = sumOut(filtered);
  const activeFilters = [q, category !== "all", status !== "all", type !== "all", range !== "30d"].filter(Boolean).length;

  const clearAll = () => {
    setQ(""); setCategory("all"); setStatus("all"); setType("all"); setRange("30d"); setFrom(""); setTo("");
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      accessor: (t) => t.date,
      render: (t) => (
        <span className="font-mono2 text-[12px] t2">{fmt.date(t.date)}</span>
      ),
    },
    {
      key: "desc",
      label: "Description",
      sortable: false,
      render: (t) => (
        <div className="max-w-[220px] sm:max-w-[340px]">
          <p className="font-medium truncate">{t.desc}</p>
          <p className="text-[11px] t3 truncate">{t.account}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      mobile: true,
      accessor: (t) => t.category,
      render: (t) => <CategoryBadge category={t.category} />,
    },
    {
      key: "status",
      label: "Status",
      mobile: true,
      accessor: (t) => t.status,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      accessor: (t) => t.amount,
      render: (t) => (
        <span className={`font-mono2 font-semibold ${t.amount > 0 ? "pos" : ""}`}>
          {t.amount > 0 ? "+" : "−"}{fmt.money(Math.abs(t.amount))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Money in", value: inSum, icon: ArrowDownToLine, color: "var(--pos)", cls: "pos" },
            { label: "Money out", value: outSum, icon: ArrowUpFromLine, color: "var(--neg)", cls: "neg" },
            { label: "Net for selection", value: inSum - outSum, icon: Scale, color: "var(--accent)", cls: inSum - outSum >= 0 ? "pos" : "neg" },
          ].map((s) => (
            <div key={s.label} className="panel-flat rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--accent-soft)", color: s.color }}>
                <s.icon size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] t3 font-semibold uppercase tracking-[0.1em]">{s.label}</p>
                <p className={`font-mono2 font-bold text-lg ${s.cls}`}>{fmt.money(s.value)}</p>
              </div>
              <span className="ml-auto t3 text-[11px] font-mono2 hidden sm:block">{filtered.length} tx</span>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <Card title="Transaction history" subtitle="Search, filter, sort and paginate your ledger" pad={false}>
          {/* Filter bar */}
          <div className="px-5 pt-2 pb-4 space-y-3">
            <div className="flex flex-wrap gap-2.5">
              <SearchInput value={q} onChange={setQ} placeholder="Search merchant, category or account…" className="flex-1 min-w-[200px]" />
              <button className="btn btn-ghost lg:hidden" onClick={() => setShowFilters((s) => !s)}>
                <SlidersHorizontal size={14} /> Filters
                {activeFilters > 0 && <span className="w-5 h-5 rounded-full text-[10px] grid place-items-center font-bold" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{activeFilters}</span>}
              </button>
              <div className="hidden lg:flex gap-2.5 flex-1 min-w-0">
                <select className="input max-w-[190px]" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={`${showFilters ? "flex" : "hidden"} lg:flex flex-wrap items-center gap-2.5`}>
              <select className="input lg:hidden flex-1 min-w-[150px]" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input w-auto flex-1 sm:flex-none min-w-[130px]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label === "All" ? "Any status" : o.label}</option>)}
              </select>
              <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} />
              <Segmented options={RANGES} value={range} onChange={setRange} className="overflow-x-auto max-w-full" />
              {range === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
                  <span className="t3 text-xs">→</span>
                  <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
                </div>
              )}
              {activeFilters > 0 && (
                <button className="btn btn-ghost !min-h-[34px] !py-1.5 text-xs ml-auto" onClick={clearAll}>
                  <FilterX size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="px-1 sm:px-3 pb-4">
            <DataTable
              columns={columns}
              rows={filtered}
              pageSize={10}
              empty="Try widening the date range or clearing filters."
            />
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
