import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import GlassSelect from "../components/ui/GlassSelect";
import { createPortal } from "react-dom";
import EditFiguresModal from "../components/dashboard/EditFiguresModal";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Users,
  ListChecks,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Coins,
  Share2,
  TrendingUp,
  BarChart3,
  Calculator,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Download,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
ChartJS.defaults.color = "#b3a4a7";
ChartJS.defaults.font.family = "Plus Jakarta Sans, Inter, system-ui, sans-serif";

// =====================================================
// DESIGN TOKENS (tampilan saja)
// =====================================================

const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md px-2.5 text-[11px] transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-white/20 bg-white px-2.5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";

// Efek kaca ala Apple (liquid glass) khusus tabel
const GLASS_TABLE =
  "relative isolate overflow-hidden rounded-xl border border-white/15 bg-black/25 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.25)]";

const BAR_COLORS = ["#A21E1E", "#C96A6A", "#741818", "#D98A8A"];
const SPEND_COLORS = ["#8d8790", "#bdb7c0", "#625c66", "#dcd8de"];

const chartTooltip = {
  backgroundColor: "rgba(24,9,12,0.95)",
  titleColor: "#ffffff",
  bodyColor: "#e8dcde",
  borderColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
};

// =====================================================
// MOCK DATA — MIGRATED FROM LARAVEL
// =====================================================

const sections = [
  {
    title: "Budget & Advertising Performance",
    scroll: true,
    cards: [
      ["Ad Spend", Megaphone, "-4.9%", "Rp 464.164", "Rp 1.001.001", "46.4%", 46, "red"],
      ["CPL", Users, "-75.4%", "Rp 464.164", "Rp 1.001.001", "215.7%", 95, "red"],
      ["CPR", ListChecks, "+49.0%", "Rp 3.893.296", "Rp 2.052.052", "52.7%", 99, "green"],
      ["CPA", CheckCircle2, "+49.0%", "Rp 3.893.296", "Rp 2.052.052", "52.7%", 99, "green"],
    ],
  },
  {
    title: "Acquisition Performance",
    scroll: false,
    cards: [
      ["Leads", Users, "-4.9%", "Rp 464.164", "Rp 1.001.001", "46.4%", 46, "red"],
      ["Registration", FileText, "-75.4%", "Rp 464.164", "Rp 1.001.001", "215.7%", 95, "red"],
      ["Real Account Registration", ShieldCheck, "+49.0%", "Rp 3.893.296", "Rp 2.052.052", "52.7%", 99, "green"],
    ],
  },
  {
    title: "Conversion Performance",
    scroll: true,
    cards: [
      ["FTD", Coins, "-6.8%", "Rp 464.000", "Rp 1.000.000", "46.4%", 46, "red"],
      ["Leads to Reg. Rate", Share2, "-12.6%", "Rp 954.000", "Rp 1.000.000", "95.4%", 95, "red"],
      ["Reg. to FTD Rate", TrendingUp, "+18.5%", "Rp 2.985.000", "Rp 3.000.000", "99.5%", 99, "green"],
      ["Leads to FTD Rate", BarChart3, "+24.7%", "Rp 3.482.500", "Rp 3.500.000", "99.5%", 99, "green"],
    ],
  },
  {
    title: "Deposit & Revenue Performance",
    scroll: false,
    cards: [
      ["FTD Amount", Coins, "-3.2%", "Rp 556.800", "Rp 1.200.000", "46.4%", 46, "red"],
      ["Deposit per FTD", Calculator, "-15.8%", "Rp 858.600", "Rp 900.000", "95.4%", 95, "red"],
      ["ROAS (Deposit per Ad Spend)", TrendingUp, "+12.4%", "Rp 2.487.500", "Rp 2.500.000", "99.5%", 99, "green"],
    ],
  },
];

const parseMetricValue = (value) => {
  const raw = String(value ?? "").trim().replace(/[^0-9,.-]/g, "");
  if (!raw) return 0;
  // Format Indonesia: titik sebagai pemisah ribuan, koma sebagai desimal.
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/\./g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMetricValue = (value, originalValue) => {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  const formatted = Math.round(safeValue).toLocaleString("id-ID");
  return String(originalValue).includes("Rp") ? `Rp ${formatted}` : formatted;
};

// Variance bertanda (+/-) dalam format nilai asli, mis. "-Rp 38.836"
const formatSigned = (value, originalValue) => {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  return `${sign}${formatMetricValue(Math.abs(value), originalValue)}`;
};

// Metrik biaya: target adalah batas maksimal, jadi nilai lebih rendah = lebih baik
const isCostMetric = (name) => /^(ad spend|cpl|cpr|cpa)$/i.test(String(name).trim());

// Actual & Target per bulan. Satu-satunya sumber data kartu adalah angka Actual/Target
// bulan referensi (November 2026); Actual bulan lain diturunkan dengan getPeriodFactor,
// sedangkan Target mengikuti target kartu. Ganti fungsi ini bila data historis per bulan tersedia.
function getMonthlyMetric(card, period) {
  // Bulan tanpa data: nilai null (bukan 0) supaya tidak tampil sebagai angka nol
  const available = PERIODS_WITH_DATA.includes(period);
  return {
    available,
    actual: available ? parseMetricValue(card[3]) * getPeriodFactor(period) : null,
    target: available ? parseMetricValue(card[4]) : null,
  };
}

// Perubahan persen bertanda, "N/A" bila pembanding tidak valid
const formatChange = (value) => {
  if (value === null || !Number.isFinite(value)) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const against = [
  ["Leads", 100, "green"],
  ["Ad Spend", 100, "green"],
  ["ROAS (Return on Ad Spend)", 99, "yellow"],
  ["Revenue / Deposit", 99, "yellow"],
  ["FTD Ratio", 98, "yellow"],
  ["Registration", 94, "yellow"],
  ["First Deposit (FTD)", 92, "yellow"],
  ["Cost per Lead", 63, "red"],
  ["Cost per Acquisition", 58, "red"],
];

const funnel = [
  { label: "Leads", value: "2.010", width: 100, chip: "23,3%", note: "of leads" },
  { label: "Registration", value: "468", width: 23.3, chip: "11,8%", note: "of leads" },
  { label: "First Deposit (FTD)", value: "55", width: 3, chip: "11,8%", note: "of registrations" },
];

const tabs = [
  "Leads",
  "Registration",
  "First Deposit (FTD)",
  "Ad Spend",
  "Revenue / Deposit",
  "Cost per Lead",
  "Cost per Acquisition",
  "FTD Ratio",
  "ROAS (Return on Ad Spend)",
];

const weeks = [
  { label: "Week 1", leads: 560, actual: 563, spend: 66.64, ftd: 15, ftdTarget: 17 },
  { label: "Week 2", leads: 460, actual: 462, spend: 54.74, ftd: 15, ftdTarget: 17 },
  { label: "Week 3", leads: 520, actual: 523, spend: 61.64, ftd: 15, ftdTarget: 17 },
  { label: "Week 4", leads: 460, actual: 462, spend: 53.64, ftd: null, ftdTarget: null },
];

const weeklySummary = [1, 2, 3, 4];

const momValues = [1.2, 1.1, 0.8, 1.0, 1.6, 1.55, 2.0, 2.3, 2.8];

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

function SectionTitle({ children, aside, className = "mb-3" }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-white">
        {children}
      </h2>
      {aside}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section className={`mt-3 min-w-0 rounded-xl p-3 md:p-4 ${GLASS} ${className}`}>
      {children}
    </section>
  );
}

// Nama tampilan + penjelasan singkat (bahasa sederhana). Kunci data tetap memakai nama asli.
const METRIC_INFO = {
  "Ad Spend": { label: "Ad Spend", hint: "Total money spent on ads" },
  CPL: { label: "Cost per Lead (CPL)", hint: "Cost to get 1 potential customer" },
  CPR: { label: "Cost per Registration (CPR)", hint: "Cost per person who signs up" },
  CPA: { label: "Cost per Acquisition (CPA)", hint: "Cost per customer who deposits" },
  Leads: { label: "Leads", hint: "Potential customers who showed interest" },
  Registration: { label: "Registration", hint: "Number of people who registered an account" },
  "Real Account Registration": { label: "Real Account Registration", hint: "Sign-ups who opened a real account" },
  FTD: { label: "FTD (First-Time Deposit)", hint: "Customers who made a first deposit" },
  "Leads to Reg. Rate": { label: "Leads → Registration", hint: "How many leads ended up registering" },
  "Reg. to FTD Rate": { label: "Registration → FTD", hint: "How many sign-ups made a first deposit" },
  "Leads to FTD Rate": { label: "Leads → FTD", hint: "How many leads ended up making a first deposit" },
  "FTD Amount": { label: "First-Time Deposit Amount", hint: "Total money from first deposits" },
  "Deposit per FTD": { label: "Deposit per FTD", hint: "Average deposit per new customer" },
  "ROAS (Deposit per Ad Spend)": { label: "ROAS (Return on Ad Spend)", hint: "Deposit earned for every Rp 1 of ad spend" },
};
const metricLabel = (name) => METRIC_INFO[name]?.label ?? name;

const SECTION_LABELS = {
  "Budget & Advertising Performance": "Budget & Advertising",
  "Acquisition Performance": "Customer Acquisition",
  "Conversion Performance": "Konversi",
  "Deposit & Revenue Performance": "Deposit & Revenue",
};
const sectionLabel = (title) => SECTION_LABELS[title] ?? title;

// Status kartu dihitung dari Actual ÷ Target. Metrik biaya: lebih rendah = lebih baik.
function getCardStatus(card) {
  const actual = parseMetricValue(card[3]);
  const target = parseMetricValue(card[4]);
  const pct = target > 0 ? (actual / target) * 100 : null;
  const lowerIsBetter = isCostMetric(card[0]);
  const met = pct === null ? null : lowerIsBetter ? actual <= target : actual >= target;
  let text = "Target not available yet";
  if (met !== null) {
    text = lowerIsBetter
      ? met ? "Cost is within the target limit" : "Cost exceeds the target limit"
      : met ? "Target met" : "Target not yet met";
  }
  return { actual, target, pct, diff: actual - target, lowerIsBetter, met, text };
}

const STATUS_TEXT = { true: "text-emerald-300", false: "text-[#E04848]", null: "text-white/50" };
const STATUS_BAR = {
  true: "bg-gradient-to-r from-emerald-600 to-emerald-300",
  false: "bg-gradient-to-r from-[#741818] to-[#B83A3A]",
  null: "bg-white/20",
};

function KpiCard({ card, onEdit, selectedPeriods = [] }) {
  const [name, Icon, delta, actual, target, , , tone] = card;
  const positive = tone === "green";
  // Tooltip batang: bisa dibuka dengan tap (HP), tidak hanya hover
  const [activePeriod, setActivePeriod] = useState(null);

  // Persentase dihitung langsung dari Aktual ÷ Target; target 0/kosong -> N/A
  const status = getCardStatus(card);
  const { pct: pctNumber, met, lowerIsBetter } = status;
  const pct = pctNumber === null ? "N/A" : `${pctNumber.toFixed(1)}%`;
  const bar = pctNumber === null ? 0 : Math.max(0, Math.min(pctNumber, 100));
  const statusKey = String(met);
  const info = METRIC_INFO[name];

  return (
    <article className="group/card flex min-w-0 flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-black/40 p-4 transition-colors duration-200 hover:border-white/20">
      <div className="flex min-h-[44px] items-start justify-between gap-2 sm:min-h-[72px]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04] text-white">
            <Icon size={15} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-white/95">{metricLabel(name)}</p>
            {info && <p className="mt-0.5 text-[11px] leading-snug text-white/45">{info.hint}</p>}
          </div>
        </div>

        <span
          title="Change vs previous period"
          className={`inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full px-2 text-[11px] font-semibold leading-none ring-1 ${
            positive
              ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
              : "bg-[#B83A3A]/10 text-[#C42B2B] ring-[#B83A3A]/25"
          }`}
        >
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </span>
      </div>

      {/* Actual (merah) dan target (abu-abu) berdampingan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs leading-none text-white/55 sm:text-[11px]">
            <i className="inline-block h-[8px] w-[8px] shrink-0 rounded-full bg-[#B83A3A]" />
            Actual
          </p>
          <p className="mt-2 text-lg font-semibold leading-none tracking-tight tabular-nums text-white">{actual}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="flex items-center justify-end gap-1.5 text-xs leading-none text-white/55 sm:text-[11px]">
            <i className="inline-block h-[8px] w-[8px] shrink-0 rounded-full bg-[#8d8790]" />
            Target
          </p>
          <p className="mt-2 text-lg font-semibold leading-none tracking-tight tabular-nums text-white/70">{target}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-white/10 sm:h-1.5"
          role="progressbar"
          aria-valuenow={Math.round(bar)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Achievement ${metricLabel(name)}`}
        >
          <div className={`h-full rounded-full ${STATUS_BAR[statusKey]}`} style={{ width: `${bar}%` }} />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs leading-none text-white/55 sm:text-[11px]">Achievement</p>
            <p className={`mt-1.5 text-base font-semibold leading-none tabular-nums ${STATUS_TEXT[statusKey]}`}>{pct}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs leading-none text-white/55 sm:text-[11px]">Variance</p>
            <p className={`mt-1.5 text-base font-semibold leading-none tabular-nums ${STATUS_TEXT[statusKey]}`}>
              {pctNumber === null ? "N/A" : formatSigned(status.diff, actual)}
            </p>
          </div>
        </div>
        <p className={`text-xs leading-snug ${STATUS_TEXT[statusKey]} sm:text-[11px]`}>{status.text}</p>
      </div>

      {(() => {
        // Setiap bulan punya pasangan Aktual & Target sendiri (tidak dicampur antarbulan).
        // Achievement = Aktual / Target × 100%, Variance = Aktual - Target.
        const series = [...selectedPeriods].sort().map((period) => {
          const month = getMonthlyMetric(card, period);
          if (!month.available) {
            // Bulan tanpa data: jangan ditampilkan sebagai nol
            return { period, available: false, value: null, target: null, diff: null, pct: null };
          }
          return {
            period,
            available: true,
            value: month.actual,
            target: month.target,
            diff: month.actual - month.target,
            // Target 0 -> N/A (tidak ada pembagian dengan nol)
            pct: month.target > 0 ? (month.actual / month.target) * 100 : null,
          };
        }).map((point, index, all) => {
          // Perbandingan antarbulan: bulan ini vs bulan sebelumnya yang dipilih
          const prev = index > 0 ? all[index - 1] : null;
          return {
            ...point,
            actualChange: point.available && prev?.available && prev.value > 0 ? ((point.value - prev.value) / prev.value) * 100 : null,
            targetChange: point.available && prev?.available && prev.target > 0 ? ((point.target - prev.target) / prev.target) * 100 : null,
            hasPrev: Boolean(prev),
          };
        });

        const isGood = (value, ref) => (lowerIsBetter ? value <= ref : value >= ref);

        // Skala sumbu Y yang sama untuk batang Aktual dan Target di semua bulan
        const maxValue = Math.max(...series.flatMap((point) => (point.available ? [point.value, point.target] : [])), 1);

        return (
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <span className="text-[11px] font-medium leading-none text-white/55">Actual vs target</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] leading-none text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full bg-[#B83A3A]" />
                  Actual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full bg-[#8d8790]" />
                  Target
                </span>
              </span>
            </div>

            {series.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/45">Select at least one month to see the chart.</p>
            ) : (
              <div className="flex h-24 items-end gap-2">
                {series.map((point, index) => {
                  const actualHeight = point.available ? (point.value / maxValue) * 100 : 0;
                  const targetHeight = point.available ? (point.target / maxValue) * 100 : 0;
                  const good = point.pct !== null && isGood(point.value, point.target);
                  // Tooltip rata kiri/kanan di kolom pertama/terakhir agar tidak keluar dari kartu
                  const tipAlign =
                    series.length === 1
                      ? "left-1/2 -translate-x-1/2"
                      : index === 0
                        ? "left-0"
                        : index === series.length - 1
                          ? "right-0"
                          : "left-1/2 -translate-x-1/2";
                  return (
                    <div
                      key={point.period}
                      tabIndex={0}
                      onClick={() => setActivePeriod((prev) => (prev === point.period ? null : point.period))}
                      onBlur={() => setActivePeriod((prev) => (prev === point.period ? null : prev))}
                      className="group/bar flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-md outline-none"
                    >
                      <div className="relative flex h-full w-full items-end justify-center gap-1">
                        {point.available ? (
                          <>
                            <div
                              className="mp-bar-grow w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-[#741818] to-[#B83A3A] transition-[height,filter] duration-500 ease-out group-hover/bar:brightness-125 group-focus-visible/bar:brightness-125 sm:max-w-[14px]"
                              style={{ height: `${actualHeight}%` }}
                            />
                            <div
                              className="mp-bar-grow w-full max-w-[22px] rounded-t-md bg-gradient-to-t from-[#4b464d] to-[#8d8790] transition-[height,filter] duration-500 ease-out group-hover/bar:brightness-125 group-focus-visible/bar:brightness-125 sm:max-w-[14px]"
                              style={{ height: `${targetHeight}%` }}
                            />
                          </>
                        ) : (
                          <span className="absolute inset-x-0 bottom-1 text-center text-[11px] leading-tight text-white/40">No data yet</span>
                        )}
                        <div
                          role="tooltip"
                          className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-20 w-max min-w-[140px] max-w-[min(260px,calc(100vw-3rem))] rounded-lg border border-white/10 bg-[#151517] px-2.5 py-2 text-[11px] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.85)] transition-opacity duration-150 ${activePeriod === point.period ? "opacity-100" : "opacity-0 group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100"} ${tipAlign}`}
                        >
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                            {periodLabel(point.period)}
                          </p>
                          {!point.available ? (
                            <p className="leading-relaxed text-white/70">No data for this month yet.</p>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-4 leading-relaxed">
                                <span className="flex items-center gap-1.5 text-white/70">
                                  <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full bg-[#B83A3A]" />
                                  Actual
                                </span>
                                <b className="font-semibold tabular-nums text-white">{formatMetricValue(point.value, actual)}</b>
                              </div>
                              <div className="flex items-center justify-between gap-4 leading-relaxed">
                                <span className="flex items-center gap-1.5 text-white/70">
                                  <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full bg-[#8d8790]" />
                                  Target
                                </span>
                                <b className="font-semibold tabular-nums text-white">{formatMetricValue(point.target, target)}</b>
                              </div>
                              <div className="flex items-center justify-between gap-4 leading-relaxed">
                                <span className="text-white/70">Variance</span>
                                <b
                                  className={`font-semibold tabular-nums ${
                                    point.pct === null ? "text-white/60" : good ? "text-emerald-300" : "text-[#E04848]"
                                  }`}
                                >
                                  {point.pct === null ? "N/A" : formatSigned(point.diff, actual)}
                                </b>
                              </div>
                              <div className="flex items-center justify-between gap-4 leading-relaxed">
                                <span className="text-white/70">Achievement</span>
                                <b className="font-semibold tabular-nums text-white">
                                  {point.pct === null ? "N/A" : `${point.pct.toFixed(1)}%`}
                                </b>
                              </div>
                              {point.hasPrev && (
                                <div className="mt-1 border-t border-white/10 pt-1">
                                  <div className="flex items-center justify-between gap-4 leading-relaxed">
                                    <span className="text-white/70">Actual vs previous month</span>
                                    <b
                                      className={`font-semibold tabular-nums ${
                                        point.actualChange === null
                                          ? "text-white/60"
                                          : point.actualChange === 0
                                            ? "text-white"
                                            : (point.actualChange < 0) === lowerIsBetter
                                              ? "text-emerald-300"
                                              : "text-[#E04848]"
                                      }`}
                                    >
                                      {formatChange(point.actualChange)}
                                    </b>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 leading-relaxed">
                                    <span className="text-white/70">Target vs previous month</span>
                                    <b className="font-semibold tabular-nums text-white">{formatChange(point.targetChange)}</b>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-white/55 sm:text-[10px]">{shortPeriodLabel(point.period)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <button
        type="button"
        onClick={() => onEdit(name)}
        className="mt-auto inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 text-[13px] font-medium text-white/65 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white sm:h-6 sm:w-fit sm:justify-start sm:gap-1 sm:self-end sm:px-2 sm:text-[12px]"
      >
        <Pencil size={10} />
        Edit figures
      </button>
    </article>
  );
}


// =====================================================
// MONTH OVER MONTH INTERACTIVE CHART
// =====================================================

// Titik data pada garis MoM (koordinat viewBox 760 x 170), mengikuti path yang sudah ada.
// Nilai dihitung dari posisi y dengan skala 0 (y=150) sampai 3rb (y=12).
const MOM_KNOTS = [
  { x: 4, y: 52, month: "June 2026" },
  { x: 255, y: 64, month: "July 2026" },
  { x: 510, y: 33, month: "August 2026" },
  { x: 752, y: 12, month: "September 2026" },
];

const MOM_POINTS = MOM_KNOTS.map((knot, index, all) => {
  const value = Math.round(((150 - knot.y) / 138) * 300) * 10;
  const prev = index > 0 ? Math.round(((150 - all[index - 1].y) / 138) * 300) * 10 : null;
  return {
    ...knot,
    value,
    previous: prev,
    change: prev ? ((value - prev) / prev) * 100 : null,
  };
});

function MonthOverMonth({ selectedPeriods = ["2026-11"] }) {
  const plotRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Leads");
  const [activeIndex, setActiveIndex] = useState(null);

  // Titik terdekat dari posisi kursor ikut berpindah saat kursor bergerak
  function handleHover(event) {
    if (!plotRef.current) return;
    const rect = plotRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 760;
    let nearest = 0;
    MOM_POINTS.forEach((point, index) => {
      if (Math.abs(point.x - x) < Math.abs(MOM_POINTS[nearest].x - x)) nearest = index;
    });
    setActiveIndex(nearest);
  }

  const active = activeIndex !== null ? MOM_POINTS[activeIndex] : null;
  const activeLeft = active ? (active.x / 760) * 100 : 0;
  const activeTop = active ? (active.y / 170) * 100 : 0;
  const tooltipBelow = active ? active.y < 40 : false;
  const tooltipAlign =
    activeIndex === 0 ? "" : activeIndex === MOM_POINTS.length - 1 ? "-translate-x-full" : "-translate-x-1/2";

  return (
    <Panel className="mp-mom">
      <SectionTitle className="mb-1">Perbandingan Bulanan</SectionTitle>
      <p className="text-[13px] text-white/55">
        Chart follows the selected months: {selectedPeriods.map(periodLabel).join(" · ")}
      </p>

      <div className={`mt-3 p-3 ${INNER}`}>
        <p className="mb-3 text-xs font-medium text-white/55">Monthly summary (sample data)</p>
        <div className="h-[170px]">
          <Bar
            data={{
              labels: ["Leads", "Registration", "FTD", "Revenue"],
              datasets: selectedPeriods.map((period, index) => ({
                label: periodLabel(period),
                data: [2010, 468, 55, 2487].map((value) =>
                  PERIODS_WITH_DATA.includes(period) ? Math.round(value * getPeriodFactor(period)) : null
                ),
                backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                borderRadius: 6,
                maxBarThickness: 36,
              })),
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: selectedPeriods.length > 1,
                  labels: { color: "#d9cdd0", boxWidth: 8, usePointStyle: true, font: { size: 10 } },
                },
                tooltip: { ...chartTooltip, mode: "index", intersect: false },
              },
              scales: {
                x: { ticks: { color: "#b3a4a7", font: { size: 10 } }, grid: { display: false }, border: { display: false } },
                y: { beginAtZero: true, ticks: { color: "#b3a4a7", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" }, border: { display: false }, title: { display: true, text: "Count", color: "#b3a4a7", font: { size: 10 } } },
              },
            }}
          />
        </div>
      </div>

      {/* HP: pilih metrik lewat dropdown (area sentuh besar); layar lebar: tab */}
      <div className="mt-3 sm:hidden">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/45">Indicator</span>
        <GlassSelect label="Indicator" value={activeTab} onChange={setActiveTab} options={tabs} />
      </div>

      <div className="mp-scroll mt-3 hidden gap-1.5 overflow-x-auto pb-2 sm:flex" role="tablist" aria-label="Metric">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] transition ${
              activeTab === tab
                ? "border-white/30 bg-white font-semibold text-[#120809] shadow-[0_6px_18px_-8px_rgba(255,255,255,0.25)]"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
          <ArrowUpRight size={14} /> Naik 30.1%
        </span>
        <span className="text-white/50">{selectedPeriods.map(periodLabel).join(" · ")}</span>
        <span className="ml-auto text-xs text-white/40">
          <span className="sm:hidden">Tap the chart to see values</span>
          <span className="hidden sm:inline">Hover to see values</span>
        </span>
      </div>

      <div className="mt-5 pl-10 sm:px-3 sm:pl-11">
        <div
          ref={plotRef}
          onPointerMove={handleHover}
          onPointerDown={handleHover}
          onPointerLeave={() => setActiveIndex(null)}
          className="relative mt-12 h-[120px] cursor-crosshair touch-pan-y select-none"
        >
          <div className="absolute -left-10 top-0 flex h-full w-8 flex-col justify-between text-right text-[11px] font-medium text-white/40">
            <span>3rb</span>
            <span>2rb</span>
            <span>1rb</span>
            <span>500</span>
            <span>0</span>
          </div>

          <svg viewBox="0 0 760 170" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="momFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B83A3A" stopOpacity=".55" />
                <stop offset="55%" stopColor="#A21E1E" stopOpacity=".18" />
                <stop offset="100%" stopColor="#741818" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[10, 45, 80, 115, 150].map((y) => (
              <line key={y} x1="0" x2="760" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
            ))}

            <path
              d="M4 52 C90 56 170 72 255 64 C340 56 420 30 510 33 C600 36 680 18 752 12 L752 150 L4 150 Z"
              fill="url(#momFill)"
            />
            <path
              d="M4 52 C90 56 170 72 255 64 C340 56 420 30 510 33 C600 36 680 18 752 12"
              fill="none"
              stroke="#B82323"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {[255, 510].map((x) => (
              <line key={x} x1={x} x2={x} y1="0" y2="165" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
            ))}
          </svg>

          {/* Titik data per bulan */}
          {MOM_POINTS.map((point, index) => (
            <span
              key={point.month}
              aria-hidden="true"
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
                index === activeIndex
                  ? "h-4 w-4 border-2 border-white bg-[#A21E1E] shadow-[0_0_0_6px_rgba(162,30,30,0.16)]"
                  : "h-2 w-2 bg-white/70"
              }`}
              style={{ left: `${(point.x / 760) * 100}%`, top: `${(point.y / 170) * 100}%` }}
            />
          ))}

          {active && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-px -translate-x-1/2 bg-[#B82323]/80"
                style={{ left: `${activeLeft}%` }}
              />

              <div
                className={`pointer-events-none absolute z-20 w-[184px] rounded-xl border border-white/15 bg-[#1a0d10]/95 p-3 text-white shadow-2xl backdrop-blur-md ${tooltipAlign} ${
                  tooltipBelow ? "translate-y-[16px]" : "-translate-y-[calc(100%+16px)]"
                }`}
                style={{ left: `${activeLeft}%`, top: `${activeTop}%` }}
              >
                <p className="text-xs text-[#C42B2B]">{active.month}</p>
                <p className="mt-1 text-sm font-semibold">
                  {activeTab}: <span className="tabular-nums">{active.value.toLocaleString("en-US")}</span>
                </p>
                <div className="mt-2 flex justify-between gap-2 text-xs text-white/55">
                  <span>Previous month</span>
                  <span className="tabular-nums text-white/85">
                    {active.previous === null ? "—" : active.previous.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2 text-xs text-white/55">
                  <span>Change MoM</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      active.change === null ? "text-white/85" : active.change < 0 ? "text-[#C42B2B]" : "text-emerald-300"
                    }`}
                  >
                    {active.change === null ? "—" : `${active.change > 0 ? "+" : ""}${active.change.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 overflow-hidden text-[11px] font-medium text-white/50 sm:text-xs">
          {selectedPeriods.map((period) => (
            <span key={period} className="min-w-0 flex-1 truncate text-center">
              {shortPeriodLabel(period)}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// =====================================================
// WEEKLY PACING
// =====================================================

// Warna: merah = bulan utama, abu-abu = bulan pembanding. Ad Spend memakai tint lebih terang
// dari warna yang sama supaya tetap berbeda dari Leads (juga dibedakan oleh sumbu kanan).
// Desktop: merah = Leads, abu-abu = Ad Spend; bulan utama pekat, bulan pembanding lebih pudar.
// Mobile: grup Leads dan Ad Spend dipisah, jadi merah = bulan utama, abu-abu = pembanding.
const WEEK_COLORS = {
  current: { leads: "#A21E1E", spend: "#8d8790", mobile: "#A21E1E" },
  compare: { leads: "rgba(162,30,30,0.42)", spend: "rgba(141,135,144,0.45)", mobile: "#8d8790" },
};

const hasPeriodData = (period) => PERIODS_WITH_DATA.includes(period);

// Nilai satu minggu untuk satu bulan. null = data tidak tersedia (bukan nol).
function getWeekValues(week, period) {
  if (!period || !hasPeriodData(period)) return null;
  if (week.actual == null || week.spend == null) return null;
  const factor = getPeriodFactor(period);
  return {
    leads: Math.round(week.actual * factor),
    spend: Number((week.spend * factor).toFixed(2)),
  };
}

// Skala sumbu menyesuaikan nilai terbesar dari kedua bulan (4 interval, langkah "bulat")
function niceScale(maxValue, intervals = 4) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return { max: intervals, step: 1 };
  const raw = maxValue / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const multiple = [1, 1.5, 2, 2.5, 3, 4, 5, 10].find((m) => normalized <= m) ?? 10;
  const step = multiple * magnitude;
  return { max: step * intervals, step };
}

const formatLeads = (value) => Number(value).toLocaleString("id-ID");
const formatSpendMillions = (value) =>
  `Rp ${Number(value).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`;

function WeeklyPacing({ selectedPeriods = [] }) {
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Default mengikuti pilihan bulan global (bulan terbaru = utama, sebelumnya = pembanding),
  // tapi pengguna bebas memilih bulan mana pun lewat dua dropdown di bawah.
  const globalKey = [...selectedPeriods].sort().join("|");
  const deriveDefaults = () => {
    const sorted = [...selectedPeriods].sort();
    return {
      current: sorted[sorted.length - 1] || DEFAULT_PERIOD,
      compare: sorted.length > 1 ? sorted[sorted.length - 2] : "",
    };
  };
  const [current, setCurrent] = useState(() => deriveDefaults().current);
  const [compare, setCompare] = useState(() => deriveDefaults().compare);

  useEffect(() => {
    const defaults = deriveDefaults();
    setCurrent(defaults.current);
    setCompare(defaults.compare);
    setSelectedWeek(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalKey]);

  const periods = [
    { key: "current", period: current },
    ...(compare ? [{ key: "compare", period: compare }] : []),
  ];
  const singlePeriod = periods.length === 1;
  const missing = periods.filter(({ period }) => !hasPeriodData(period));

  const monthList = [...new Set([...QUICK_MONTHS, current, compare].filter(Boolean))].sort();
  const monthLabel = (month) => `${periodLabel(month)}${hasPeriodData(month) ? "" : " · no data yet"}`;
  const currentOptions = monthList.filter((month) => month !== compare).map((month) => ({ value: month, label: monthLabel(month) }));
  const compareOptions = [
    { value: "", label: "Tanpa pembanding" },
    ...monthList.filter((month) => month !== current).map((month) => ({ value: month, label: monthLabel(month) })),
  ];

  // Data per bulan per minggu (Week 1 dibandingkan Week 1, dst.)
  const series = periods.map(({ key, period }) => ({
    key,
    period,
    rows: weeks.map((week) => getWeekValues(week, period)),
  }));
  const allLeads = series.flatMap((s) => s.rows.map((row) => row?.leads)).filter((v) => v != null);
  const allSpend = series.flatMap((s) => s.rows.map((row) => row?.spend)).filter((v) => v != null);
  const leadsScale = niceScale(Math.max(0, ...allLeads));
  const spendScale = niceScale(Math.max(0, ...allSpend));

  const thickness = singlePeriod ? 28 : 18;
  const chartData = {
    labels: weeks.map((week) => week.label),
    datasets: [
      ...series.map((s) => ({
        label: `Leads · ${periodLabel(s.period)}`,
        data: s.rows.map((row) => row?.leads ?? null),
        backgroundColor: WEEK_COLORS[s.key].leads,
        borderRadius: 4,
        maxBarThickness: thickness,
        barPercentage: 0.9,
        categoryPercentage: singlePeriod ? 0.6 : 0.8,
        yAxisID: "yLeads",
      })),
      ...series.map((s) => ({
        label: `Ad Spend · ${periodLabel(s.period)}`,
        data: s.rows.map((row) => row?.spend ?? null),
        backgroundColor: WEEK_COLORS[s.key].spend,
        borderRadius: 4,
        maxBarThickness: thickness,
        barPercentage: 0.9,
        categoryPercentage: singlePeriod ? 0.6 : 0.8,
        yAxisID: "ySpend",
      })),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 12, right: 12, bottom: 4, left: 8 } },
    plugins: {
      legend: {
        display: true,
        labels: { color: "#d9cdd0", boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 16, font: { size: 10 } },
      },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${context.dataset.yAxisID === "ySpend" ? formatSpendMillions(value) : formatLeads(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#b3a4a7", font: { size: 11 }, padding: 8, minRotation: 0, maxRotation: 0, autoSkip: false },
        border: { color: "rgba(255,255,255,0.15)" },
      },
      yLeads: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        min: 0,
        max: leadsScale.max,
        ticks: { stepSize: leadsScale.step, color: "#e9a0a0", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.06)" },
        border: { display: false },
        title: { display: true, text: "Leads (people)", color: "#e9a0a0", font: { size: 11, weight: "500" } },
      },
      ySpend: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        min: 0,
        max: spendScale.max,
        ticks: { stepSize: spendScale.step, color: "#c9c4cc", font: { size: 10 }, callback: (value) => `Rp ${value} jt` },
        grid: { drawOnChartArea: false },
        border: { display: false },
        title: { display: true, text: "Ad Spend (Rp million)", color: "#c9c4cc", font: { size: 11, weight: "500" } },
      },
    },
    onClick: (_, elements) => {
      if (elements.length) {
        setSelectedWeek(elements[0].index);
      }
    },
  };

  const selected = selectedWeek !== null ? weeks[selectedWeek] : null;

  // Kelompok mobile: Leads dan Ad Spend dipisah, tiap minggu punya dua bar horizontal
  const mobileGroups = [
    { id: "leads", title: "Leads (people)", format: formatLeads, max: Math.max(0, ...allLeads) },
    { id: "spend", title: "Ad Spend (Rp million)", format: formatSpendMillions, max: Math.max(0, ...allSpend) },
  ];

  return (
    <Panel>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Weekly Performance</h3>
            <p className="mt-1 text-xs text-white/50">
              Leads and ad spend per week · comparing the same week across two months
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[11rem_11rem]">
            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/45 sm:text-[10px]">Main month</span>
              <GlassSelect label="Main month" value={current} onChange={setCurrent} options={currentOptions} />
            </div>
            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-white/45 sm:text-[10px]">Compare with</span>
              <GlassSelect label="Compare with" value={compare} onChange={setCompare} options={compareOptions} />
            </div>
          </div>
        </div>

        {missing.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-xs text-amber-200"
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Data {missing.map(({ period }) => periodLabel(period)).join(" and ")} is not available yet. Those weeks are left blank, not counted as zero.
            </span>
          </div>
        )}

        {/* DESKTOP / TABLET: grouped bar chart dengan dua sumbu */}
        <div className={`hidden p-3 md:block ${INNER}`}>
          <div className="relative h-[280px] w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* MOBILE: compact horizontal comparison */}
        <div className="space-y-3 md:hidden">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/70">
            {series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: WEEK_COLORS[s.key].mobile }} />
                {periodLabel(s.period)}
              </span>
            ))}
          </div>

          {mobileGroups.map((group) => (
            <div key={group.id} className={`p-3 ${INNER}`}>
              <p className="text-[12px] font-semibold text-white">{group.title}</p>
              <div className="mt-2.5 space-y-3">
                {weeks.map((week, weekIndex) => (
                  <button
                    key={week.label}
                    type="button"
                    onClick={() => setSelectedWeek(weekIndex)}
                    className="grid min-h-11 w-full grid-cols-[3.4rem_minmax(0,1fr)] items-center gap-2 text-left"
                  >
                    <span className="text-[11px] font-medium text-white/60">{week.label}</span>
                    <span className="space-y-1.5">
                      {series.map((s) => {
                        const value = s.rows[weekIndex]?.[group.id];
                        const width = value != null && group.max > 0 ? Math.max((value / group.max) * 100, 1.5) : 0;
                        return (
                          <span key={s.key} className="flex items-center gap-2">
                            <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                              <span
                                className="block h-full rounded-full transition-[width] duration-500 ease-out"
                                style={{ width: `${width}%`, backgroundColor: WEEK_COLORS[s.key].mobile }}
                              />
                            </span>
                            <span className="w-[5.75rem] shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/90">
                              {value != null ? group.format(value) : <span className="font-normal text-white/40">No data yet</span>}
                            </span>
                          </span>
                        );
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl border border-[#B82323]/25 bg-gradient-to-r from-[#A21E1E]/15 to-transparent p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">{selected.label}</h4>
              <button
                type="button"
                onClick={() => setSelectedWeek(null)}
                aria-label="Close week details"
                className="grid h-7 w-7 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {series.map((s) => {
                const row = s.rows[selectedWeek];
                return (
                  <div key={s.key}>
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                      <i className="inline-block h-[9px] w-[9px] shrink-0 rounded-full" style={{ backgroundColor: WEEK_COLORS[s.key].mobile }} />
                      {periodLabel(s.period)}
                    </p>
                    {row ? (
                      <div className="mt-1.5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-white/55">Leads</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-white">{formatLeads(row.leads)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/55">Ad Spend</p>
                          <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                            Rp {Math.round(row.spend * 1_000_000).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-sm text-white/40">Data not available yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// =====================================================
// CUSTOM PERIOD COMPARISON
// =====================================================

const monthOptions = [
  ["01", "January"], ["02", "February"], ["03", "March"],
  ["04", "April"], ["05", "May"], ["06", "June"],
  ["07", "July"], ["08", "August"], ["09", "September"],
  ["10", "October"], ["11", "November"], ["12", "December"],
];

function periodLabel(value) {
  if (!value) return "Select month";
  const [year, month] = value.split("-");
  return `${monthOptions.find(([number]) => number === month)?.[1] || month} ${year}`;
}

function getPeriodFactor(period) {
  const [year, month] = period.split("-").map(Number);
  const monthIndex = year * 12 + month - 1;
  const referenceIndex = 2026 * 12 + 10; // November 2026
  return Math.max(0.2, 1 + (monthIndex - referenceIndex) * 0.018);
}

function getDemoPeriodValue(baseValue, period) {
  const [year, month] = period.split("-").map(Number);
  const referenceMonth = 2026 * 12 + 10; // November 2026 (zero-based month)
  const selectedMonth = year * 12 + (month - 1);
  const monthDistance = selectedMonth - referenceMonth;

  // Deterministic demo values. Replace with historical API/Sheets data when available.
  const factor = 1 + (monthDistance * 0.018);
  return Math.max(0, baseValue * factor);
}

const QUICK_MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
const DEFAULT_PERIOD = "2026-11";
// Bulan yang sudah punya data (ditandai titik hijau); bulan lain tampil lebih redup
const PERIODS_WITH_DATA = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];

function shortPeriodLabel(value) {
  const [year, month] = value.split("-");
  const name = monthOptions.find(([number]) => number === month)?.[1] || month;
  return `${name.slice(0, 3)} ${year}`;
}

function PeriodComparison({ kpiSections, selectedPeriods, setSelectedPeriods }) {
  const [monthToAdd, setMonthToAdd] = useState("2026-10");

  const sortedPeriods = useMemo(
    () => [...selectedPeriods].sort((a, b) => a.localeCompare(b)),
    [selectedPeriods]
  );

  // Chip = bulan cepat + bulan lain yang dipilih manual
  const chipPeriods = useMemo(
    () => [...new Set([...QUICK_MONTHS, ...selectedPeriods])].sort((a, b) => a.localeCompare(b)),
    [selectedPeriods]
  );

  const addPeriod = () => {
    if (!monthToAdd || selectedPeriods.includes(monthToAdd)) return;
    setSelectedPeriods((current) => [...current, monthToAdd]);
  };

  const togglePeriod = (period) => {
    setSelectedPeriods((current) =>
      current.includes(period) ? current.filter((item) => item !== period) : [...current, period]
    );
  };

  const reset = () => {
    setSelectedPeriods([]);
    setMonthToAdd("2026-10");
  };

  const groups = useMemo(() => {
    return kpiSections.map((section) => ({
      title: section.title,
      metrics: section.cards.map((card) => {
        const baseValue = parseMetricValue(card[3]);
        // Bulan tanpa data bernilai null (ditampilkan N/A), bukan 0
        const values = sortedPeriods.map((period) => ({
          period,
          value: PERIODS_WITH_DATA.includes(period) ? getDemoPeriodValue(baseValue, period) : null,
        }));
        const available = values.filter((item) => item.value !== null);
        const firstValue = available[0]?.value;
        const lastValue = available[available.length - 1]?.value;
        const percentage =
          available.length < 2 || !firstValue ? null : ((lastValue - firstValue) / firstValue) * 100;
        return { name: card[0], originalValue: card[3], values, percentage };
      }),
    }));
  }, [kpiSections, sortedPeriods]);

  const formatValue = (value, originalValue) => {
    const numeric = Number(value);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    const formatted = Math.round(safeValue).toLocaleString("id-ID");
    return String(originalValue).includes("Rp") ? `Rp ${formatted}` : formatted;
  };

  const multi = sortedPeriods.length > 1;
  const colSpan = 1 + sortedPeriods.length + (multi ? 1 : 0);
  const alreadyAdded = !monthToAdd || selectedPeriods.includes(monthToAdd);

  return (
    <Panel className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[640px]">
          <SectionTitle className="mb-1">Select period</SectionTitle>
        </div>
      </div>

      {/* PILIH PERIODE */}
      <div className={`mt-3.5 p-3 md:p-4 ${INNER}`}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5">
          <p className="w-full text-xs font-medium text-white/60 sm:w-auto">Click a month to select or compare</p>
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/70">
            {selectedPeriods.length} {selectedPeriods.length === 1 ? "month" : "months"} selected
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] text-white/45 sm:inline-flex">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Has data
            </span>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97] sm:h-7 sm:px-3 sm:text-[11px]"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3.5 grid w-full grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {chipPeriods.map((period) => {
            const active = selectedPeriods.includes(period);
            const hasData = PERIODS_WITH_DATA.includes(period);
            return (
              <button
                key={period}
                type="button"
                onClick={() => togglePeriod(period)}
                aria-pressed={active}
                title={hasData ? undefined : "No data for this month yet"}
                                className={`relative flex h-12 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-xl border px-1 text-center transition duration-150 active:scale-[0.97] ${
                  active
                    ? "border-[#B82323]/70 bg-gradient-to-b from-[#A21E1E]/35 to-[#A21E1E]/15 text-white shadow-[0_6px_16px_-10px_rgba(196,36,40,0.7)]"
                    : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {active && <CheckCircle2 size={11} strokeWidth={2.25} className="absolute left-1.5 top-1.5 text-white" />}
                {hasData && <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                <span className="text-[12px] font-semibold leading-none">{shortPeriodLabel(period).split(" ")[0]}</span>
                <span className="text-[11px] leading-none text-white/45 sm:text-[10px]">{shortPeriodLabel(period).split(" ")[1]}</span>
              </button>
            );
          })}
        </div>

        {sortedPeriods.length > 0 && (
          <div className="mt-3 space-y-1 text-xs leading-relaxed text-white/60">
            <p>
              <span className="text-white/45">Main month:</span>{" "}
              <b className="font-semibold text-white">{periodLabel(sortedPeriods[sortedPeriods.length - 1])}</b>
            </p>
            {sortedPeriods.length > 1 && (
              <p>
                <span className="text-white/45">Comparison month:</span>{" "}
                <b className="font-semibold text-white/85">
                  {sortedPeriods.slice(0, -1).map(periodLabel).join(", ")}
                </b>
              </p>
            )}
          </div>
        )}

        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/50 sm:hidden">
          <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Green dot = Has data
        </p>
      </div>

      {/* HASIL */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {multi ? "Period comparison results" : "Monthly results"}
          </h3>
          <p className="mt-0.5 text-[11px] text-white/50">
            {multi
              ? `Change calculated from ${periodLabel(sortedPeriods[0])} to ${periodLabel(sortedPeriods[sortedPeriods.length - 1])}.`
              : sortedPeriods.length === 0
                ? "Select a month above to see results."
                : `Showing values for ${periodLabel(sortedPeriods[0])}.`}
          </p>
        </div>
      </div>

      <div className={`mt-2.5 ${GLASS_TABLE}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(360px_180px_at_10%_0%,rgba(214,92,104,0.13),transparent_70%),radial-gradient(320px_200px_at_95%_100%,rgba(162,30,30,0.10),transparent_70%)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="mp-scroll relative z-[1] overflow-auto sm:max-h-[340px]">
          <table className="w-full border-separate border-spacing-0 text-left text-xs sm:min-w-[520px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-white/60">
                <th className="mp-table-head mp-table-head-cell sticky left-0 top-0 z-[4] min-w-[96px] sm:min-w-[118px] border-b border-white/[0.14] bg-[#1d1013] px-3 py-3 text-left shadow-[4px_0_8px_-4px_rgba(0,0,0,0.6)]">Indicator</th>
                {sortedPeriods.map((period) => (
                  <th key={period} className="mp-table-head-period mp-table-head-cell sticky top-0 z-[2] whitespace-nowrap border-b border-white/[0.14] bg-[#1d1013] px-2.5 py-3 text-right sm:px-3">
                    {shortPeriodLabel(period)}
                  </th>
                ))}
                {multi && (
                  <th className="mp-table-head-period mp-table-head-cell sticky top-0 z-[2] whitespace-nowrap border-b border-white/[0.14] bg-[#1d1013] px-2.5 py-3 text-right sm:px-3">Change</th>
                )}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.title}>
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="border-b border-white/[0.06] bg-[#A21E1E]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#D98A8A]"
                    >
                      <span className="sticky left-3 inline-block">{sectionLabel(group.title)}</span>
                    </td>
                  </tr>
                  {group.metrics.map((metric) => {
                    const isPositive = metric.percentage !== null && metric.percentage >= 0;
                    return (
                      <tr key={metric.name} className="group/row transition-colors duration-150 hover:bg-white/[0.07]">
                        <td className="sticky left-0 z-[1] min-w-[96px] max-w-[120px] sm:min-w-[120px] sm:max-w-[160px] border-b border-white/[0.05] bg-[#170e10] px-3 py-2 font-medium leading-snug text-white/90 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.6)] group-hover/row:bg-[#291619]">
                          {metricLabel(metric.name)}
                        </td>
                        {metric.values.map((item) => (
                          <td key={item.period} className="whitespace-nowrap border-b border-white/[0.05] px-2.5 py-2 text-right text-[12px] tabular-nums text-white/95 sm:px-3 sm:text-xs">
                            {item.value === null ? <span className="font-normal text-white/40">N/A</span> : formatValue(item.value, metric.originalValue)}
                          </td>
                        ))}
                        {multi && (
                          <td className="whitespace-nowrap border-b border-white/[0.05] px-2.5 py-1.5 text-right">
                            {metric.percentage === null ? (
                              <span className="text-[11px] text-white/40">N/A</span>
                            ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ${
                                isPositive
                                  ? "bg-emerald-400/10 text-emerald-300 ring-emerald-300/25"
                                  : "bg-[#B83A3A]/10 text-[#C42B2B] ring-[#B82323]/30"
                              }`}
                            >
                              {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                              {isPositive ? "+" : ""}{metric.percentage.toFixed(1)}%
                            </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function MarketingPerformance() {
  const [editingMetric, setEditingMetric] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState(["2026-11"]);

  const [kpiSections, setKpiSections] = useState(() => {
    try {
      const saved = localStorage.getItem("marketing-kpi-values");
      const savedValues = saved ? JSON.parse(saved) : {};

      return sections.map((section) => ({
        ...section,
        cards: section.cards.map((card) => {
          const savedMetric = savedValues[card[0]];
          if (!savedMetric) return card;

          const updatedCard = [...card];
          updatedCard[3] = formatMetricValue(savedMetric.actual, card[3]);
          updatedCard[4] = formatMetricValue(savedMetric.target, card[4]);

          const percentage = savedMetric.target > 0
            ? (savedMetric.actual / savedMetric.target) * 100
            : 0;

          updatedCard[5] = `${percentage.toFixed(1)}%`;
          updatedCard[6] = Math.min(percentage, 100);
          return updatedCard;
        }),
      }));
    } catch (error) {
      console.error("Failed to read KPI data from localStorage:", error);
      return sections;
    }
  });

  const handleEditMetric = (name) => {
    const card = kpiSections
      .flatMap((section) => section.cards)
      .find((item) => item[0] === name);

    if (!card) return;

    setEditingMetric({
      name: card[0],
      label: card[0],
      actual: parseMetricValue(card[3]),
      target: parseMetricValue(card[4]),
    });
  };

  const handleSaveMetric = (updatedMetric) => {
    const percentage = updatedMetric.target > 0
      ? (updatedMetric.actual / updatedMetric.target) * 100
      : 0;

    const updatedSections = kpiSections.map((section) => ({
      ...section,
      cards: section.cards.map((card) => {
        if (card[0] !== updatedMetric.name) return card;

        const updatedCard = [...card];
        updatedCard[3] = formatMetricValue(updatedMetric.actual, card[3]);
        updatedCard[4] = formatMetricValue(updatedMetric.target, card[4]);
        updatedCard[5] = `${percentage.toFixed(1)}%`;
        updatedCard[6] = Math.min(percentage, 100);
        return updatedCard;
      }),
    }));

    setKpiSections(updatedSections);

    const valuesToSave = {};
    updatedSections.forEach((section) => {
      section.cards.forEach((card) => {
        valuesToSave[card[0]] = {
          actual: parseMetricValue(card[3]),
          target: parseMetricValue(card[4]),
        };
      });
    });

    try {
      localStorage.setItem("marketing-kpi-values", JSON.stringify(valuesToSave));
    } catch (error) {
      console.error("Failed to save KPI data:", error);
      window.alert("Changes are shown, but could not be saved in the browser.");
    }

    setEditingMetric(null);
  };
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPos, setExportPos] = useState(null);
  const exportBtnRef = useRef(null);

  // Ringkasan keseluruhan: berapa indikator yang sudah sesuai target (dihitung dari Aktual vs Target)
  const overall = {
    total: kpiSections.flatMap((section) => section.cards).length,
    met: kpiSections.flatMap((section) => section.cards).filter((card) => getCardStatus(card).met === true).length,
  };

  const latestFactor = getPeriodFactor(selectedPeriods[selectedPeriods.length - 1] || "2026-11");

  const exportRows = kpiSections.flatMap((section) =>
    section.cards.map((card) => ({
      section: section.title,
      metric: card[0],
      actual: card[3],
      target: card[4],
      achievement: parseMetricValue(card[4]) > 0
        ? `${((parseMetricValue(card[3]) / parseMetricValue(card[4])) * 100).toFixed(1)}%`
        : "N/A",
    }))
  );

  const exportHeaders = ["Section", "Metric", "Actual", "Target", "Achievement"];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  }[char]));
  const downloadBlob = (content, mimeType, filename) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const exportFilename = `marketing-performance-${selectedPeriods.join("-")}`;

  const handleExport = (format) => {
    setExportOpen(false);
    const rows = [exportHeaders, ...exportRows.map((row) => [row.section, row.metric, row.actual, row.target, row.achievement])];

    if (format === "csv") {
      const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
      downloadBlob("\uFEFF" + csv, "text/csv;charset=utf-8;", `${exportFilename}.csv`);
      return;
    }

    if (format === "excel") {
      const xmlRows = rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeHtml(cell)}</Data></Cell>`).join("")}</Row>`).join("");
      const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Marketing Performance"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
      downloadBlob(workbook, "application/vnd.ms-excel;charset=utf-8;", `${exportFilename}.xls`);
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      window.alert("Please allow pop-ups in your browser to create the PDF.");
      return;
    }
    const tableRows = exportRows.map((row) => `<tr><td>${escapeHtml(row.section)}</td><td>${escapeHtml(row.metric)}</td><td>${escapeHtml(row.actual)}</td><td>${escapeHtml(row.target)}</td><td>${escapeHtml(row.achievement)}</td></tr>`).join("");
    printWindow.document.write(`<!doctype html><html><head><title>Marketing Performance</title><style>body{font-family:Arial,sans-serif;color:#222;padding:28px}h1{margin:0 0 6px;color:#741818}p{color:#666;margin:0 0 22px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#741818;color:white;text-align:left}th,td{padding:10px;border:1px solid #ddd}tr:nth-child(even){background:#f7f7f7}@media print{body{padding:0}}</style></head><body><h1>Marketing Performance</h1><p>Selected period: ${escapeHtml(selectedPeriods.map(periodLabel).join(", "))}</p><table><thead><tr>${exportHeaders.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="mp-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-visible rounded-none border-0 bg-transparent md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] text-[#f6efef] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        @keyframes exportGlassIn {
          from { opacity: 0; transform: translateY(-5px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mp-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        /* Clear visual hierarchy for the Monthly Performance table header */
        .mp-root .mp-table-head {
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          line-height: 1.3;
          text-transform: uppercase;
          text-shadow: 0 1px 12px rgba(199,53,66,.12);
        }
        .mp-root .mp-table-head-period {
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .055em;
          font-variant-numeric: tabular-nums;
        }
        /* Gentle motion: no large movement or distracting bounce */
        .mp-root .mp-panel-motion {
          animation: mpFadeUp .48s cubic-bezier(.2,.7,.2,1) both;
        }
        .mp-root article,
        .mp-root .mp-interactive-card {
          transition: transform .22s ease, border-color .22s ease,
            background-color .22s ease, box-shadow .22s ease;
          will-change: transform;
        }
        .mp-root article:hover,
        .mp-root .mp-interactive-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,.17);
          box-shadow: 0 12px 28px -20px rgba(0,0,0,.9),
            inset 0 1px 0 rgba(255,255,255,.09);
        }
        .mp-root button,
        .mp-root a,
        .mp-root [role="button"] {
          transition: transform .18s ease, background-color .2s ease,
            border-color .2s ease, box-shadow .2s ease, color .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-root button:active,
        .mp-root a:active,
        .mp-root [role="button"]:active {
          transform: scale(.975);
        }
        .mp-root tbody tr {
          transition: background-color .18s ease, color .18s ease;
        }
        .mp-root tbody tr:hover td {
          background-color: rgba(255,255,255,.035);
        }
        .mp-root .mp-table-head-cell {
          background: linear-gradient(180deg, #4a1d25, #241114);
          box-shadow: inset 0 -1px 0 rgba(223,104,114,.22);
        }
        @keyframes mpFadeUp {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mp-root *, .mp-root .mp-panel-motion {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
        .mp-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
        .mp-scroll::-webkit-scrollbar { height: 6px; }
        .mp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 999px; }
        /* Mobile: skala teks dinaikkan sedikit agar mudah dibaca, jarak antar blok dirapikan */
        @media (max-width: 640px) {
          .mp-root .text-\[10px\] { font-size: 11px; line-height: 1.35; }
          .mp-root .text-\[11px\] { font-size: 12px; line-height: 1.35; }
          .mp-root .text-\[12px\] { font-size: 13px; }
          .mp-root h1 { font-size: 22px; }
          .mp-root .mb-5 { margin-bottom: 16px; }
          .mp-root .gap-3 { gap: 12px; }
          .mp-root table td, .mp-root table th { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) { .mp-root * { transition: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-full bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="mp-panel-motion relative z-10 mx-auto w-full max-w-none px-3 py-2 sm:px-4 md:px-4 md:py-3 lg:px-5">
      {/* PAGE HEADING */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
            Marketing Performance
          </h1>
          <p className="mt-1.5 text-xs text-white/55">
            Track ad results, check whether targets are met, and compare across months.
          </p>
          <p className="mt-1 text-[11px] text-white/40">Data last synced</p>
          {overall.total > 0 && (
            <p className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75">
              <span className={`h-1.5 w-1.5 rounded-full ${overall.met >= overall.total / 2 ? "bg-emerald-400" : "bg-[#E04848]"}`} />
              Summary: <b className="font-semibold tabular-nums text-white">{overall.met} of {overall.total}</b> indicators on target
            </p>
          )}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">

          <button
            type="button"
            className="group relative isolate inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl sm:h-9 sm:w-auto border border-white/[0.14] bg-white/[0.055] px-3.5 text-[12px] font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.13),0_8px_24px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl transition duration-200 hover:border-white/25 hover:bg-white/[0.09]"
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,rgba(255,255,255,0.12),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.045),transparent_55%)]" />
            Board Dossier
          </button>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              ref={exportBtnRef}
              aria-expanded={exportOpen}
              onClick={() => {
                if (!exportOpen && exportBtnRef.current) {
                  const r = exportBtnRef.current.getBoundingClientRect();
                  setExportPos({ top: r.bottom + 12, right: window.innerWidth - r.right });
                }
                setExportOpen((open) => !open);
              }}
              className="group relative isolate inline-flex h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl sm:h-9 sm:w-auto border border-white/20 bg-white/10 px-3.5 text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition duration-200 hover:border-white/35 hover:bg-white/15 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_30px_-10px_rgba(0,0,0,0.7)]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_0%,rgba(255,255,255,0.22),transparent_58%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_48%,rgba(80,0,10,0.12))]" />
              <Download size={13} />
              Export as
              <ChevronDown size={13} className={`transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && exportPos && createPortal(
              <>
                <button
                  type="button"
                  aria-label="Close export menu"
                  className="fixed inset-0 z-[59] cursor-default"
                  onClick={() => setExportOpen(false)}
                />
                <div
                  role="menu"
                  style={{ top: exportPos.top, right: window.innerWidth < 640 ? 12 : Math.max(12, exportPos.right), width: Math.min(340, window.innerWidth - 24) }}
                  className="fixed z-[60] max-h-[70vh] overflow-y-auto overflow-hidden rounded-2xl border border-white/[0.18] bg-[#21151bcc] p-2.5 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.92),0_0_38px_rgba(162,30,30,0.16),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-black/25 backdrop-blur-2xl backdrop-saturate-150 animate-[exportGlassIn_180ms_ease-out]"
                >
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_8%_0%,rgba(196,91,91,0.24),transparent_52%),radial-gradient(ellipse_at_100%_100%,rgba(162,30,30,0.19),transparent_55%),linear-gradient(145deg,rgba(255,255,255,0.09),transparent_48%,rgba(255,255,255,0.025))]" />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
                  <div className="px-3 pb-2.5 pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Export report</p>
                    <p className="mt-1 text-[11px] text-white/55">Choose your preferred file format</p>
                  </div>
                  <div className="space-y-1">
                    <button type="button" role="menuitem" onClick={() => handleExport("pdf")} className="group/item flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition duration-200 hover:border-white/[0.16] hover:bg-white/[0.085] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_18px_rgba(162,30,30,0.12)]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C42B2B]/35 bg-[#A21E1E]/20 text-[#F08B8B] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"><FileText size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-white">PDF Document</span><span className="mt-0.5 block text-[10px] text-white/55">Print-ready management report</span></span>
                      <span className="rounded-md border border-[#C42B2B]/20 bg-[#A21E1E]/10 px-2 py-1 text-[9px] font-semibold tracking-wide text-[#E04848]">PDF</span>
                      <ChevronRight size={14} className="text-white/35 transition group-hover/item:translate-x-0.5 group-hover/item:text-white/80" />
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleExport("excel")} className="group/item flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition duration-200 hover:border-white/[0.16] hover:bg-white/[0.085] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_18px_rgba(34,197,94,0.09)]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"><FileSpreadsheet size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-white">Excel Workbook</span><span className="mt-0.5 block text-[10px] text-white/55">Editable KPI data and figures</span></span>
                      <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold tracking-wide text-emerald-300">XLSX</span>
                      <ChevronRight size={14} className="text-white/35 transition group-hover/item:translate-x-0.5 group-hover/item:text-white/80" />
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleExport("csv")} className="group/item flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition duration-200 hover:border-white/[0.16] hover:bg-white/[0.085] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_18px_rgba(56,189,248,0.09)]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-300/30 bg-sky-400/10 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"><FileSpreadsheet size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-white">CSV Data</span><span className="mt-0.5 block text-[10px] text-white/55">Raw data for Sheets and analysis</span></span>
                      <span className="rounded-md border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[9px] font-semibold tracking-wide text-sky-300">CSV</span>
                      <ChevronRight size={14} className="text-white/35 transition group-hover/item:translate-x-0.5 group-hover/item:text-white/80" />
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
      </div>

      {/* ATTENTION BANNER */}
<button
  onClick={() => window.alert("1 item needs attention")}
  className="bg-[#2A1114] group mb-1 flex min-h-11 w-full sm:min-h-8 items-center gap-2 rounded-xl border border-[#B82323]/30 px-2.5 py-1.5 sm:py-0.5 text-left text-[11px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[#B82323]/55"
>
  <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#A21E1E]/30 text-white">
    <AlertTriangle size={16} />
  </span>

  <span>1 item needs attention</span>

  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-white/60 transition group-hover:text-white">
    View
    <ChevronRight size={14} />
  </span>
</button>

      {/* CUSTOM PERIOD SELECTION */}
      <PeriodComparison
        kpiSections={kpiSections}
        selectedPeriods={selectedPeriods}
        setSelectedPeriods={setSelectedPeriods}
      />

      {/* KPI SECTIONS */}
      {kpiSections.map((section) => {
        const onTrack = section.cards.filter((card) => getCardStatus(card).met === true).length;
        return (
          <Panel key={section.title}>
            <SectionTitle
              aside={
                <span className="inline-flex items-center gap-2 text-xs text-white/55">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {onTrack} of {section.cards.length} on target
                </span>
              }
            >
              {sectionLabel(section.title)}
            </SectionTitle>

<div
  className="mp-scroll flex flex-col gap-3 sm:flex-row sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:pb-2 [&>article]:w-full sm:[&>article]:shrink-0 sm:[&>article]:snap-start sm:[&>article]:w-[calc((100%_-_0.75rem)/2)] xl:[&>article]:w-[calc((100%_-_1.5rem)/3)]"
>

              {section.cards.map((card) => (
                <KpiCard
                  key={card[0]}
                  card={card}
                  onEdit={handleEditMetric}
                  selectedPeriods={selectedPeriods}
                />
              ))}
            </div>
          </Panel>
        );
      })}

      {/* FULL PERFORMANCE ANALYSIS */}
      <Panel>
        <button
          type="button"
          aria-expanded={analysisOpen}
          onClick={() => setAnalysisOpen(!analysisOpen)}
          className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
              {analysisOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
            Analisis lengkap
          </span>
          <small className="text-xs font-medium text-white/50">
            Target achievement · Customer funnel · Monthly comparison · Weekly performance
          </small>
        </button>

        {analysisOpen && (
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {/* AGAINST TARGET */}
            <div className={`min-w-0 p-4 ${INNER}`}>
              <h3 className="text-sm font-semibold text-white">Achievement vs target</h3>

              <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                White line = target (100%). A bar that reaches or passes the line means the
                target is met. Indicators without a target are not shown.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {against.map(([label, baseValue, color]) => {
                  const value = Math.min(150, baseValue * latestFactor);
                  const colorMap = {
                    green: "linear-gradient(90deg,#059669,#34d399)",
                    yellow: "linear-gradient(90deg,#d97706,#fbbf24)",
                    red: "linear-gradient(90deg,#741818,#B83A3A)",
                  };
                  const fill = Math.max(0, Math.min(100, ((value - 50) / 75) * 100));

                  return (
                    <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 sm:grid-cols-[minmax(0,96px)_minmax(0,1fr)_56px] sm:gap-y-0">
                      {/* HP: label di atas bar (tidak terpotong); layar lebar: label di kiri */}
                      <span className="col-start-1 row-start-1 min-w-0 text-[13px] font-medium leading-snug text-white/85 sm:truncate sm:text-right sm:text-xs sm:text-white/80">
                        {label}
                      </span>

                      <div className="relative col-span-2 row-start-2 h-2.5 min-w-0 flex-1 rounded-full bg-white/10 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${fill}%`, background: colorMap[color] }}
                        />
                        <i className="absolute bottom-[-4px] left-[66.67%] top-[-4px] w-px bg-white/60" />
                      </div>

                      <span className="col-start-2 row-start-1 shrink-0 whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-white sm:col-start-3 sm:w-14 sm:text-xs">
                        {Number(value).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-1 items-start gap-2 text-[11px] font-medium text-white/40 sm:text-[10px] sm:grid-cols-[minmax(0,96px)_minmax(0,1fr)_56px]">
                <span className="hidden sm:block" />
                <div className="relative h-4">
                  {[["50", 0, "translate-x-0"], ["75", 33.33, "-translate-x-1/2"], ["100", 66.67, "-translate-x-1/2"], ["125", 100, "-translate-x-full"]].map(([label, pos, shift]) => (
                    <span key={label} className={`absolute whitespace-nowrap ${shift}`} style={{ left: `${pos}%` }}>
                      {label}
                    </span>
                  ))}
                </div>
                <span className="hidden sm:block" />
              </div>
            </div>

            {/* ACQUISITION FUNNEL */}
            <div className={`min-w-0 p-4 ${INNER}`}>
              <h3 className="text-sm font-semibold text-white">Customer funnel</h3>

              <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                Each stage is compared with the previous stage. Bar length shows
                the number of people, not a percentage.
              </p>

              <div className="mt-5 flex flex-col gap-5">
                {funnel.map((item) => {
                  const scaledValue =
                    Number(String(item.value).replace(/\./g, "")) * latestFactor;
                  const displayValue = Math.round(scaledValue).toLocaleString("id-ID");
                  const barWidth = Math.max(0, Math.min(100, item.width));

                  return (
                    <div key={item.label} className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="min-w-0 text-[13px] font-semibold text-white/90">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-white">
                          {displayValue}
                        </span>
                      </div>

                      <div
                        className="h-3 w-full overflow-hidden rounded-full bg-white/[0.09]"
                        role="progressbar"
                        aria-label={`${item.label} funnel`}
                        aria-valuenow={barWidth}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8f1c20] via-[#A21E1E] to-[#B82323] transition-[width] duration-500"
                          style={{
                            width: `${barWidth}%`,
                            minWidth: barWidth > 0 ? "14px" : "0",
                          }}
                        />
                      </div>

                      {item.chip && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 pl-0.5">
                          <ArrowDownRight
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-white/40"
                            aria-hidden="true"
                          />
                          <span className="inline-flex rounded-full border border-[#B82323]/25 bg-[#A21E1E]/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#D98A8A]">
                            {item.chip}
                          </span>
                          <span className="text-xs text-white/55">{item.note}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* MONTH OVER MONTH */}
      <MonthOverMonth selectedPeriods={selectedPeriods} />

      {/* WEEKLY PACING */}
      <WeeklyPacing selectedPeriods={selectedPeriods} />

      {/* WEEK SUMMARY */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {weeklySummary.map((number) => (
          <div key={number} className={`rounded-xl p-3 ${GLASS}`}>
            <div className="flex items-center justify-between">
              <b className="text-[13px] font-semibold text-white">Week {number}</b>
              {Math.round(weeks[number - 1].actual * latestFactor) >= Math.round(weeks[number - 1].leads * latestFactor) ? (
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25 sm:text-[10px]">
                  On target
                </span>
              ) : (
                <span className="rounded-full bg-[#B83A3A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#E04848] ring-1 ring-[#B83A3A]/25 sm:text-[10px]">
                  Below target
                </span>
              )}
            </div>

            <dl className="mt-2 divide-y divide-white/[0.07] text-xs">
              <div className="flex justify-between gap-2 py-2">
                <dt className="text-white/50">Leads</dt>
                <dd className="text-right font-semibold tabular-nums text-white">
                  {Math.round(weeks[number - 1].actual * latestFactor)}
                  <span className="mt-0.5 block text-xs font-normal text-white/45">
                    of {Math.round(weeks[number - 1].leads * latestFactor)}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between gap-2 py-2">
                <dt className="text-white/50">Ad Spend</dt>
                <dd className="text-right font-semibold tabular-nums text-white">
                  Rp {(weeks[number - 1].spend * 1_000_000 * latestFactor).toLocaleString("id-ID")}
                  <span className="mt-0.5 block text-xs font-normal text-white/45">
                    of Rp 200.000.000
                  </span>
                </dd>
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <dt className="text-white/50">FTD</dt>
                <dd className="text-right font-semibold tabular-nums text-white">
                  {weeks[number - 1].ftd !== null ? (
                    <>
                      {Math.round(weeks[number - 1].ftd * latestFactor)}
                      <span className="mt-0.5 block text-xs font-normal text-white/45">
                        of {weeks[number - 1].ftdTarget}
                      </span>
                    </>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Dirender lewat portal ke <body> agar tidak terjebak di dalam elemen beranimasi (transform) yang membuat posisi fixed salah */}
      {createPortal(
        <EditFiguresModal
          isOpen={editingMetric !== null}
          onClose={() => setEditingMetric(null)}
          metric={editingMetric}
          onSave={handleSaveMetric}
        />,
        document.body
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------
// Dibaca oleh Report Generator (hanya baca; tidak mengubah dashboard).
// Angka yang sama dengan yang ditampilkan dashboard: kartu Actual/Target (termasuk hasil suntingan di "marketing-kpi-values")
// dikalikan faktor periode, dan data per minggu. Bulan di luar PERIODS_WITH_DATA = null (tidak ada data).
// ---------------------------------------------------------------------------------
export function getDashboardKpi(period) {
  if (!PERIODS_WITH_DATA.includes(period)) return null;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("marketing-kpi-values") || "{}") || {}; } catch { saved = {}; }
  const out = {};
  sections.forEach((section) => section.cards.forEach((card) => {
    const metric = saved[card[0]];
    const actual = metric ? Number(metric.actual) : parseMetricValue(card[3]);
    const target = metric ? Number(metric.target) : parseMetricValue(card[4]);
    out[card[0]] = { actual: actual * getPeriodFactor(period), target };
  }));
  return out;
}

// Minggu ke-n (1-4) pada bulan tanggal mulai; null bila bulan itu tidak punya data
export function getDashboardWeek(isoStart) {
  const period = String(isoStart || "").slice(0, 7);
  if (!PERIODS_WITH_DATA.includes(period)) return null;
  const index = Math.min(3, Math.floor((Number(String(isoStart).slice(8, 10)) - 1) / 7));
  const week = weeks[index];
  const values = getWeekValues(week, period);
  if (!values) return null;
  const factor = getPeriodFactor(period);
  return {
    label: week.label,
    leads: values.leads,
    leadsTarget: Math.round(week.leads * factor),
    spend: values.spend * 1_000_000,
    ftd: week.ftd == null ? null : Math.round(week.ftd * factor),
    ftdTarget: week.ftdTarget == null ? null : Math.round(week.ftdTarget * factor),
  };
}
