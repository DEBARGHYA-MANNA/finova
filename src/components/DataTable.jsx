import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { EmptyState } from "./ui";

// ------------------------------------------------------------------
// Reusable data table with sorting, pagination and expandable rows.
// columns: [{ key, label, align, sortable, accessor, render, mobile }]
// ------------------------------------------------------------------
export default function DataTable({
  columns,
  rows,
  rowKey = "id",
  pageSize = 10,
  onRowClick,
  expandedKey = null,
  expandedRender,
  empty = "No rows match your filters.",
  footer,
  compact = false,
}) {
  const [sort, setSort] = useState(null); // { key, dir }
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [rows.length]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = col.accessor || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key) =>
    setSort((s) =>
      !s || s.key !== key ? { key, dir: "desc" } : s.dir === "desc" ? { key, dir: "asc" } : null
    );

  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(sorted.length, (safePage + 1) * pageSize);

  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={c.sortable !== false ? () => toggleSort(c.key) : undefined}
                  className={`t3 text-[10.5px] font-semibold uppercase tracking-[0.09em] whitespace-nowrap select-none
                    ${compact ? "px-3 py-2.5" : "px-4 py-3"} ${c.mobile ? "hidden md:table-cell" : ""}
                    ${c.align === "right" ? "text-right" : "text-left"}
                    ${c.sortable !== false ? "cursor-pointer hover:text-[var(--text-1)]" : ""}`}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className={`inline-flex items-center gap-1 ${c.align === "right" ? "flex-row-reverse" : ""}`}>
                    {c.label}
                    {c.sortable !== false &&
                      (sort?.key === c.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp size={11} className="acc" />
                        ) : (
                          <ArrowDown size={11} className="acc" />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const open = expandedKey != null && expandedKey === row[rowKey];
              return (
                <React.Fragment key={row[rowKey]}>
                  <tr
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`group transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                    style={{ background: open ? "var(--accent-soft)" : undefined }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`${compact ? "px-3 py-2.5" : "px-4 py-3"} text-[13px] whitespace-nowrap
                          ${c.mobile ? "hidden md:table-cell" : ""} ${c.align === "right" ? "text-right" : ""}
                          group-hover:bg-[var(--accent-soft)] transition-colors`}
                        style={{ borderBottom: "1px solid var(--border)", ...(open ? { background: "var(--accent-soft)" } : {}) }}
                      >
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                  <AnimatePresence>
                    {open && expandedRender && (
                      <tr>
                        <td colSpan={columns.length} style={{ borderBottom: "1px solid var(--border)" }} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="p-4" style={{ background: "var(--card-2)" }}>
                              {expandedRender(row)}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && <EmptyState title="No transactions found" desc={empty} />}
      </div>

      {(sorted.length > pageSize || footer) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="t3 text-xs font-medium">
            Showing <span className="t2 font-semibold">{from}–{to}</span> of <span className="t2 font-semibold">{sorted.length}</span>
            {footer ? <span className="hidden sm:inline"> &nbsp;·&nbsp; {footer}</span> : null}
          </span>
          {sorted.length > pageSize && (
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous page"
                className="btn-ghost btn !px-2.5 !min-h-[34px] disabled:opacity-40 disabled:pointer-events-none"
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline text-xs">Prev</span>
              </button>
              <span className="t3 text-xs font-mono2 px-1">
                {safePage + 1}<span className="opacity-50"> / {pageCount}</span>
              </span>
              <button
                aria-label="Next page"
                className="btn-ghost btn !px-2.5 !min-h-[34px] disabled:opacity-40 disabled:pointer-events-none"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="hidden sm:inline text-xs">Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { ChevronDown };
