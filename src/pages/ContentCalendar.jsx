
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import GlassSelect from "../components/ui/GlassSelect";
import { MONTH_OPTIONS } from "../components/ui/monthOptions";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown, ArrowRight, CalendarDays, CalendarCheck,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Columns3, FileText, History, Image, Lightbulb,
  Megaphone, Plus, Send, Trash2, X, Info
} from "lucide-react";

// Desain token sama dengan Overview, MarketingPerformance, MyWork, SocialMedia & TeamScorecards
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";

const MONTHS = [
  "October 2026",
  "September 2026",
  "August 2026",
  "July 2026",
];

// Urutan kolom papan sekaligus alur status (dipakai juga oleh tombol geser kiri/kanan)
const COLUMNS = [
  { id: "idea", label: "Idea", icon: Lightbulb },
  { id: "scheduled", label: "Scheduled", icon: CalendarCheck },
  { id: "drafting", label: "Drafting", icon: FileText },
  { id: "review", label: "In review", icon: Clock3 },
  { id: "approved", label: "Approved", icon: CheckCircle2 },
  { id: "published", label: "Published", icon: Megaphone },
];

const BOARD_COLUMNS = COLUMNS;

const INITIAL_CARDS = [
  { id: 1, status: "drafting", title: "October Teaser Series", platform: "TT", owner: "Bella", date: "2026-10-16", time: "10:00", asset: false },
  { id: 2, status: "drafting", title: "Analyst Interview Rupiah Outlook", platform: "TT", owner: "Jason", date: "2026-10-17", time: "14:00", asset: false },
  { id: 3, status: "drafting", title: "project dashboard", platform: "TT", owner: "Reinhart", date: "2026-10-24", time: "10:00", asset: false },
  { id: 4, status: "review", title: "Partnership Announcement", platform: "IG", owner: "Michelle", date: "2026-10-07", time: "11:00", asset: true },
  { id: 5, status: "review", title: "Market Open Short Film", platform: "YT", owner: "Jason", date: "2026-10-08", time: "09:00", asset: true },
  { id: 6, status: "approved", title: "Acquisition Campaign Creative", platform: "TT", owner: "Jodie", date: "2026-10-11", time: "13:00", asset: false },
  { id: 7, status: "scheduled", title: "Weekend Campaign Reel", platform: "TT", owner: "Kevin", date: "2026-10-04", time: "14:00", asset: false },
  { id: 8, status: "scheduled", title: "October Campaign Shoot Package", platform: "TT", owner: "Jason", date: "2026-10-27", time: "09:00", asset: false },
  { id: 9, status: "published", title: "September Promo Launch", platform: "TT", owner: "Jodie", date: "2026-09-02", time: "10:00", asset: false },
  { id: 10, status: "published", title: "Trading Psychology Podcast — Ep. 4", platform: "TT", owner: "Jason", date: "2026-09-10", time: "", asset: false },
];

const SAMPLE_EVENTS = [
  { title: "September Promo Launch", owner: "Jodie", platform: "TT", date: "2026-09-02", time: "10:00", status: "published" },
  { title: "Weekend Campaign Reel", owner: "Kevin", platform: "TT", date: "2026-09-04", time: "14:00", status: "scheduled" },
  { title: "Partnership Announcement", owner: "Michelle", platform: "IG", date: "2026-09-07", time: "11:00", status: "drafting" },
  { title: "Market Open Short Film", owner: "Jason", platform: "YT", date: "2026-09-08", time: "09:00", status: "published" },
  { title: "Trading Psychology Podcast — Ep. 4", owner: "Jason", platform: "TT", date: "2026-09-10", time: "", status: "published" },
  { title: "Acquisition Campaign Creative", owner: "Jodie", platform: "TT", date: "2026-09-11", time: "13:00", status: "approved" },
  { title: "October Teaser Series", owner: "Bella", platform: "TT", date: "2026-10-16", time: "10:00", status: "drafting" },
  { title: "Analyst Interview Rupiah Outlook", owner: "Jason", platform: "TT", date: "2026-10-17", time: "14:00", status: "drafting" },
  { title: "Project Dashboard", owner: "Reinhart", platform: "TT", date: "2026-10-24", time: "10:00", status: "drafting" },
  { title: "October Campaign Shoot Package", owner: "Jason", platform: "TT", date: "2026-10-27", time: "09:00", status: "published" },
];

const OWNERS = ["Bella", "Jason", "Reinhart", "Michelle", "Jodie", "Kevin"];
const PLATFORMS = ["IG", "TT", "YT", "FB", "X"];

const STATUS_STYLE = {
  // Warna mengikuti psikologi warna: biru = tenang/proses, kuning = perlu perhatian,
  // hijau = siap/selesai, ungu = terjadwal, abu = belum mulai
  idea: "bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/25",
  drafting: "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/25",
  review: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30",
  approved: "bg-green-400/10 text-green-300 ring-1 ring-green-400/30",
  scheduled: "bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/30",
  published: "bg-pink-400/15 text-pink-300 ring-1 ring-pink-400/35",
};

const LEGEND_DOT = {
  idea: "bg-slate-300",
  drafting: "bg-sky-300",
  review: "bg-amber-300",
  approved: "bg-green-300",
  scheduled: "bg-violet-300",
  published: "bg-pink-300",
};

function readSavedCards() {
  try {
    const saved = localStorage.getItem("jgf-content-calendar");
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  } catch {
    return INITIAL_CARDS;
  }
}

function dateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "No publish date";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PlatformBadge({ platform }) {
  const colors = {
    IG: "text-pink-400",
    TT: "text-white",
    YT: "text-red-400",
    FB: "text-blue-400",
    X: "text-white",
  };

  return (
    <span className={`rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold ${colors[platform] || "text-white/75"}`}>
      {platform}
    </span>
  );
}

export default function ContentCalendar() {
  const [cards, setCards] = useState(readSavedCards);
  const [selectedMonth, setSelectedMonth] = useState("October 2026");
  const [view, setView] = useState("board");
  const [calendarDate, setCalendarDate] = useState({ year: 2026, month: 8 });
  const [collapsedColumns, setCollapsedColumns] = useState({});

  const [createOpen, setCreateOpen] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [reason, setReason] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    platform: "",
    owner: "",
    date: "",
  });

  const attention = cards.filter((card) => card.status === "review").length;

  function saveCards(updated) {
    setCards(updated);
    localStorage.setItem("jgf-content-calendar", JSON.stringify(updated));
  }

  function moveCard(id, direction) {
    const updated = cards.map((card) => {
      if (card.id !== id) return card;
      const current = COLUMNS.findIndex((col) => col.id === card.status);
      const next = Math.max(0, Math.min(COLUMNS.length - 1, current + direction));
      return { ...card, status: COLUMNS[next].id };
    });
    saveCards(updated);
  }

  function deleteCard(id) {
    if (!window.confirm("Delete this content card?")) return;
    saveCards(cards.filter((card) => card.id !== id));
    setDetailCard(null);
  }

  function addCard(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.platform || !form.owner) return;

    const newCard = {
      id: Date.now(),
      status: "idea",
      title: form.title.trim(),
      platform: form.platform,
      owner: form.owner,
      date: form.date,
      time: "",
      asset: false,
    };

    saveCards([...cards, newCard]);
    setForm({ title: "", platform: "", owner: "", date: "" });
    setCreateOpen(false);
  }

  function changeCalendarMonth(direction) {
    setCalendarDate((current) => {
      const next = new Date(current.year, current.month + direction, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function handleReview(action) {
    if (!detailCard) return;

    if (action === "schedule") {
      saveCards(cards.map((card) =>
        card.id === detailCard.id ? { ...card, status: "scheduled" } : card
      ));
      setReviewMessage("Content moved to Scheduled.");
    } else {
      setReviewMessage(
        reason.trim()
          ? `Sent back: ${reason}`
          : "Please provide a reason before sending this content back."
      );
    }

    if (action === "schedule") {
      setDetailCard(null);
      setReason("");
    }
  }

  const calendarCells = useMemo(() => {
    const { year, month } = calendarDate;
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((offset + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - offset + 1;

      if (day < 1) {
        return { day: previousDays + day, dimmed: true, date: "" };
      }
      if (day > totalDays) {
        return { day: day - totalDays, dimmed: true, date: "" };
      }
      return { day, dimmed: false, date: dateString(year, month, day) };
    });
  }, [calendarDate]);

  const calendarEvents = useMemo(() => {
    const savedEvents = cards
      .filter((card) => card.date)
      .map((card) => ({ ...card, status: card.status }));

    const allEvents = [...SAMPLE_EVENTS];

    savedEvents.forEach((card) => {
      const index = allEvents.findIndex(
        (event) => event.title === card.title && event.date === card.date
      );
      if (index >= 0) allEvents[index] = card;
      else allEvents.push(card);
    });

    return allEvents;
  }, [cards]);

  const monthLabel = new Date(
    calendarDate.year,
    calendarDate.month,
    1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="cc-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .cc-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .cc-root button, .cc-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .cc-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-4 lg:px-5">

        {/* PAGE HEADER */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Content Calendar</h1>
            <p className="mt-1.5 text-xs text-white/55">
              Idea to published
            </p>
          </div>

          <div className="relative">
              <GlassSelect
                label="Month"
                className="h-9 w-[190px] max-sm:w-full"
                icon={<CalendarDays size={14} />}
                value={selectedMonth}
                options={MONTH_OPTIONS}
                onChange={setSelectedMonth}
              />
              <ChevronDown size={14} className="hidden" />
            </div>
        </div>

        {/* ATTENTION BANNER */}
        {attention > 0 && (
          <div className="mb-5 flex min-h-9 py-1.5 md:h-10 md:py-0 items-center gap-2.5 rounded-xl border border-[#B82323]/25 bg-[#A21E1E]/10 px-3 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#A21E1E]/30"><Info size={14} /></span>
            {attention} item{attention > 1 ? "s" : ""} needs attention
            <span className="ml-auto flex items-center gap-1 text-[12px] text-white/55">View<ArrowRight size={14} /></span>
          </div>
        )}

        {/* MAIN PANEL */}
        <section className={`rounded-2xl p-4 sm:p-5 ${GLASS}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">Content calendar</h2>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                onClick={() => setView("board")}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[12px] font-medium transition sm:flex-none ${
                  view === "board" ? "bg-black text-white ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.8)]" : "border border-white/10 bg-white/[0.05] text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                <Columns3 size={14} /> Board
              </button>

              <button
                onClick={() => setView("calendar")}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[12px] font-medium transition sm:flex-none ${
                  view === "calendar" ? "bg-black text-white ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.8)]" : "border border-white/10 bg-white/[0.05] text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                <CalendarDays size={14} /> Calendar
              </button>

              <button
                onClick={() => setCreateOpen(true)}
                className={PILL_PRIMARY + " h-9 flex-1 px-3.5 sm:flex-none"}
              >
                <Plus size={14} /> New
              </button>
            </div>
          </div>

          <div className="mb-4 border-t border-white/[0.08]" />

          {/* BOARD VIEW */}
          {view === "board" && (
            <>
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {[
                  ["idea", "Idea", "Not started"],
                  ["drafting", "Drafting", "In progress"],
                  ["review", "In review", "Waiting for review"],
                  ["approved", "Approved", "Ready to schedule"],
                  ["scheduled", "Scheduled", "Planned date"],
                  ["published", "Published", "Live"],
                ].map(([key, label, meaning]) => (
                  <span key={key} className="inline-flex items-center gap-2 text-[13px] font-medium leading-none text-white/55">
                    <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${LEGEND_DOT[key]}`} />
                    {label}
                  </span>
                ))}
              </div>
              <div className="pb-3 md:overflow-x-auto">
              <div className="grid grid-cols-1 items-start gap-3 md:min-w-[1200px] md:grid-cols-6 md:gap-2.5">
                {BOARD_COLUMNS.map((column) => {
                  // Posisi di alur status (untuk tombol geser kiri/kanan)
                  const index = COLUMNS.findIndex((c) => c.id === column.id);
                  const Icon = column.icon;
                  const columnCards = cards.filter((card) => card.status === column.id);
                  // Di HP, kolom kosong tertutup otomatis dan bisa dibuka lewat header
                  const isOpen = collapsedColumns[column.id] ?? columnCards.length > 0;

                  return (
                    <div key={column.id} className={`min-w-0 pb-2.5 ${INNER}`}>
                      <div role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => setCollapsedColumns((prev) => ({ ...prev, [column.id]: !isOpen }))} className="flex h-10 cursor-pointer items-center gap-2 rounded-t-xl border-b border-white/[0.07] bg-white/[0.04] px-3 text-[10px] font-semibold tracking-normal text-white/75 max-md:h-auto max-md:rounded-2xl max-md:border-0 max-md:bg-transparent max-md:px-4 max-md:py-3.5 max-md:text-[13px] max-md:text-white md:cursor-default">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-gradient-to-br from-[#5A1C1C] to-[#2A0C0C] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                          <Icon size={14} />
                        </span>
                        <span className="truncate">{column.label}</span>
                        <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ring-1 ${STATUS_STYLE[column.id]}`}>{columnCards.length}</span>
                        <span className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-[#1a1a1a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-200 md:hidden ${isOpen ? "rotate-180" : ""}`}>
                          <ChevronDown size={14} />
                        </span>
                      </div>

                      <div className={`flex flex-col gap-2.5 p-2 max-md:border-t max-md:border-white/[0.07] max-md:p-3 ${isOpen ? "" : "max-md:hidden"}`}>
                        {columnCards.length === 0 && column.id === "idea" && (
                          <div className="flex min-h-[170px] flex-col items-center justify-center rounded-lg border border-dashed border-white/15 px-3 text-center">
                            <Lightbulb size={22} className="mb-2.5 text-white/40" />
                            <p className="text-[12px] font-semibold text-white/80">Nothing here yet</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                              Drop a card or click + New to add a new idea.
                            </p>
                          </div>
                        )}

                        {columnCards.map((card) => (
                          <article
                            key={card.id}
                            onClick={() => {
                              setDetailCard(card);
                              setReason("");
                              setReviewMessage("");
                            }}
                            className="cursor-pointer rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-black/50 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#B82323]/40"
                          >
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <h3 className="text-[12px] font-semibold leading-snug text-white max-md:text-[14px]">
                                {card.title}
                              </h3>
                              <PlatformBadge platform={card.platform} />
                            </div>

                            <p className="text-[11px] text-white/55 max-md:text-[13px]">
                              {card.owner}
                            </p>

                            {card.asset && (
                              <div className="mt-2.5 flex h-20 items-center justify-center rounded-md border border-white/[0.06] bg-black/40 text-white/35">
                                <Image size={20} />
                              </div>
                            )}

                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium max-md:px-2.5 max-md:text-[12px] ${STATUS_STYLE[card.status]}`}>
                                {column.label}
                              </span>
                              <span className="text-[10px] text-white/50 max-md:text-[12px]">
                                {card.date ? formatDate(card.date) : "No date"}
                              </span>
                            </div>

                            <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/[0.07] pt-2 max-md:justify-end">
                              <button
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(card.id, -1);
                                }}
                                title="Move backward"
                                className="max-md:order-2 grid h-7 w-8 place-items-center rounded-md border border-white/10 text-white/75 transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-30"
                              >
                                <ArrowLeft size={13} className="hidden md:block" />
                                <ArrowUp size={13} className="md:hidden" />
                              </button>

                              <button
                                disabled={index === COLUMNS.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(card.id, 1);
                                }}
                                title="Move forward"
                                className="max-md:order-1 grid h-7 w-8 place-items-center rounded-md border border-white/10 text-white/75 transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-30"
                              >
                                <ArrowRight size={13} className="hidden md:block" />
                                <ArrowDown size={13} className="md:hidden" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCard(card.id);
                                }}
                                title="Delete"
                                className="ml-auto max-md:order-3 grid h-7 w-8 place-items-center rounded-md text-[#C42B2B] transition hover:bg-[#A21E1E]/15"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          )}

          {/* CALENDAR VIEW */}
          {view === "calendar" && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeCalendarMonth(-1)}
                    disabled={calendarDate.year === 2026 && calendarDate.month === 6}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white/80 transition hover:border-white/25 hover:bg-white/[0.09] disabled:opacity-30"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <div className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white">
                    <CalendarDays size={14} />
                    {monthLabel}
                  </div>
                  <button
                    onClick={() => changeCalendarMonth(1)}
                    disabled={calendarDate.year === 2026 && calendarDate.month === 9}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white/80 transition hover:border-white/25 hover:bg-white/[0.09] disabled:opacity-30"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 md:hidden">
                {calendarCells.filter((cell) => !cell.dimmed && calendarEvents.some((event) => event.date === cell.date)).map((cell) => {
                  const weekday = new Date(calendarDate.year, calendarDate.month, cell.day).toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <div key={cell.date} className="flex gap-3 rounded-xl border border-white/[0.08] bg-black/35 p-3">
                      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-white/[0.05] py-2">
                        <span className="text-[18px] font-semibold text-white">{cell.day}</span>
                        <span className="text-[10px] uppercase tracking-wider text-white/50">{weekday}</span>
                      </div>
                      <div className="grid min-w-0 flex-1 gap-1.5">
                        {calendarEvents.filter((event) => event.date === cell.date).map((event, eventIndex) => (
                          <button
                            key={`${event.title}-${eventIndex}`}
                            onClick={() => {
                              const matching = cards.find((card) => card.title === event.title && card.date === event.date);
                              if (matching) {
                                setDetailCard(matching);
                                setReason("");
                                setReviewMessage("");
                              }
                            }}
                            className={`min-w-0 rounded-md p-2 text-left text-[12px] transition hover:brightness-125 ${STATUS_STYLE[event.status] || STATUS_STYLE.drafting}`}
                          >
                            <span className="block truncate font-semibold">{event.title}</span>
                            <span className="mt-0.5 block truncate opacity-80">{event.time || "Published"} · {event.owner}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {!calendarEvents.some((event) => calendarCells.some((cell) => !cell.dimmed && cell.date === event.date)) && (
                  <p className="py-8 text-center text-[12px] text-white/50">No activity this month.</p>
                )}
              </div>

              <div className="hidden md:grid md:grid-cols-7 md:gap-1.5">

                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                  <div key={day} className="pb-1.5 pl-1 text-[10px] font-semibold tracking-wider text-white/45">
                    {day}
                  </div>
                ))}

                {calendarCells.map((cell, index) => {
                  const events = calendarEvents.filter((event) => event.date === cell.date);

                  return (
                    <div
                      key={`${cell.date}-${index}`}
                      className={`flex min-h-[110px] min-w-0 flex-col gap-1.5 rounded-lg border p-1.5 ${
                        cell.dimmed
                          ? "border-white/[0.04] bg-black/30 opacity-40"
                          : "border-white/[0.08] bg-black/35"
                      }`}
                    >
                      <span className={`text-[11px] font-semibold ${cell.dimmed ? "text-white/30" : "text-white/75"}`}>
                        {cell.day}
                      </span>

                      {events.map((event, eventIndex) => (
                        <button
                          key={`${event.title}-${eventIndex}`}
                          onClick={() => {
                            const matching = cards.find(
                              (card) => card.title === event.title && card.date === event.date
                            );
                            if (matching) {
                              setDetailCard(matching);
                              setReason("");
                              setReviewMessage("");
                            }
                          }}
                          className={`min-w-0 rounded-md p-1.5 text-left text-[10px] transition hover:brightness-125 ${
                            STATUS_STYLE[event.status] || STATUS_STYLE.drafting
                          }`}
                        >
                          <span className="block truncate font-semibold">{event.title}</span>
                          <span className="mt-0.5 block truncate opacity-80">
                            {event.time || "Published"} · {event.owner}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-white/45">
                Select an item to view details.
              </p>
            </div>
          )}
        </section>

        {/* CREATE MODAL */}
        {createOpen && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setCreateOpen(false);
            }}
          >
            <form
              onSubmit={addCard}
              className={`relative my-auto w-full max-w-[560px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl sm:p-6 ${GLASS}`}
            >
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="text-[15px] font-semibold text-white">Create Content Idea</h2>
              <p className="mt-1 text-[12px] text-white/55">
                Add a new item.
              </p>

              <div className="mt-5">
                <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                  Content title <span className="text-[#C42B2B]">*</span>
                </label>
                <input
                  required
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter content title..."
                  className={FIELD}
                />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                  Platform <span className="text-[#C42B2B]">*</span>
                </label>
                <GlassSelect
                  label="Platform"
                  placeholder="Choose platform"
                  value={form.platform}
                  options={PLATFORMS}
                  onChange={(platform) => setForm({ ...form, platform })}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    PIC <span className="text-[#C42B2B]">*</span>
                  </label>
                  <GlassSelect
                    label="PIC"
                    placeholder="Choose PIC"
                    value={form.owner}
                    options={OWNERS}
                    onChange={(owner) => setForm({ ...form, owner })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    Target publish date <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={PILL_PRIMARY + " h-9 px-4"}
                >
                  <Plus size={13} /> Add to board
                </button>
              </div>
            </form>
          </div>
        , document.body)}

        {/* DETAIL / REVIEW MODAL */}
        {detailCard && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDetailCard(null);
            }}
          >
            <div className={`relative my-auto max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl sm:p-6 ${GLASS}`}>
              <button
                onClick={() => setDetailCard(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="pr-10 text-[15px] font-semibold text-white">{detailCard.title}</h2>
              <p className="mt-1 text-[12px] text-white/55">
                {detailCard.owner} · {detailCard.platform} · {formatDate(detailCard.date)}
              </p>

              <div className={`mt-5 p-3.5 ${INNER}`}>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white/55">
                    <Image size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">{detailCard.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">
                      {detailCard.owner} · {detailCard.time || "Time not set"}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <PlatformBadge platform={detailCard.platform} />
                  </div>
                </div>
              </div>

              {detailCard.asset && (
                <div className={`mt-2.5 flex items-center gap-3 p-3.5 ${INNER}`}>
                  <div className="grid h-9 w-9 place-items-center rounded-lg border border-[#C42B2B]/25 bg-[#A21E1E]/15 text-[#E04848]">
                    <Image size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#E04848]">Full asset — master file</p>
                    <p className="text-[11px] text-white/50">drive.google.com</p>
                  </div>
                </div>
              )}

              <h3 className="mb-2.5 mt-6 flex items-center gap-2 text-[13px] font-semibold text-white/85">
                <History size={14} /> Review history
              </h3>

              <div className={`p-3.5 ${INNER}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#A21E1E] text-[11px] font-semibold text-white">1</span>
                  <strong className="text-[12px] font-semibold text-white">Round 1</strong>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/75">
                    Waiting for a manager
                  </span>
                  <span className="ml-auto text-[10px] text-white/45">
                    Submitted by {detailCard.owner}
                  </span>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-white/55">
                  Copy and visual approved by the partner. Ready for your review.
                </p>

                <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/40 p-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-white/55">
                    <Image size={14} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white">{detailCard.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/45">{detailCard.owner}</p>
                  </div>
                </div>
              </div>

              <label className="mb-1.5 mt-5 block text-[12px] font-medium text-white/85">
                Reason, if you are sending this back
              </label>
              <textarea
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a reason..."
                className="h-20 w-full resize-y rounded-lg border border-white/10 bg-white/[0.05] p-3 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60"
              />
              <p className="mt-1 text-right text-[10px] text-white/45">
                {reason.length}/500
              </p>

              {reviewMessage && (
                <p className={`mt-2.5 p-3 text-[11px] text-white/80 ${INNER}`}>
                  {reviewMessage}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-2.5">
                <button
                  onClick={() => handleReview("sendback")}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
                >
                  <Send size={13} /> Send back
                </button>
                <button
                  onClick={() => handleReview("schedule")}
                  className={PILL_PRIMARY + " h-9 px-4"}
                >
                  <CalendarCheck size={14} /> Schedule
                </button>
              </div>
            </div>
          </div>
        , document.body)}
      </div>
    </div>
  );
}
