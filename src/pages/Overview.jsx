 import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  CircleSlash,
  Eye,
  FolderOpen,
  Layers,
  Package,
  RefreshCw,
  Bot,
  Settings,
  Users,
  Terminal,
  Check,
  ChevronDown,
} from "lucide-react";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// Palet & tipografi mengikuti MarketingPerformance
// Plugin: lingkaran track tipis di belakang donat (gaya referensi)
const donutTrack = {
  id: "donutTrack",
  beforeDatasetsDraw(chart, _args, options) {
    if (!options?.color) return;
    const meta = chart.getDatasetMeta(0);
    const arc = meta?.data?.[0];
    if (!arc) return;

    // Chart.js menggambar segmen dengan radius + spacing/2 (lihat ArcElement.draw), jadi track
    // harus memakai radius yang sama agar sejajar dengan segmen.
    const shift = (arc.options?.spacing || 0) / 2;
    const outer = arc.outerRadius + shift;
    const inner = arc.innerRadius + shift;
    const { ctx } = chart;
    const radius = (outer + inner) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(arc.x, arc.y, radius, 0, Math.PI * 2);
    ctx.lineWidth = outer - inner;
    ctx.strokeStyle = options.color;
    ctx.stroke();
    ctx.restore();
  },
};
ChartJS.register(donutTrack);

// Segmen yang dipencet keluar dari pusat sepanjang sudut tengahnya (radial translation).
// Irisan aktif digambar ulang oleh plugin dengan geseran dx/dy, bukan lewat offset Chart.js,
// sehingga ukuran dan ketebalan donat tidak ikut berubah.
const DONUT_POP = 6;

// Chart.js hanya dipakai untuk geometri dan klik (warna arc dibuat transparan).
// Semua irisan digambar ulang oleh plugin ini memakai index yang sama dengan data, warna, dan label,
// sehingga index klik, warna, dan posisi label selalu cocok. Irisan aktif digeser sepanjang mid-angle-nya.
const donutExplode = {
  id: "donutExplode",
  afterDatasetsDraw(chart, _args, options) {
    const colors = options?.colors;
    if (!colors) return;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0].data;
    const total = values.reduce((sum, value) => sum + value, 0);
    const pops = chart.$donutPops || [];
    const { ctx } = chart;
    ctx.save();
    values.forEach((value, i) => {
      const arc = meta.data[i];
      if (!arc || !value) return;
      const mid = (arc.startAngle + arc.endAngle) / 2;
      const pop = pops[i] || 0;
      const dx = Math.cos(mid) * pop;
      const dy = Math.sin(mid) * pop;
      ctx.beginPath();
      ctx.arc(arc.x + dx, arc.y + dy, arc.outerRadius, arc.startAngle, arc.endAngle);
      ctx.arc(arc.x + dx, arc.y + dy, arc.innerRadius, arc.endAngle, arc.startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      const r = (arc.innerRadius + arc.outerRadius) / 2;
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${Math.round((value / total) * 100)}%`, arc.x + dx + Math.cos(mid) * r, arc.y + dy + Math.sin(mid) * r);
    });
    ctx.restore();
  },
};

function tweenDonutPop(chart, next) {
  const count = chart.data.datasets[0].data.length;
  const from = chart.$donutPops || Array(count).fill(0);
  const to = Array.from({ length: count }, (_, i) => (i === next ? DONUT_POP : 0));
  const start = performance.now();
  cancelAnimationFrame(chart.$donutRaf);
  const step = (now) => {
    const t = Math.min(1, (now - start) / 300);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out
    chart.$donutPops = from.map((v, i) => v + (to[i] - v) * e);
    chart.draw();
    if (t < 1) chart.$donutRaf = requestAnimationFrame(step);
  };
  chart.$donutRaf = requestAnimationFrame(step);
}

function donutPopClick(_event, elements, chart) {
  const index = elements.length ? elements[0].index : null;
  const current = chart.$donutActive ?? null;
  const next = index === current ? null : index;
  chart.$donutActive = next;
  tweenDonutPop(chart, next);
}

ChartJS.defaults.color = "#b3a4a7";
ChartJS.defaults.font.family = "Plus Jakarta Sans, Inter, system-ui, sans-serif";

// =====================================================
// DESIGN TOKENS (sama dengan MarketingPerformance)
// =====================================================

const GLASS =
  "rounded-[22px] border border-white/[0.07] bg-[#121212] shadow-[0_12px_32px_-20px_rgba(0,0,0,0.9)]";
const INNER = "rounded-xl border border-white/[0.06] bg-white/[0.025]";
const TILE = "rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors duration-200 hover:border-white/[0.14]";

// Skala ukuran font untuk halaman ini:
// 10 (meta/caps) · 11 (caption) · 12 (label) · 13 (body/judul kecil) · 15 (judul kartu) · 16 (nilai kecil) · 20+ (angka utama)

// =====================================================
// CHART HELPERS
// =====================================================

// Gradasi vertikal untuk batang, mengikuti area chart yang sebenarnya.
const barGradient = (top, bottom) => (context) => {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return bottom;
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, bottom);
  gradient.addColorStop(1, top);
  return gradient;
};

// Warna segmen donut Team Scorecards: [atas, bawah] untuk tiap titik data
const TEAM_SEGMENTS = [
  { normal: ["#FFFFFF", "#A9A0A6"], hover: ["#FFFFFF", "#C4BCC1"] },
  { normal: ["#E04848", "#8F1A1A"], hover: ["#FFB8B8", "#A21E1E"] },
  { normal: null, hover: null },
];

function teamSegmentFill(context, hover) {
  const segment = TEAM_SEGMENTS[context.dataIndex];
  const colors = segment && (hover ? segment.hover : segment.normal);
  if (!colors) return hover ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.12)";
  return barGradient(colors[0], colors[1])(context);
}

const compactNumber = (value) => Number(value).toLocaleString("en-US");

const tooltipStyle = {
  backgroundColor: "rgba(28,28,30,0.96)",
  titleColor: "#ffffff",
  bodyColor: "#d4d4d8",
  borderColor: "rgba(255,255,255,0.08)",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  boxPadding: 4,
  displayColors: true,
  usePointStyle: true,
  titleFont: { size: 11, weight: "600" },
  bodyFont: { size: 11 },
  caretSize: 0,
  caretPadding: 8,
};

const barRadius = { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 };

// 12 titik data = 12 bulan berurutan (Jan–Des), setiap batang diberi label bulan.
const socialLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const socialData = {
  impressions: {
    target: [1460, 1770, 2220, 2480, 2600, 2220, 2830, 2710, 2470, 2830, 1770, 230],
    actual: [1900, 1970, 2790, 3520, 3110, 3560, 3870, 3110, 2070, 2290, 3650, 230],
  },
  reach: {
    target: [900, 1100, 1500, 1700, 1800, 1500, 2000, 1900, 1700, 2000, 1200, 150],
    actual: [1200, 1300, 1900, 2400, 2100, 2500, 2700, 2200, 1400, 1600, 2500, 150],
  },
  engagement: {
    target: [300, 400, 600, 700, 800, 600, 900, 800, 700, 900, 500, 60],
    actual: [420, 450, 800, 1000, 900, 1100, 1200, 900, 600, 700, 1100, 60],
  },
  posts: {
    target: [10, 12, 14, 15, 16, 14, 18, 17, 15, 18, 12, 3],
    actual: [12, 13, 17, 20, 18, 21, 22, 18, 13, 14, 21, 3],
  },
};

const inventoryItems = [
  { name: "Tumler", status: "low", label: "Low stock · 2 short", meta: "Smatt 123 · Warehouse Manager · Rp 1.500.000", qty: 1, max: 5 },
  { name: "Java bottle", status: "normal", label: "Normal", meta: "SKU123 · Warehouse Manager", qty: 4, max: 5 },
  { name: "Light bulb", status: "normal", label: "Normal", meta: "bulb 123 ·Warehouse Manager", qty: 4, max: 5 },
];

const assistantPrompts = ["Summarize marketing KPIs", "Plan content for next week", "Check low-stock inventory", "Draft a team update"];
const assistantReplies = {
  "Summarize marketing KPIs": "Demo summary: Cost per lead is 63 (under target), registrations are at 94% of target, and cost per acquisition needs attention.",
  "Plan content for next week": "Demo plan: 2 Instagram reels on Monday and Thursday, 1 TikTok short on Wednesday, and a carousel post on Saturday.",
  "Check low-stock inventory": "Demo check: Tumbler (2 left) and Light bulb (4 left) are below their reorder level.",
  "Draft a team update": "Demo draft: \"Hi team, this week we focused on Q4 campaign shoots and closed 2 pending reviews. Next week: publish the October teasers.\"",
};
const promoNames = ["Alfian", "Putri", "Louie", "Justin", "Alvin", "Gusti"];
const promoInstagram = [70, 85, 58, 74, 80, 96];
const promoTiktok = [90, 108, 102, 65, 80, 112];


const money = (value) => `Rp ${Number(value).toLocaleString("id-ID")}`;

function Panel({ children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-2xl p-4 md:p-5 ${GLASS} ${className}`}>
      {children}
    </section>
  );
}

function StatusBadge({ children, tone = "warn" }) {
  const tones = {
    warn: "bg-amber-300/10 text-amber-300 ring-amber-300/25",
    ok: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  };
  return (
    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function IconTile({ children, muted = false }) {
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white ${muted ? "bg-white/[0.05]" : "bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04]"}`}>
      {children}
    </span>
  );
}

function CardHeading({ icon, title, status, tone = "warn", to }) {
  return (
    <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <IconTile>{icon}</IconTile>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-white">{title}</h2>
          {status && <StatusBadge tone={tone}>{status}</StatusBadge>}
        </div>
      </div>
      {to && (
        <Link to={to} aria-label={`Open ${title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white transition hover:translate-x-0.5 hover:border-white/30 hover:bg-white/10">
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 p-3 ${TILE}`}>
      <IconTile muted>{icon}</IconTile>

      <div className="min-w-0">
        <p className="text-[11px] leading-tight text-white/55">{label}</p>
        <p className="mt-0.5 text-lg font-semibold leading-tight tabular-nums text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, alert = false, suffix }) {
  return (
    <div className={`relative min-w-0 rounded-xl border p-3 ${
      alert
        ? "border-[#B82323]/30 bg-[#A21E1E]/10"
        : "border-white/[0.07] bg-black/35"
    }`}>
      {alert && (
        <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#C42B2B]" />
      )}

      <p className="text-[11px] leading-tight text-white/55">{label}</p>

      <p className={`mt-1 text-base font-semibold tabular-nums ${
        alert ? "text-[#D98A8A]" : "text-white"
      }`}>
        {value}
        {suffix && (
          <span className="ml-1 text-[11px] font-medium text-white/55">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

// Dropdown kustom bergaya kaca gelap (pengganti <select> bawaan browser yang popup-nya putih)
function GlassSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 min-w-[136px] items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.05] pl-3 pr-2.5 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-white/20 hover:bg-white/[0.08] focus:border-[#B82323]/60"
      >
        {value}
        <ChevronDown
          size={13}
          className={`text-white/55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-full min-w-[136px] overflow-hidden rounded-xl border border-white/10 bg-[#1a0d10]/95 p-1 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.85),0_0_24px_-8px_rgba(162,30,30,0.35)] backdrop-blur-xl"
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition ${
                    selected
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {option}
                  {selected && <Check size={12} className="text-[#E04848]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Overview() {
  const [socialMetric, setSocialMetric] = useState("impressions");
  const [socialPlatform, setSocialPlatform] = useState("Instagram");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantChat, setAssistantChat] = useState([]);

  // Simulasi balasan AI Assistant (tanpa backend)
  function askAssistant(text) {
    const question = text.trim();
    if (!question) return;
    const reply = assistantReplies[question] || `Simulated answer for "${question}": this is a demo response, so no live data is connected yet.`;
    setAssistantChat((chat) => [...chat, { role: "user", text: question }, { role: "ai", text: reply }]);
    setAssistantInput("");
  }

  // Segmen yang dipilih (null = tampilkan Total).
  const [marketingSel, setMarketingSel] = useState(null);

  const marketingChart = useMemo(() => ({
    labels: ["On Target", "Under 90%", "Not Scored"],
    datasets: [{
      data: [5, 1, 11],
      // Warna asli dipegang plugin donutExplode; arc Chart.js dibuat transparan agar tidak tergambar dua kali.
      backgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"],
      hoverBackgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"],
      borderWidth: 0,
      borderRadius: 0,
      spacing: 0,
      hoverOffset: 0,
    }],
  }), []);

  const socialChart = useMemo(() => ({
    labels: socialLabels,
    datasets: [
      {
        label: "Target",
        data: socialData[socialMetric].target,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: "rgba(255,255,255,0.32)",
        borderWidth: 1,
        borderRadius: barRadius,
        borderSkipped: false,
        barPercentage: 0.82,
        categoryPercentage: 0.78,
        order: 2,
      },
      {
        label: "Actual",
        data: socialData[socialMetric].actual,
        backgroundColor: barGradient("#C42B2B", "#8F2028"),
        hoverBackgroundColor: barGradient("#E04848", "#A21E1E"),
        borderRadius: barRadius,
        borderSkipped: false,
        barPercentage: 0.82,
        categoryPercentage: 0.78,
        order: 1,
      },
    ],
  }), [socialMetric]);

  const socialOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items) => (items[0] ? socialLabels[items[0].dataIndex] || `Period ${items[0].dataIndex + 1}` : ""),
          label: (context) => ` ${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("id-ID")}`,
          afterBody: (items) => {
            const index = items[0]?.dataIndex;
            if (index === undefined) return "";
            const { target, actual } = socialData[socialMetric];
            if (!target[index]) return "";
            const achievement = Math.round((actual[index] / target[index]) * 100);
            return `Achievement: ${achievement}% of target`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#b3a4a7", autoSkip: false, maxRotation: 0, font: { size: 10 }, padding: 6 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,.06)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#b3a4a7",
          padding: 8,
          font: { size: 10 },
          stepSize: socialMetric === "posts" ? 5 : 500,
          callback: (value) => (socialMetric === "posts" ? value : value === 0 ? "0" : compactNumber(value)),
        },
      },
    },
  }), [socialMetric]);

  const promoChart = useMemo(() => ({
    labels: promoNames,
    datasets: [
      {
        label: "Instagram",
        data: promoInstagram,
        backgroundColor: barGradient("#C42B2B", "#8F2028"),
        hoverBackgroundColor: barGradient("#E04848", "#A21E1E"),
        borderRadius: barRadius,
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.6,
      },
      {
        label: "TikTok",
        data: promoTiktok,
        backgroundColor: barGradient("#4B4B4B", "#0A0A0A"),
        hoverBackgroundColor: barGradient("#6B6B6B", "#161616"),
        borderRadius: barRadius,
        borderSkipped: false,
        barPercentage: 0.8,
        categoryPercentage: 0.6,
      },
    ],
  }), []);

  const promoOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#b3a4a7", font: { size: 10 }, padding: 6 },
      },
      y: { display: false, beginAtZero: true },
    },
  };

  const teamChart = {
    labels: ["People on track", "Below 80%", "Awaiting review"],
    datasets: [{
      data: [8, 2, 2],
      // Gradasi halus per segmen (fungsi per titik data, bukan array fungsi)
      backgroundColor: (context) => teamSegmentFill(context, false),
      hoverBackgroundColor: (context) => teamSegmentFill(context, true),
      borderWidth: 0,
      borderRadius: 12,
      spacing: 6,
      hoverOffset: 0,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    rotation: -90,
    animation: { duration: 800, easing: "easeOutQuart" },
    plugins: {
      donutTrack: { color: "rgba(255,255,255,0.07)" },
      legend: { display: false },
      tooltip: {
        enabled: false,
        ...tooltipStyle,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
            const pct = Math.round((context.parsed / total) * 100);
            return ` ${context.label}: ${context.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  // Donat solid dengan label persen di tiap irisan (gaya diagram donat standar).
  const marketingDonutOptions = useMemo(() => ({
    ...donutOptions,
    cutout: "72%",
    // Ruang tambahan di sekitar lingkaran agar segmen yang keluar tidak terpotong canvas.
    layout: { padding: 6 },
    plugins: {
      ...donutOptions.plugins,
      donutExplode: { colors: ["#B82323", "#E04848", "#6E686F"] },
    },
    onClick: (event, elements, chart) => {
      donutPopClick(event, elements, chart);
      const index = elements.length ? elements[0].index : null;
      setMarketingSel((prev) => (index === null || index === prev ? null : index));
    },
  }), []);

  const teamOptions = {
    ...donutOptions,
    rotation: -110,
    circumference: 220,
    cutout: "76%",
  };

  return (
    <div className="ov-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .ov-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .ov-root article, .ov-root .ov-link { transition: transform .22s ease, border-color .22s ease, background-color .22s ease; }
        .ov-root button, .ov-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .ov-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none px-3 sm:px-4 md:px-4 lg:px-5">
        <header className="mb-5">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Overview</h1>
          <p className="mt-1.5 text-xs text-white/55">Monitor marketing performance and key metrics.</p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel className="flex flex-col">
            <CardHeading icon={<BarChart3 size={17} />} title="Marketing Performance" status="Need Attention" to="/marketing-performance" />
            <div className="flex flex-1 flex-col items-center justify-center gap-5">
              <div className="relative h-[202px] w-[202px] shrink-0 drop-shadow-[0_10px_26px_rgba(162,30,30,0.3)]">
                <Doughnut data={marketingChart} options={marketingDonutOptions} plugins={[donutExplode]} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  {marketingSel === null ? (
                    <>
                      <span className="text-[12px] text-white/50">Total</span>
                      <b className="mt-0.5 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-white">17</b>
                    </>
                  ) : (
                    <>
                      <span className="max-w-[90px] truncate text-center text-[11px] text-white/55">{marketingChart.labels[marketingSel]}</span>
                      <b className="mt-0.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-white">
                        {Math.round((marketingChart.datasets[0].data[marketingSel] / 17) * 100)}%
                      </b>
                      <span className="mt-1 text-[11px] tabular-nums text-white/55">
                        {marketingChart.datasets[0].data[marketingSel]} dari 17
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl border border-white/[0.07] bg-black/30 px-2 py-2">
                  <span className="flex items-center justify-center gap-1.5 whitespace-nowrap text-white/55"><i className="h-2 w-2 rounded-full bg-[#B82323]" />On Target</span>
                  <b className="mt-1 block text-[14px] font-semibold tabular-nums text-white">5</b>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/30 px-2 py-2">
                  <span className="flex items-center justify-center gap-1.5 whitespace-nowrap text-white/55"><i className="h-2 w-2 rounded-full bg-[#E04848]" />Under 90%</span>
                  <b className="mt-1 block text-[14px] font-semibold tabular-nums text-white">1</b>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-black/30 px-2 py-2">
                  <span className="flex items-center justify-center gap-1.5 whitespace-nowrap text-white/55"><i className="h-2 w-2 rounded-full bg-[#6E686F]" />Not Scored</span>
                  <b className="mt-1 block text-[14px] font-semibold tabular-nums text-white">11</b>
                </div>
              </div>

              {/* Metrik yang perlu perhatian (dari halaman Marketing Performance) */}
              <div className="w-full">
                <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Needs attention</p>
                <ul className="space-y-2.5">
                  {[
                    ["Cost Per Lead", 63],
                    ["Cost Per Acquisition", 58],
                    ["Registrations", 94],
                  ].map(([label, pct]) => (
                    <li key={label}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-white/65">{label}</span>
                        <span className="tabular-nums text-white/85">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col">
            <CardHeading icon={<CalendarDays size={17} />} title="Content Calendar" status="On Track" tone="ok" to="/content-calendar" />
            <div className="grid grid-cols-2 gap-2.5">
              <StatTile icon={<Layers size={15} />} label="In the Pipeline" value="13" />
              <StatTile icon={<Eye size={15} />} label="In Review" value="0" />
              <StatTile icon={<CheckCircle2 size={15} />} label="Approved" value="0" />
              <StatTile icon={<CalendarDays size={15} />} label="Published" value="1" />
            </div>

            {/* Bar tahap pipeline */}
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 p-3.5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/55">
                <span>Pipeline stages</span>
                <span className="tabular-nums text-white/75">14 total</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B]" style={{ width: "92.9%" }} />
                <div className="h-full bg-emerald-400" style={{ width: "7.1%" }} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/55">
                <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#C42B2B]" />In pipeline 13</span>
                <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Published 1</span>
              </div>
            </div>

            {/* Upcoming */}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Upcoming</p>
              <ul className="space-y-1.5">
                {[
                  ["16 Oct", "October Teaser Series", "Bella"],
                  ["17 Oct", "Analyst Interview Rupiah Outlook", "Jason"],
                  ["24 Oct", "project dashboard", "Reinhart"],
                ].map(([date, title, owner]) => (
                  <li key={title} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                    <span className="grid h-7 w-12 shrink-0 place-items-center rounded-md bg-[#A21E1E]/15 text-[10px] font-semibold text-[#E04848]">{date}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-white/85">{title}</span>
                    <span className="shrink-0 text-[11px] text-white/45">{owner}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/content-calendar"
              className="mt-auto flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2 text-[12px] font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              View all content
              <ArrowRight size={14} />
            </Link>
          </Panel>

          <Panel className="flex flex-col">
            <CardHeading icon={<FolderOpen size={17} />} title="Project" status="Need Attention" to="/projects" />
            <div className="grid grid-cols-2 gap-2.5">
              <StatTile icon={<FolderOpen size={15} />} label="Open" value="21" />
              <StatTile icon={<CalendarX size={15} />} label="Past Deadline" value="1" />
              <StatTile icon={<CircleSlash size={15} />} label="Blocked" value="0" />
              <StatTile icon={<CheckCircle2 size={15} />} label="Done" value="34" />
            </div>

            {/* Proyek terbaru dan progresnya */}
            <div className="mt-4">
              <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Project progress</p>
              <ul className="space-y-2.5">
                {[
                  ["Test Notification", 8, 8],
                  ["Q3 Creative Refresh", 20, 20],
                  ["Test Colab", 1, 3],
                ].map(([name, done, total]) => {
                  const pct = Math.round((done / total) * 100);
                  return (
                    <li key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
                      <div className="mb-1.5 flex justify-between gap-2 text-[11px]">
                        <span className="truncate text-white/80">{name}</span>
                        <span className="shrink-0 tabular-nums text-white/60">{done}/{total}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Progres proyek */}
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 p-3.5">
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/55">
                <span>Completed</span>
                <span className="tabular-nums text-white/75">34 / 55 · 62%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B]" style={{ width: "62%" }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-white/45">Past deadline</span>
                <span className="rounded-full border border-[#B82323]/30 bg-[#A21E1E]/15 px-2 py-0.5 font-semibold text-[#E04848]">1 project</span>
              </div>
            </div>

            <Link
              to="/projects"
              className="mt-auto flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2 text-[12px] font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              View all projects
              <ArrowRight size={14} />
            </Link>
          </Panel>
        </div>

        <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <div className="contents">
            <Panel className="flex h-full flex-1 flex-col xl:col-span-2 xl:col-start-1 xl:row-start-1">
              <CardHeading icon={<BarChart3 size={17} />} title="Social Media" status="On Track" tone="ok" to="/social-media" />
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/55">
                  <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm border border-white/40 bg-white/10" />Target</span>
                  <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-[#B82323]" />Actual</span>
                </div>
                <GlassSelect
                  label="Platform"
                  value={socialPlatform}
                  options={["Instagram", "TikTok", "Facebook"]}
                  onChange={setSocialPlatform}
                />
              </div>
              <p className="mb-2 text-right text-[10px] text-white/40">Platform: {socialPlatform}</p>
              {/* Mobile: grafik digeser horizontal agar bar tidak terlalu rapat */}
              <div className="flex min-h-[150px] min-w-0 flex-1 flex-col overflow-x-auto overscroll-x-contain pb-1">
                <div className="relative min-h-0 flex-1 min-w-[600px] md:min-w-0">
                  <div className="absolute inset-0">
                    <Bar data={socialChart} options={socialOptions} />
                  </div>
                </div>
              </div>
              <div className={`mt-3 grid grid-cols-2 gap-1 p-1 sm:grid-cols-4 ${INNER}`}>
                {[
                  ["impressions", "Impressions"],
                  ["reach", "Reach"],
                  ["engagement", "Engagement"],
                  ["posts", "Posts"],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setSocialMetric(key)} className={`rounded-lg px-2 py-2 text-[11px] font-medium transition active:scale-[0.97] ${socialMetric === key ? "bg-[#C42428] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(196,36,40,0.7)]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Panel>

            <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 xl:col-span-2 xl:col-start-1 xl:row-start-2">
              <Panel>
                <CardHeading icon={<Package size={17} />} title="Inventory" status="Need Attention" to="/inventory" />
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricBox label="Products" value="4" />
                  <MetricBox label="Units on hand" value="99" />
                  <MetricBox label="Stock value" value={money(1500000)} />
                  <MetricBox label="To reorder" value="1" suffix="SKU" alert />
                </div>
                <div className="mb-2.5 mt-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-white">Merchandise Inventory</h3>
                  <span className="text-[11px] font-medium text-[#C42B2B]">1 Needs Reorder</span>
                </div>
                <div className="space-y-2">
                  {inventoryItems.map((item) => (
                    <div key={item.name} className={`flex items-center justify-between gap-3 p-2.5 transition hover:border-white/[0.16] ${INNER}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <b className="text-[13px] font-semibold text-white">{item.name}</b>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${item.status === "low" ? "bg-[#A21E1E]/20 text-[#E04848] ring-[#B82323]/30" : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"}`}>{item.label}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-white/55">{item.meta}</p>
                      </div>
                      <b className="shrink-0 text-base tabular-nums text-white">{item.qty}<span className="text-xs font-normal text-white/55"> / {item.max}</span></b>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="flex flex-col">
                <CardHeading icon={<Users size={17} />} title="Promoter" status="On Track" tone="ok" to="/promotors" />
                <div className="mb-3 grid grid-cols-2 gap-2.5">
                  <div className={`p-3 ${INNER}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">Active Sprint</p>
                    <b className="mt-1 block text-sm font-semibold text-white">Week 3</b>
                    <small className="text-[11px] text-white/55">7 - 14 September</small>
                  </div>
                  <div className={`p-3 ${INNER}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">Active Promoters</p>
                    <b className="mt-1 block text-sm font-semibold text-white">11 Members</b>
                    <small className="text-[11px] text-white/55">Alfian, Putri, Louie, +8</small>
                  </div>
                </div>
                <div className={`flex flex-1 flex-col p-3 ${INNER}`}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">Account Submissions &amp; Verification</p>
                  <div className="mt-2 flex justify-end gap-4 text-[11px] text-white/55">
                    <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-[#B82323]" />Instagram</span>
                    <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm bg-[#4B4B4B]" />TikTok</span>
                  </div>
                  <div className="mt-2 min-h-[200px] flex-1">
                    <Bar data={promoChart} options={promoOptions} />
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <div className="contents">
            <Panel className="flex flex-1 flex-col overflow-hidden xl:col-start-3 xl:row-start-1 bg-gradient-to-b from-[#A21E1E]/10 via-transparent to-transparent">
              <CardHeading icon={<Users size={17} />} title="Team Scorecards" status="Need Attention" to="/team-scorecards" />
              <div className="relative mx-auto h-[165px] w-full max-w-[260px] drop-shadow-[0_12px_28px_rgba(162,30,30,0.35)]">
                <Doughnut data={teamChart} options={teamOptions} />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-5">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Total</span>
                  <b className="mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-white">15</b>
                  <span className="mt-1.5 text-[11px] text-white/45">people scored</span>
                </div>
              </div>
              <hr className="my-5 border-white/[0.12]" />
              <h3 className="mb-3 text-[13px] font-semibold text-white">Team Overview</h3>
              {[
                { label: "People", count: "12/12", value: 100, color: "bg-gradient-to-r from-[#FFFFFF] to-[#A9A0A6]", pill: "bg-gradient-to-b from-[#FFFFFF] to-[#C4BCC1] text-black" },
                { label: "Below 80%", count: "2/12 People", value: 17, color: "bg-gradient-to-r from-[#E04848] to-[#8F1A1A]", pill: "bg-gradient-to-b from-[#E04848] to-[#8F1A1A] text-white" },
                { label: "Awaiting Review", count: "2/12 People", value: 17, color: "bg-white/[0.14]", pill: "bg-white/[0.12] text-white ring-1 ring-white/15" },
              ].map((item) => (
                <div key={item.label} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex justify-between gap-2 text-[11px] text-white/80"><span>{item.label}</span><span>{item.count}</span></div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} /></div>
                    <span className={`min-w-12 rounded-full px-2 py-0.5 text-center text-[10px] font-semibold ${item.pill}`}>{item.value}%</span>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel className="flex flex-col xl:col-start-3 xl:row-start-2 bg-gradient-to-b from-[#3b2a8a]/60 via-[#1b1550]/70 to-[#0b0a1d]/90">
              <CardHeading icon={<Settings size={17} />} title="System" status="Need Attention" />
              <div className="space-y-2">
                <Link to="/ai-assistant" className={`flex items-center gap-3 p-2.5 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.07] ${INNER}`}>
                  <IconTile muted><Terminal size={16} /></IconTile>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-white">AI Assistant<small className="block text-[10px] font-normal text-white/55">AI Assistant</small></span>
                  <ArrowRight size={15} className="text-white/55" />
                </Link>
                <Link to="/agent-office" className={`flex items-center gap-3 p-2.5 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.07] ${INNER}`}>
                  <IconTile muted><Bot size={16} /></IconTile>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-white">Agent Office<small className="block text-[10px] font-normal text-white/55">AI Assistant</small></span>
                  <ArrowRight size={15} className="text-white/55" />
                </Link>
                <Link to="/integrations" className={`flex items-center gap-3 p-2.5 transition hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.07] ${INNER}`}>
                  <IconTile muted><RefreshCw size={16} /></IconTile>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-white">Integrations<small className="block text-[10px] font-normal text-white/55">AI Assistant</small></span>
                  <ArrowRight size={15} className="text-white/55" />
                </Link>
              </div>
              <div className="mt-6 flex flex-1 flex-col justify-end">
                <p className="mb-3 text-center text-[15px] font-semibold leading-snug text-white">What can AI Assistant help with?</p>

                {assistantChat.length > 0 && (
                  <div className="mb-3 max-h-[160px] space-y-2 overflow-y-auto pr-1">
                    {assistantChat.map((message, index) => (
                      <p
                        key={index}
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${
                          message.role === "user"
                            ? "ml-auto bg-[#3b2a8a]/70 text-white"
                            : "border border-white/10 bg-white/[0.06] text-white/85"
                        }`}
                      >
                        {message.text}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mb-4 flex flex-wrap justify-center gap-2">
                  {assistantPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => askAssistant(prompt)}
                      className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[12px] text-white/85 transition hover:border-white/30 hover:bg-white/[0.14] hover:text-white active:scale-[0.97]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    askAssistant(assistantInput);
                  }}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] py-1.5 pl-4 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <input
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    placeholder="Ask anything..."
                    aria-label="Ask AI Assistant"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#C42428] to-[#9E1B1F] text-white transition hover:brightness-110 active:scale-[0.97]"
                  >
                    <ArrowRight size={15} />
                  </button>
                </form>
              </div>            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
