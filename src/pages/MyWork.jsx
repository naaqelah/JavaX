import { useState } from "react";
import { Link } from "react-router-dom";
import EditFiguresModal from "../components/dashboard/EditFiguresModal";

import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Check,
} from "lucide-react";

// Desain token sama dengan Overview & MarketingPerformance
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-medium text-white/80";

// Warna tipe item: netral, tidak merah (merah dipakai untuk alert)
const typeTone = (type) =>
  type === "Evidence"
    ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
    : "border-sky-300/25 bg-sky-300/10 text-sky-200";

// Inisial penanggung jawab
const Avatar = ({ name }) => (
  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.08] text-[10px] font-semibold text-white">
    {name[0]}
  </span>
);

const reviewItems = [
  {
    name: "Camera and lighting rig",
    type: "Evidence",
    assigned: "Jason",
  },
  {
    name: "Exhibition booth install",
    type: "Evidence",
    assigned: "Jason",
  },
  {
    name: "Exhibition booth install",
    type: "Evidence",
    assigned: "Jason",
  },
  {
    name: "Market Open Short Film",
    type: "Content",
    assigned: "Jason",
  },
  {
    name: "Partnership Announcement",
    type: "Content",
    assigned: "Michelle",
  },
];

function WorkSection({ title, count, children, id }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section id={id} className="mt-6 w-full min-w-0 scroll-mt-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex min-h-[32px] items-center gap-2 text-left text-[15px] font-semibold tracking-tight text-white transition hover:text-white/80"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/55 transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
        {title} <span className="font-medium text-white/50">({count})</span>
      </button>

      {expanded && (
        <div className={`mt-3 w-full min-w-0 overflow-hidden rounded-2xl ${GLASS} max-md:overflow-visible max-md:border-0 max-md:bg-none max-md:bg-transparent max-md:shadow-none max-md:backdrop-blur-none`}>
          {children}
        </div>
      )}
    </section>
  );
}

function ReviewAction({ id }) {
  return (
    <Link
      to={`/my-work/review/${id}`}
      className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/[0.07] px-3 text-[12px] font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.97]"
    >
      Review
      <ArrowRight size={14} />
    </Link>
  );
}

function DesktopReviewTable() {
  return (
    <div className="hidden w-full overflow-x-auto md:block">
      <table className="w-full min-w-[650px] border-collapse text-left text-[13px] text-white/90">
        <thead>
          <tr>
            {[
              "No.",
              "Content Item",
              "Type",
              "Assigned Person",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className="h-11 whitespace-nowrap border-b border-white/[0.12] bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-wider text-white/55"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {reviewItems.map((item, index) => (
            <tr
              key={`${item.name}-${index}`}
              className="transition-colors duration-150 hover:bg-white/[0.04]"
            >
              <td className="h-12 w-16 border-b border-white/[0.06] px-5 text-center tabular-nums text-white/55">
                {index + 1}.
              </td>

              <td className="h-12 border-b border-white/[0.06] px-5 font-medium text-white">
                {item.name}
              </td>

              <td className="h-12 border-b border-white/[0.06] px-5">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${typeTone(item.type)}`}>
                  {item.type}
                </span>
              </td>

              <td className="h-12 border-b border-white/[0.06] px-5">
                <span className="inline-flex items-center gap-2 text-white/85">
                  <Avatar name={item.assigned} />
                  {item.assigned}
                </span>
              </td>

              <td className="h-12 border-b border-white/[0.06] px-5">
                <ReviewAction id={index + 1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileReviewCards() {
  return (
    <div className="space-y-2.5 md:hidden">
      {reviewItems.map((item, index) => (
        <article
          key={`${item.name}-${index}`}
          className="rounded-2xl border border-[#B82323]/25 bg-black/35 p-4 shadow-[0_0_28px_-10px_rgba(162,30,30,0.75),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Item {String(index + 1).padStart(2, "0")}
            </span>

            <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium ${typeTone(item.type)}`}>
              {item.type}
            </span>
          </div>

          <h3 className="my-2.5 text-[15px] font-semibold leading-snug text-white [overflow-wrap:anywhere]">
            {item.name}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[12px] text-white/55">
              <Avatar name={item.assigned} />
              <strong className="font-medium text-white/85">{item.assigned}</strong>
            </span>

            <ReviewAction id={index + 1} />
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hidden px-5 py-8 text-center md:block">
      <p className="text-[12px] text-white/55">
        No pending actions.
      </p>
    </div>
  );
}

function MobileEmptyState() {
  return (
    <div className={`px-4 py-7 text-center md:hidden ${INNER}`}>
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
        <Check size={22} />
      </div>

      <h3 className="text-[15px] font-semibold text-white">
        All caught up!
      </h3>

      <p className="mt-1 text-[12px] leading-relaxed text-white/55">
        No pending actions.
      </p>
    </div>
  );
}

export default function MyWork() {
  return (
    <div className="mw-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .mw-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .mw-root a, .mw-root button { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .mw-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-4 lg:px-5">
        {/* PAGE HEADING */}
        <div className="mb-5 flex w-full flex-wrap items-start justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
              My Work
            </h1>

            <p className="mt-1.5 max-w-[640px] text-xs leading-relaxed text-white/55">
              What needs your attention right now, across your KPIs,
              content and projects
            </p>

          </div>

          {/* WORK SUMMARY */}
          <div className={`ml-auto min-w-[200px] shrink-0 rounded-xl p-3.5 text-right max-md:ml-0 max-md:w-full max-md:min-w-0 max-md:text-left ${GLASS}`}>
            <div className="flex items-center justify-between gap-3 max-md:justify-between">
              <h2 className="text-[13px] font-semibold text-white">
                Reinhart’s work today
              </h2>
              <span className={`${PILL} tabular-nums`}>
                Oct 2026
              </span>
            </div>


          </div>
        </div>

        {/* ATTENTION BANNER */}
<button
  onClick={() => window.alert("1 item needs attention")}
  className="bg-[#2A1114] group mb-1 flex min-h-8 w-full items-center gap-2 rounded-xl border border-[#B82323]/30 px-2.5 text-left text-[11px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[#B82323]/55 py-1.5"
>
  <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#A21E1E]/30 text-white">
    <AlertTriangle size={16} />
  </span>

  <span>1 item needs attention</span>

  <span className="ml-auto inline-flex items-center gap-1 text-[10px] not-dark:text-white text-white transition group-hover:text-white">
    View
    <ChevronRight size={14} />
  </span>
</button>

        {/* NEED YOUR REVIEW */}
        <WorkSection
          id="need-review"
          title="Need Your Review"
          count={1}
        >
          <DesktopReviewTable />
          <div className="p-0 md:hidden">
            <MobileReviewCards />
          </div>
        </WorkSection>

        {/* NEEDS ACTION */}
        <WorkSection title="Needs action" count={0}>
          <EmptyState />
          <MobileEmptyState />
        </WorkSection>
      </div>
    </div>
  );
}
