import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import EditFiguresModal from "../dashboard/EditFiguresModal";

// Daftar KPI per orang yang muncul saat baris tabel Team Scorecards dibuka.
// Data contoh (frontend only), belum tersambung ke sumber data.
const sampleKpis = [
  { id: 1, title: "[All] Cross-functional Coordination", source: "Updated from the Individual KPI Sheet", category: "Operation", target: "2", note: "target to date · 4 for the month, day 14 of 30" },
  { id: 2, title: "[All] Issue Escalation & Approval Follow-up", source: "Updated from the Individual KPI Sheet", category: "Operation", target: "100.0%", note: null },
  { id: 3, title: "[All] Monthly Business Review to Owner", source: "Updated from the Individual KPI Sheet", category: "Operation", target: "0", note: "target to date · 1 for the month, day 14 of 30" },
  { id: 4, title: "[All] Team Performance & Leadership", source: "Updated from the Individual KPI Sheet", category: "Operation", target: "90.0%", note: null },
];

const initialItems = sampleKpis.map((item) => ({
  ...item,
  unit: item.target.includes("%") ? "%" : "",
  targetValue: parseFloat(item.target),
  actual: null,
}));

export default function PersonKpiList({ personName }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(null);

  const handleSave = (updated) => {
    setItems((current) =>
      current.map((item) =>
        item.id === editing.id
          ? { ...item, actual: updated.actual, targetValue: updated.target }
          : item
      )
    );
    setEditing(null);
  };

  return (
    <div className="space-y-2.5 p-3 md:p-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
          KPI · {personName}
        </p>
        <span className="text-[11px] tabular-nums text-white/45">{items.length} KPIs</span>
      </div>

      {items.map((item) => {
        const hasActual = item.actual !== null;
        const pct = hasActual && item.targetValue > 0 ? (item.actual / item.targetValue) * 100 : 0;
        const achieved = hasActual && pct >= 100;

        return (
          <article
            key={item.id}
            className="grid gap-3.5 rounded-xl border border-white/[0.09] bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-8"
          >
            {/* Judul, sumber, dan aksi */}
            <div className="min-w-0">
              <h4 className="text-[14px] font-semibold leading-snug text-white md:text-[15px]">
                {item.title}
              </h4>
              <p className="mt-1 text-[12px] text-white/50">{item.source}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                  {item.category}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 text-[11px] font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.97]"
                >
                  <Pencil size={11} />
                  Edit figures
                </button>
              </div>
            </div>

            {/* Nilai, target, dan progres */}
            <div className="min-w-0 md:w-full md:max-w-[340px] md:justify-self-end">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-white/50">
                  {hasActual ? (
                    <span className="font-semibold tabular-nums text-white/90">{item.actual}{item.unit}</span>
                  ) : (
                    <span className="font-semibold text-white/90">Waiting for source data</span>
                  )}
                  <span className="mx-1.5 text-white/30">/</span>
                  <span className="tabular-nums text-white/70">{item.targetValue}{item.unit}</span>
                </p>

                {hasActual ? (
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                      achieved
                        ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-300"
                        : "border-white/15 bg-white/[0.06] text-white/75"
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200">
                    Pending
                  </span>
                )}
              </div>

              {item.note && !hasActual && <p className="mt-1 text-[11px] text-white/45">{item.note}</p>}

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${achieved ? "bg-emerald-400" : "bg-white/40"}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          </article>
        );
      })}

      {editing &&
        createPortal(
          <EditFiguresModal
            isOpen
            onClose={() => setEditing(null)}
            metric={{
              label: editing.title,
              actual: editing.actual ?? "",
              target: editing.targetValue,
            }}
            onSave={handleSave}
          />,
          document.body
        )}
    </div>
  );
}
