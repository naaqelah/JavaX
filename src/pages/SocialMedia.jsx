import { useState } from "react";
import GlassSelect from "../components/ui/GlassSelect";
import MonthPicker from "../components/ui/MonthPicker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
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
    Logo: InstagramLogo,
  },
  {
    name: "TikTok",
    handle: "@javafx.id",
    tracked: true,
    audience: "36.260",
    growth: "+7.9%",
    Logo: TikTokLogo,
  },
  {
    name: "Youtube",
    handle: "@JavaFxOfficial",
    tracked: true,
    audience: "13.680",
    growth: "+4.0%",
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend);

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
  const activeIdx = hoverIndex ?? trendMonths.length - 1;

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
    labels: [trendMonths[activeIdx]],
    datasets: Object.keys(trendData).map((name) => ({
      label: name,
      data: [trendData[name][activeIdx]],
      backgroundColor: channelColors[name],
      borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    })),
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    onClick: (_event, elements) => setHoverIndex(elements.length ? elements[0].index : null),
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
        grid: { color: "rgba(255,255,255,0.06)" },
        border: { display: false },
        ticks: {
          color: "#b3a4a7",
          font: { size: 10 },
          callback: (value) => Number(value).toLocaleString("en-US"),
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

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-4 lg:px-5">
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
            <h2 className="text-[15px] font-semibold tracking-tight text-white">Custom period comparison</h2>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              Demo data
            </span>
          </div>

          <div className={`p-3 md:p-3.5 ${INNER}`}>
            <p className="text-xs font-medium text-white/60">Select period</p>

            <div className="mt-2.5 grid w-full grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-12">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => {
                const active = compareMonths.includes(month);
                const hasData = trendMonths.includes(month);

                return (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={active}
                    disabled={!hasData}
                    onClick={() => toggleCompareMonth(month)}
                    title={hasData ? undefined : "No data for this month"}
                    className={`inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1 text-[11px] font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? "border-white/30 bg-white/15 text-white"
                        : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {active && <CheckCircle2 size={11} strokeWidth={2} className="shrink-0 text-green-300" />}
                    {month} 2026
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end border-t border-white/[0.07] pt-3">
              <button
                type="button"
                onClick={resetCompare}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Performance Panel */}
        <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-5 space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-white">
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
                      <p className="text-[11px] text-white/55">{kpi.label}</p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums text-white">
                        {kpi.value}
                      </p>
                      <p className="mt-0.5 text-[11px] text-emerald-300">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:snap-x md:snap-mandatory md:overflow-x-auto md:pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
            {channels.map((channel) => {
              const isConnected = Boolean(connected[channel.name]);
              const tracked = channel.tracked || isConnected;

              return (
                <div
                  key={channel.name}
                  className={`flex min-h-[250px] min-w-0 w-full shrink-0 snap-start flex-col p-4 md:w-[260px] md:p-3 ${INNER}`}
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
                        <p className="text-[11px] text-white/55">Audience</p>
                        <p className="mt-0.5 text-[22px] font-semibold leading-tight tabular-nums text-white md:text-lg">
                          {channel.audience || "Connected"}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 md:block md:space-y-2.5">
                        {metrics.map((metric) => {
                          const Icon = metric.icon;

                          return (
                            <div
                              key={metric.label}
                              className="flex min-w-0 items-center gap-2 text-[11px] text-white/55 md:gap-2.5"
                            >
                              <Icon size={14} className="shrink-0" />
                              <span className="min-w-0 truncate">{metric.label}</span>
                              <span className="ml-auto shrink-0 text-white/90">
                                —
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {isConnected && (
                        <p className="mt-auto pt-3 text-[10px] text-emerald-300">
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
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
                        Add figures to include {channel.name} in your monthly report.
                      </p>

                      <button
                        onClick={() => openConnect(channel)}
                        className={`${PILL_PRIMARY} mt-auto h-8 w-full`}
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
            <h2 className="text-[15px] font-semibold text-white">Audience trend by channel</h2>
            <p className="mt-1 text-[12px] text-white/55">Monthly audience, {trendMonths[activeIdx]} 2026</p>
          </div>

          <div className="mb-3 flex min-h-[40px] flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px]">
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

          <div className="h-[170px] min-w-0 md:h-[240px]">
            <Bar data={trendChart} options={trendOptions} />
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
                <h2 className="text-[15px] font-semibold text-white">
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
