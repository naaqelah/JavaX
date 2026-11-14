
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CheckCircle2, Plus, RotateCcw } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend);

const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";

const PALETTE = ["#B82323", "#E04848", "#8d8790", "#E8DCDE", "#6b5f66"];

const formatters = {
  int: (v) => Math.round(v).toLocaleString("id-ID"),
  pct: (v) => `${v.toFixed(1)}%`,
  rp: (v) => `Rp ${Math.round(v).toLocaleString("id-ID")}`,
};

// Perbandingan periode custom: pilih bulan bebas, lihat tabel perubahan dan grafik.
// series: [{ name, values: number[] (sesuai urutan months), format: "int" | "pct" | "rp" }]
export default function PeriodCompare({ title, description, months, series }) {
  const defaultSelection = [months[0], months[months.length - 1]];
  const [selected, setSelected] = useState(defaultSelection);
  const [hoverIndex, setHoverIndex] = useState(null);

  const ordered = months.filter((m) => selected.includes(m));
  const valid = ordered.length >= 2;
  const indexOf = (month) => months.indexOf(month);

  const toggle = (month) =>
    setSelected((current) =>
      current.includes(month)
        ? current.length > 1
          ? current.filter((m) => m !== month)
          : current
        : [...current, month]
    );

  const reset = () => setSelected(defaultSelection);

  const rows = series.map((s) => {
    const first = s.values[indexOf(ordered[0])];
    const last = s.values[indexOf(ordered[ordered.length - 1])];
    const change = first ? ((last - first) / first) * 100 : 0;
    return { ...s, change };
  });

  const activeIdx = hoverIndex ?? ordered.length - 1;
  const activeMonth = ordered[activeIdx] ?? "";

  const chartData = {
    labels: ordered,
    datasets: series.map((s, i) => ({
      label: s.name,
      data: ordered.map((m) => s.values[indexOf(m)]),
      backgroundColor: PALETTE[i % PALETTE.length],
      borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    })),
  };

  // Nilai hover ditampilkan di panel di atas grafik, bukan tooltip yang menutupi batang
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    onClick: (_event, elements) => setHoverIndex(elements.length ? elements[0].index : null),
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#d9cdd0", boxWidth: 8, usePointStyle: true, font: { size: 10 } },
      },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#b3a4a7", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.06)" },
        border: { display: false },
        ticks: { color: "#b3a4a7", font: { size: 10 } },
      },
    },
  };

  return (
    <section className={`mt-5 rounded-2xl p-4 md:p-5 ${GLASS}`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
          Demo data
        </span>
      </div>
      <p className="text-[12px] text-white/55">{description}</p>

      <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/35 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-white/60">
            Select period <span className="text-white/35">· click a month to add / remove</span>
          </p>
          <span className="text-[11px] text-white/45">
            {ordered.length} {ordered.length === 1 ? "month" : "months"} selected
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {months.map((month) => {
            const active = selected.includes(month);

            return (
              <button
                key={month}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(month)}
                className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[12px] font-medium transition active:scale-[0.97] ${
                  active
                    ? "border-[#B82323]/50 bg-[#A21E1E]/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white"
                }`}
              >
                {active && <CheckCircle2 size={11} className="text-[#D98A8A]" />}
                {month}
              </button>
            );
          })}

          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex h-6 items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </div>

      {!valid && (
        <p className="mt-3 text-[12px] text-[#E04848]">Select 2+ months to compare.</p>
      )}

      {valid && (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full min-w-[460px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/55">
                  <th className="px-4 py-2.5 font-semibold">Metric</th>
                  {ordered.map((month) => (
                    <th key={month} className="px-4 py-2.5 text-right font-semibold">
                      {month}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const fmt = formatters[row.format || "int"];

                  return (
                    <tr key={row.name} className="border-t border-white/[0.06]">
                      <td className="px-4 py-2.5 font-medium text-white">{row.name}</td>
                      {ordered.map((month) => (
                        <td key={month} className="px-4 py-2.5 text-right tabular-nums text-white/85">
                          {fmt(row.values[indexOf(month)])}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold tabular-nums ring-1 ${
                            row.change >= 0
                              ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                              : "bg-[#A21E1E]/15 text-[#E04848] ring-[#B82323]/30"
                          }`}
                        >
                          {row.change >= 0 ? "+" : ""}
                          {row.change.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 p-3">
            <div className="mb-2 flex min-h-[30px] flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12px]">
              <span className="font-semibold text-white">{activeMonth}</span>
              {series.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1.5 text-white/65">
                  <i className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  {s.name}
                  <b className="tabular-nums text-white">
                    {(formatters[s.format || "int"])(s.values[indexOf(activeMonth)])}
                  </b>
                </span>
              ))}
            </div>
            <div className="h-[220px] min-w-0">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
