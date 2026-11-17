import { useState } from "react";
import GlassSelect from "../components/ui/GlassSelect";
import MonthPicker from "../components/ui/MonthPicker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import {
  InstagramLogo,
  TikTokLogo,
  YouTubeLogo,
  FacebookLogo,
  XLogo,
} from "../components/icons/SocialLogos";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Eye,
  Heart,
  Info,
  Link2,
  Lock,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  Plus,
  RotateCcw,
  Users,
  X,
} from "lucide-react";

// Desain token sama dengan Overview, MarketingPerformance & MyWork
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const TILE =
  "rounded-xl border border-white/[0.08] bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
const PILL_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";

const months = [
  "October 2026",
  "September 2026",
  "August 2026",
  "July 2026",
];

const initialKpis = [
  { label: "Audience", value: "100.480", delta: "+4.2%", icon: Users },
  { label: "Impression", value: "1.764.000", delta: "+6.1%", icon: Eye },
  { label: "Engagement", value: "5.47%", delta: "+0.8%", icon: TrendingUp },
];

const channels = [
  {
    name: "Instagram",
    handle: "@javafx.id",
    tracked: true,
    audience: "50.540",
    growth: "+3.8%",
    stats: { Impressions: "1.764.000", Reach: "482.300", Engagement: "38.910", Post: "24" },
    Logo: InstagramLogo,
  },
  {
    name: "TikTok",
    handle: "@javafx.id",
    tracked: true,
    audience: "36.260",
    growth: "+7.9%",
    stats: { Impressions: "2.315.000", Reach: "611.800", Engagement: "52.440", Post: "18" },
    Logo: TikTokLogo,
  },
  {
    name: "Youtube",
    handle: "@JavaFxOfficial",
    tracked: true,
    audience: "13.680",
    growth: "+4.0%",
    stats: { Impressions: "642.000", Reach: "198.500", Engagement: "16.250", Post: "9" },
    Logo: YouTubeLogo,
  },
  {
    name: "Facebook",
    tracked: false,
    kind: "Page",
    example: "https://facebook.com",
    Logo: FacebookLogo,
  },
  {
    name: "X",
    tracked: false,
    kind: "profile",
    example: "https://x.com",
    Logo: XLogo,
  },
];

const metrics = [
  { label: "Impressions", icon: Eye },
  { label: "Reach", icon: BarChart3 },
  { label: "Engagement", icon: Heart },
  { label: "Post", icon: MessageCircle },
];

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

// Tren metrik per channel (data demo, Jan–Okt 2026). Bulan terakhir sama dengan angka di kartu channel.
// Setiap seri naik pelan tetapi bergelombang (naik-turun) supaya kurvanya tidak lurus.
const waveMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const metricOrder = ["Impressions", "Reach", "Engagement", "Post"];
const octoberBase = {
  Impressions: { Instagram: 1764000, TikTok: 2315000, YouTube: 642000 },
  Reach: { Instagram: 482300, TikTok: 611800, YouTube: 198500 },
  Engagement: { Instagram: 38910, TikTok: 52440, YouTube: 16250 },
  Post: { Instagram: 24, TikTok: 18, YouTube: 9 },
};

function buildWaveSeries(base, metricIndex, channelIndex) {
  const last = waveMonths.length - 1;
  return waveMonths.map((_, i) => {
    if (i === last) return base;
    const trend = 0.55 + 0.45 * (i / last);
    const wobble =
      0.17 * Math.sin(i * 1.25 + metricIndex * 0.9 + channelIndex * 1.6) +
      0.06 * Math.sin(i * 2.7 + channelIndex);
    return Math.max(1, Math.round(base * (trend + wobble)));
  });
}

const metricTrend = Object.fromEntries(
  metricOrder.map((metric, mi) => [
    metric,
    Object.fromEntries(
      Object.keys(octoberBase[metric]).map((channel, ci) => [
        channel,
        buildWaveSeries(octoberBase[metric][channel], mi, ci),
      ])
    ),
  ])
);

const formatNumber = (value) => Number(value).toLocaleString("id-ID");

const compactNumber = (value, digits = 1) => {
  const n = Number(value);
  if (Math.abs(n) >= 1e6) return `${Number((n / 1e6).toFixed(digits))}M`;
  if (Math.abs(n) >= 1e3) return `${Number((n / 1e3).toFixed(digits))}K`;
  return String(n);
};

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

// Opasitas atas area gradasi per channel (memudar ke transparan di bawah)
const fillTopAlpha = { Instagram: 0.36, TikTok: 0.22, YouTube: 0.22 };

// Gradasi halus tanpa tingkatan: alpha menurun mengikuti kurva (ease), mendekati 0% di dasar chart
const GRADIENT_STOPS = [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1];

// Garis vertikal penunjuk di titik yang di-hover (netral, memudar ke bawah)
const trendHoverLine = {
  id: "trendHoverLine",
  beforeDatasetsDraw(chart) {
    const active = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
    if (!active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.30)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.03)");
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = gradient;
    ctx.stroke();
    ctx.restore();
  },
};

// Tooltip ringkas: bulan di atas, lalu nama channel (kiri) dan nilai (kanan).
// Diletakkan di samping garis penunjuk dan selalu berada di dalam area chart.
function trendTooltip(context) {
  const { chart, tooltip } = context;
  const parent = chart.canvas.parentNode;
  let el = parent.querySelector(".trend-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "trend-tooltip";
    el.style.cssText =
      "position:absolute;pointer-events:none;z-index:20;opacity:0;transition:opacity .12s ease;background:#151517;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 10px;box-shadow:0 10px 24px -12px rgba(0,0,0,0.85);white-space:nowrap;min-width:128px;";
    parent.appendChild(el);
  }
  if (tooltip.opacity === 0) {
    el.style.opacity = "0";
    return;
  }
  const points = tooltip.dataPoints || [];
  const month = tooltip.title && tooltip.title[0] ? tooltip.title[0] : "";
  el.innerHTML =
    `<div style="margin-bottom:5px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,0.45)">${month} 2026</div>` +
    points
      .map(
        (p) =>
          `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:12px;line-height:1.55"><span style="display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.72)"><i style="display:inline-block;flex:none;width:8px;height:8px;border-radius:9999px;background:${p.dataset.borderColor}"></i>${p.dataset.label}</span><b style="font-weight:600;color:#fff;font-variant-numeric:tabular-nums">${formatNumber(p.parsed.y)}</b></div>`
      )
      .join("");
  const w = el.offsetWidth;
  const gap = 12;
  const fitsRight = tooltip.caretX + gap + w <= chart.width;
  const rawLeft = fitsRight ? tooltip.caretX + gap : tooltip.caretX - gap - w;
  const left = Math.min(Math.max(rawLeft, 0), Math.max(0, chart.width - w));
  el.style.left = `${left}px`;
  el.style.top = `${chart.chartArea.top + 4}px`;
  el.style.opacity = "1";
}

// Data audiens bulanan per channel (mock, Jun–Oct 2026)
const trendMonths = ["Jun", "Jul", "Aug", "Sep", "Oct"];
const trendData = {
  Instagram: [44200, 45800, 47300, 48900, 50540],
  TikTok: [28100, 30400, 32600, 34300, 36260],
  YouTube: [11200, 11900, 12500, 13100, 13680],
};
const channelColors = {
  Instagram: "#B82323",
  TikTok: "#F3E9EB",
  YouTube: "#8d8790",
};

// Gradasi halus per batang (atas lebih terang), mengikuti tinggi tiap batang
const channelGradients = {
  Instagram: ["#D63A3A", "#8F1A1A"],
  TikTok: ["#FFFFFF", "#CDBFC3"],
  YouTube: ["#A8A2AB", "#6A646E"],
};

const barGradientFill = (name) => (context) => {
  const { chart, element } = context;
  if (!element) return channelColors[name];
  const { y, base } = element.getProps(["y", "base"], true);
  if (y === undefined || base === undefined || y === base) return channelColors[name];
  const gradient = chart.ctx.createLinearGradient(0, y, 0, base);
  gradient.addColorStop(0, channelGradients[name][0]);
  gradient.addColorStop(1, channelGradients[name][1]);
  return gradient;
};

// Menampilkan nilai di atas setiap batang agar mudah dibaca
const barValueLabels = {
  id: "barValueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    const barCount = chart.data.datasets.length * chart.data.labels.length;
    ctx.font = `600 ${barCount > 9 ? 10 : 12}px 'Plus Jakarta Sans', Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#ffffff";
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, j) => {
        const value = dataset.data[j];
        if (value == null) return;
        ctx.fillText(Number(value).toLocaleString("id-ID"), bar.x, bar.y - 8);
      });
    });
    ctx.restore();
  },
};

export default function SocialMedia() {
  const [selectedMonth, setSelectedMonth] = useState("October 2026");
  const [modalChannel, setModalChannel] = useState(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [hoverIndex, setHoverIndex] = useState(null);
  // Perbandingan periode custom (gaya Marketing Performance)
  const [compareMonths, setCompareMonths] = useState(["Jun", "Oct"]);
  const [otherMonth, setOtherMonth] = useState("2026-10");

  const monthByNumber = { "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct" };
  const otherMonthLabel = monthByNumber[otherMonth.slice(5, 7)] || "Jun";

  const selectedMonths = trendMonths.filter((m) => compareMonths.includes(m));
  const rangeValid = selectedMonths.length >= 2;
  // Grafik mengikuti bulan yang dipilih; jika tidak ada yang berdata, tampilkan bulan terbaru
  const noDataSelected = compareMonths.length > 0 && selectedMonths.length === 0;
  const chartMonths = selectedMonths.length > 0 ? selectedMonths : [trendMonths[trendMonths.length - 1]];
  const chartIdxs = chartMonths.map((m) => trendMonths.indexOf(m));
  const lastChartIdx = chartIdxs[chartIdxs.length - 1];
  const activeIdx = hoverIndex !== null && chartIdxs.includes(hoverIndex) ? hoverIndex : lastChartIdx;

  const addCompareMonth = () => {
    if (!compareMonths.includes(otherMonthLabel)) {
      setCompareMonths([...compareMonths, otherMonthLabel]);
    }
  };

  const toggleCompareMonth = (month) => {
    setCompareMonths((current) =>
      current.includes(month) ? current.filter((m) => m !== month) : [...current, month]
    );
  };

  // Reset mengosongkan semua centang
  const resetCompare = () => {
    setCompareMonths([]);
    setOtherMonth("2026-10");
  };

  // Chart batang; nilai di-hover ditampilkan di panel di atas grafik, bukan tooltip yang menutupi batang
  const trendChart = {
    // Hanya bulan yang dipilih yang ditampilkan
    labels: chartMonths,
    datasets: Object.keys(trendData).map((name) => ({
      label: name,
      data: chartIdxs.map((i) => trendData[name][i]),
      backgroundColor: barGradientFill(name),
      hoverBackgroundColor: barGradientFill(name),
      borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barPercentage: 0.9,
      categoryPercentage: 0.62,
      maxBarThickness: 96,
    })),
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    layout: { padding: { top: 28 } },
    interaction: { mode: "index", intersect: false },
    onClick: (_event, elements) => setHoverIndex(elements.length ? chartIdxs[elements[0].index] : null),
    plugins: {
      legend: { display: false },
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
        grid: { color: "rgba(255,255,255,0.05)", borderDash: [4, 4] },
        border: { display: false },
        ticks: {
          color: "#b3a4a7",
          font: { size: 10 },
          maxTicksLimit: 6,
          padding: 8,
          callback: (value) => Number(value).toLocaleString("en-US"),
        },
      },
    },
  };

  // ----- Performance trend: metrik per channel pada rentang bulan -----
  const [trendMetric, setTrendMetric] = useState("Impressions");
  const [rangeFrom, setRangeFrom] = useState("Jan");
  const [rangeTo, setRangeTo] = useState("Oct");
  const [hiddenChannels, setHiddenChannels] = useState([]);

  const monthChoices = waveMonths.map((m) => ({ value: m, label: `${m} 2026` }));
  const lastMonth = waveMonths[waveMonths.length - 1];
  const threeMonthsAgo = waveMonths[Math.max(0, waveMonths.length - 3)];
  const sixMonthsAgo = waveMonths[Math.max(0, waveMonths.length - 6)];

  // Rentang selalu valid: bulan awal tidak boleh melewati bulan akhir
  const changeRangeFrom = (value) => {
    setRangeFrom(value);
    if (waveMonths.indexOf(value) > waveMonths.indexOf(rangeTo)) setRangeTo(value);
  };
  const changeRangeTo = (value) => {
    setRangeTo(value);
    if (waveMonths.indexOf(value) < waveMonths.indexOf(rangeFrom)) setRangeFrom(value);
  };
  const applyQuickRange = (from, to) => {
    setRangeFrom(from);
    setRangeTo(to);
  };
  const toggleChannel = (name) =>
    setHiddenChannels((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name]
    );

  const fromIdx = waveMonths.indexOf(rangeFrom);
  const toIdx = waveMonths.indexOf(rangeTo);
  const rangeMonths = waveMonths.slice(fromIdx, toIdx + 1);
  const channelNames = Object.keys(trendData);
  const rangeSeries = channelNames.map((name) => ({
    name,
    values: metricTrend[trendMetric][name].slice(fromIdx, toIdx + 1),
  }));
  const visibleSeries = rangeSeries.filter((s) => !hiddenChannels.includes(s.name));
  const sumValues = (values) => values.reduce((a, b) => a + b, 0);
  const rangeTotal = visibleSeries.reduce((sum, s) => sum + sumValues(s.values), 0);
  const firstTotal = visibleSeries.reduce((sum, s) => sum + s.values[0], 0);
  const lastTotal = visibleSeries.reduce((sum, s) => sum + s.values[s.values.length - 1], 0);
  const rangeChange =
    rangeMonths.length > 1 && firstTotal > 0 ? ((lastTotal - firstTotal) / firstTotal) * 100 : null;
  const topChannel = visibleSeries.length
    ? [...visibleSeries].sort((a, b) => sumValues(b.values) - sumValues(a.values))[0].name
    : null;

  const metricChart = {
    labels: rangeMonths,
    datasets: visibleSeries.map((s) => {
      const color = channelColors[s.name];
      const topAlpha = fillTopAlpha[s.name] ?? 0.14;
      return {
        label: s.name,
        data: s.values,
        // Order kecil digambar di depan: Instagram paling depan
        order: channelNames.indexOf(s.name),
        borderColor: color,
        // Ketebalan sama untuk semua channel, ujung dan sambungan garis membulat
        borderWidth: 2.25,
        borderCapStyle: "round",
        borderJoinStyle: "round",
        // Kurva bezier halus; tidak terlalu tajam
        tension: 0.38,
        fill: true,
        // Area di bawah garis: gradasi lembut yang makin transparan ke bawah
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return hexToRgba(color, topAlpha * 0.5);
          // Gradasi dimulai dari titik tertinggi garis channel ini, jadi warna paling terlihat tepat di bawah garis
          const yScale = chart.scales && chart.scales.y;
          const values = (context.dataset && context.dataset.data ? context.dataset.data : []).filter((v) => Number.isFinite(v));
          const peakY = yScale && values.length ? yScale.getPixelForValue(Math.max(...values)) : chartArea.top;
          const top = Number.isFinite(peakY) ? Math.min(Math.max(chartArea.top, peakY - 4), chartArea.bottom - 40) : chartArea.top;
          const gradient = ctx.createLinearGradient(0, top, 0, chartArea.bottom);
          GRADIENT_STOPS.forEach((t) => {
            gradient.addColorStop(t, hexToRgba(color, topAlpha * Math.pow(1 - t, 2)));
          });
          return gradient;
        },
        // Titik hanya muncul saat di-hover (atau jika hanya satu bulan)
        pointRadius: rangeMonths.length === 1 ? 4 : 0,
        pointBackgroundColor: color,
        pointBorderColor: "#0b0b0b",
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
      };
    }),
  };

  const metricOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 12, right: 12, bottom: 0, left: 0 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false, external: trendTooltip },
    },
    scales: {
      x: {
        // Beri ruang di kiri-kanan agar label bulan sejajar dengan titik data dan tidak terpotong
        offset: true,
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#8c8286",
          font: { size: 11, weight: "500" },
          padding: 10,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 14,
        },
      },
      y: {
        beginAtZero: true,
        // Grid horizontal sangat tipis dengan kontras rendah
        grid: { color: "rgba(255,255,255,0.045)", borderDash: [3, 5], drawTicks: false },
        border: { display: false },
        // Lebar gutter sumbu Y tetap agar angka selalu sejajar
        afterFit: (scale) => {
          scale.width = scale.chart.width < 420 ? 38 : 48;
        },
        ticks: {
          color: "#8c8286",
          font: { size: 10, weight: "500" },
          maxTicksLimit: 6,
          padding: 10,
          callback: (value) => compactNumber(value),
        },
      },
    },
  };

  const [connected, setConnected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jgf-social-connections") || "{}");
    } catch {
      return {};
    }
  });

  const period = selectedMonth;

  function openConnect(channel) {
    setModalChannel(channel);
    setLink(connected[channel.name] || "");
    setError("");
  }

  function closeModal() {
    setModalChannel(null);
    setLink("");
    setError("");
  }

  function handleConnect(e) {
    e.preventDefault();

    const value = link.trim();

    if (!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value)) {
      setError("Enter a valid link that starts with https://");
      return;
    }

    const updated = {
      ...connected,
      [modalChannel.name]: value,
    };

    setConnected(updated);
    localStorage.setItem("jgf-social-connections", JSON.stringify(updated));
    closeModal();
  }

  return (
    <div className="sm-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .sm-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .sm-root button, .sm-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .sm-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 lg:px-5">
        {/* Page Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Social Media</h1>
            <p className="mt-1.5 text-xs text-white/55">
              Growth by channel
            </p>
          </div>

        </div>

        {/* Attention Banner */}
        <div className="mb-5 flex min-h-10 py-2.5 md:h-10 md:py-0 items-center gap-2.5 rounded-xl border border-[#B82323]/25 bg-[#A21E1E]/10 px-3 text-[14px] md:text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <span className="grid h-7 w-7 max-md:h-9 max-md:w-9 shrink-0 place-items-center rounded-full bg-[#A21E1E]/30"><CircleAlert size={14} /></span>
          1 item needs attention
        </div>

        {/* CUSTOM PERIOD COMPARISON */}
        <section className={`mt-5 rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-white md:text-[15px]">Custom period comparison</h2>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              Demo data
            </span>
          </div>

          <div className={`p-3 md:p-4 ${INNER}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <p className="text-xs font-medium text-white/60">Select period</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium tabular-nums text-white/70">
                  {compareMonths.length} selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1.5 text-[11px] text-white/45 sm:inline-flex">
                  <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Has data
                </span>
                <button
                  type="button"
                  onClick={resetCompare}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 text-[12px] font-medium text-white/85 sm:h-7 sm:px-3 sm:text-[11px] transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]"
                >
                  <RotateCcw size={11} />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3.5 grid w-full grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => {
                const active = compareMonths.includes(month);
                const hasData = trendMonths.includes(month);

                return (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleCompareMonth(month)}
                    title={hasData ? undefined : "No data for this month yet"}
                    className={`relative flex h-12 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-xl border px-1 text-center transition duration-150 active:scale-[0.97] ${
                      active
                        ? "border-[#B82323]/70 bg-gradient-to-b from-[#A21E1E]/35 to-[#A21E1E]/15 text-white shadow-[0_6px_16px_-10px_rgba(196,36,40,0.7)]"
                        : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {active && <CheckCircle2 size={11} strokeWidth={2.25} className="absolute left-1.5 top-1.5 text-white" />}
                    {hasData && <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                    <span className="text-[12px] font-semibold leading-none">{month}</span>
                    <span className="text-[11px] leading-none text-white/45 sm:text-[10px]">2026</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50 sm:hidden">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Green dot = this month has data
            </p>
          </div>
        </section>

        {/* Performance Panel */}
        <section className={`mt-5 rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white md:text-[15px]">
                {period} performance
              </h2>
              <p className="mt-1 text-[12px] text-white/55">
                Audience, reach and engagement per channel.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {initialKpis.map((kpi) => {
                const Icon = kpi.icon;

                return (
                  <div
                    key={kpi.label}
                    className={`flex min-w-0 items-center gap-3 p-3 ${TILE}`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#B82323]/70 bg-white/[0.07] text-white/90 shadow-[0_0_14px_-3px_rgba(162,30,30,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-white/55 sm:text-[11px]">{kpi.label}</p>
                      <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums text-white sm:text-lg">
                        {kpi.value}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-300 sm:text-[11px]">
                        <ArrowUpRight size={11} className="mr-0.5 inline" />
                        {kpi.delta}
                        <span className="ml-1 text-white/50">
                          vs. prev month
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Channels */}
          <div className="flex flex-col gap-3 sm:-mx-1 sm:flex-row sm:snap-x sm:snap-mandatory sm:overflow-x-auto sm:px-1 sm:pb-3 sm:[scrollbar-width:thin]">
            {channels.map((channel) => {
              const isConnected = Boolean(connected[channel.name]);
              const tracked = channel.tracked || isConnected;

              return (
                <div
                  key={channel.name}
                  className={`flex min-h-[316px] w-full min-w-0 flex-col p-4 sm:w-[320px] sm:shrink-0 sm:snap-start ${INNER}`}
                >
                  {/* Channel Header */}
                  <div className="flex min-w-0 items-center gap-2.5 border-b border-white/[0.07] pb-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-base font-bold">
                      <channel.Logo className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {channel.name}
                      </p>
                      {channel.handle && (
                        <p className="truncate text-[11px] text-white/55">
                          {channel.handle}
                        </p>
                      )}
                    </div>

                    {channel.tracked && (
                      <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/25">
                        <TrendingUp size={10} className="mr-1 inline" />
                        {channel.growth}
                      </span>
                    )}
                  </div>

                  {tracked ? (
                    <>
                      <div className="border-b border-white/[0.07] py-3">
                        <p className="text-xs text-white/55 sm:text-[11px]">Audience</p>
                        <p className="mt-1 text-[24px] font-semibold leading-tight tabular-nums text-white">
                          {channel.audience || "Connected"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-col gap-3">
                        {metrics.map((metric) => {
                          const Icon = metric.icon;

                          return (
                            <div
                              key={metric.label}
                              className="grid min-h-[28px] grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-x-2.5"
                            >
                              <Icon size={18} strokeWidth={1.8} className="text-white/55" />
                              <span className="whitespace-nowrap text-[13px] text-white/55">{metric.label}</span>
                              <span className="whitespace-nowrap pr-0.5 text-right text-[15px] font-medium tabular-nums text-white">
                                {channel.stats?.[metric.label] ?? "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {isConnected && (
                        <p className="mt-auto pt-3 text-xs text-emerald-300 sm:text-[10px]">
                          Link saved locally
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center pt-4 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/55">
                        <BarChart3 size={22} />
                      </div>

                      <p className="text-[12px] font-semibold text-white">
                        Not tracked this month
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/55 sm:text-[11px]">
                        Add figures to include {channel.name} in your monthly report.
                      </p>

                      <button
                        onClick={() => openConnect(channel)}
                        className={`${PILL_PRIMARY} mt-auto h-11 w-full sm:h-8`}
                      >
                        <Link2 size={13} />
                        Connect {channel.name}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* PERFORMANCE CHART */}
        <section className="mt-5 rounded-2xl border border-white/[0.08] bg-black/30 p-4 md:p-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-white md:text-[15px]">Audience trend by channel</h2>
            <p className="mt-1 text-[12px] text-white/55">
              {noDataSelected
                ? `No data for the selected month yet. Showing ${trendMonths[activeIdx]} 2026.`
                : `Monthly audience, ${chartMonths.join(" · ")} 2026`}
            </p>
          </div>

          <div className="mb-3 flex min-h-[40px] flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px]">
            {chartMonths.length > 1 && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">
                {trendMonths[activeIdx]} 2026
              </span>
            )}
            {Object.keys(trendData).map((name) => (
              <span key={name} className="flex items-center gap-2 font-medium leading-none text-white/60">
                <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: channelColors[name] }} />
                {name}
                <b className="font-semibold tabular-nums text-white">
                  {trendData[name][activeIdx].toLocaleString("id-ID")}
                </b>
              </span>
            ))}
          </div>

          <div className="relative h-[170px] min-w-0 md:h-[240px] lg:mx-auto lg:max-w-[880px]">
            <Bar data={trendChart} options={trendOptions} plugins={[barValueLabels]} />
          </div>
        </section>

        {/* PERFORMANCE TREND */}
        <section className="mt-5 rounded-2xl border border-white/[0.08] bg-black/30 p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white md:text-[15px]">Performance trend</h2>
              <p className="mt-1 text-[12px] text-white/55">
                {trendMetric} per channel,{" "}
                {rangeFrom === rangeTo ? `${rangeFrom} 2026` : `${rangeFrom} – ${rangeTo} 2026`}
              </p>
            </div>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              Demo data
            </span>
          </div>

          {/* Kontrol: metrik dan rentang bulan */}
          <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Metric"
              className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 sm:inline-flex sm:w-auto sm:flex-wrap"
            >
              {metrics.map(({ label, icon: Icon }) => {
                const active = trendMetric === label;
                return (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTrendMetric(label)}
                    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition active:scale-[0.97] sm:h-8 sm:justify-start sm:text-[12px] ${
                      active
                        ? "bg-[#C42428] text-white shadow-[0_6px_16px_-8px_rgba(196,36,40,0.7)]"
                        : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
              <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:items-center sm:gap-2">
                <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
                  <span className="mb-1 block text-xs font-medium text-white/55 sm:mb-0 sm:text-[11px] sm:text-white/50">From</span>
                  <GlassSelect
                    label="From month"
                    value={rangeFrom}
                    onChange={changeRangeFrom}
                    options={monthChoices}
                    className="w-full sm:w-[128px]"
                  />
                </div>
                <div className="min-w-0 sm:flex sm:items-center sm:gap-2">
                  <span className="mb-1 block text-xs font-medium text-white/55 sm:mb-0 sm:text-[11px] sm:text-white/50">To</span>
                  <GlassSelect
                    label="To month"
                    value={rangeTo}
                    onChange={changeRangeTo}
                    options={monthChoices}
                    className="w-full sm:w-[128px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:flex">
                {[
                  { label: "Last 3 months", from: threeMonthsAgo, to: lastMonth },
                  { label: "Last 6 months", from: sixMonthsAgo, to: lastMonth },
                  { label: "All months", from: waveMonths[0], to: lastMonth },
                ].map((range) => {
                  const active = rangeFrom === range.from && rangeTo === range.to;
                  return (
                    <button
                      key={range.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyQuickRange(range.from, range.to)}
                      className={`inline-flex h-11 items-center justify-center rounded-full border px-2 text-center text-[12px] font-medium leading-tight transition active:scale-[0.97] sm:h-8 sm:px-3 sm:text-[11px] ${
                        active
                          ? "border-[#B82323]/70 bg-[#A21E1E]/25 text-white"
                          : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ringkasan rentang */}
          <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className={`p-3.5 ${TILE}`}>
              <p className="text-xs font-medium text-white/55 sm:text-[11px] sm:text-white/50">
                Change, {rangeMonths[0]} to {rangeMonths[rangeMonths.length - 1]}
              </p>
              <p
                className={`mt-1 text-xl font-semibold tabular-nums sm:text-lg ${
                  rangeChange === null ? "text-white/50" : rangeChange >= 0 ? "text-emerald-300" : "text-[#E04848]"
                }`}
              >
                {rangeChange === null ? "—" : `${rangeChange >= 0 ? "+" : ""}${rangeChange.toFixed(1)}%`}
              </p>
            </div>
            <div className={`p-3.5 ${TILE}`}>
              <p className="text-xs font-medium text-white/55 sm:text-[11px] sm:text-white/50">Top channel</p>
              <p className="mt-1 text-xl font-semibold text-white sm:text-lg">{topChannel ?? "—"}</p>
            </div>
          </div>

          {/* Filter channel */}
          <div className="mb-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {channelNames.map((name) => {
              const hidden = hiddenChannels.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={!hidden}
                  onClick={() => toggleChannel(name)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-2 text-[13px] font-medium leading-none transition active:scale-[0.97] sm:h-7 sm:justify-start sm:px-3 sm:text-[12px] ${
                    hidden
                      ? "border-white/[0.07] bg-white/[0.02] text-white/35 line-through"
                      : "border-white/10 bg-white/[0.05] text-white/80 hover:border-white/25"
                  }`}
                >
                  <i
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: hidden ? "rgba(255,255,255,0.25)" : channelColors[name] }}
                  />
                  {name}
                </button>
              );
            })}
            <span className="ml-1 hidden text-[11px] leading-none text-white/40 sm:inline">
              Click a channel to show or hide it
            </span>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3.5 sm:p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold leading-none text-white">Total {trendMetric}</p>
              <p className="text-2xl font-semibold leading-none tabular-nums tracking-tight text-[#E04848] md:text-[26px]">
                {compactNumber(rangeTotal, 2)}
              </p>
            </div>

            <div className="relative h-[220px] min-w-0 sm:h-[240px] md:h-[280px]">
              {visibleSeries.length > 0 ? (
                <Line data={metricChart} options={metricOptions} plugins={[trendHoverLine]} />
              ) : (
                <div className="grid h-full place-items-center text-[12px] text-white/45">
                  Select at least one channel to see the chart.
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Connect Modal */}
      {modalChannel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <form
            onSubmit={handleConnect}
            className={`relative my-auto w-full max-w-[500px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl ${GLASS}`}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04] text-white">
                <Link2 size={18} />
              </div>
              <div className="pr-8">
                <h2 className="text-base font-semibold text-white md:text-[15px]">
                  Connect {modalChannel.name} Account
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                  Enter your {modalChannel.name} {modalChannel.kind} link to
                  connect and automatically sync monthly performance data.
                </p>
              </div>
            </div>

            <label className="mb-1.5 block text-[12px] font-medium text-white/85">
              {modalChannel.name} {modalChannel.kind} Link
            </label>

            <div className="relative">
              <Link2
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/55"
              />
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError("");
                }}
                placeholder="Drop link here..."
                className={`h-10 w-full rounded-lg border bg-white/[0.05] pl-10 pr-4 text-[13px] text-white outline-none transition placeholder:text-white/35 ${
                  error ? "border-[#B82323]" : "border-white/10 focus:border-[#B82323]/60"
                }`}
              />
            </div>

            {error && (
              <p className="mt-1.5 text-[11px] text-[#E04848]">{error}</p>
            )}

            <div className={`mt-4 flex gap-3 p-3.5 ${INNER}`}>
              <Info size={15} className="mt-0.5 shrink-0 text-[#C42B2B]" />
              <div>
                <p className="text-[12px] font-semibold text-white">How to get your link</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">
                  Go to your {modalChannel.name} {modalChannel.kind}, then
                  copy the URL from your browser address bar.
                </p>
                <a
                  href={modalChannel.example}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-[11px] text-[#C42B2B] hover:text-[#E04848] hover:underline"
                >
                  Example: {modalChannel.example}
                </a>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${PILL_PRIMARY} h-9 px-4`}
              >
                <Link2 size={13} />
                Connect
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
              <Lock size={11} />
              Your data is secure. We only access the data you authorize.
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
