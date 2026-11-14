
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Image,
  CheckCircle2,
  Clock3,
  UserRound,
  CalendarDays,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

// Desain token sama dengan halaman lain (panel kaca, font Plus Jakarta Sans)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-4 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";
const PILL_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

const reviewData = [
  {
    id: "1",
    name: "Camera and lighting rig",
    type: "Evidence",
    assigned: "Jason",
    description:
      "Documentation of the camera and lighting rig setup for the production project.",
    submitted: "13 October 2026",
    project: "Production Setup",
    file: "camera-lighting-evidence.jpg",
  },
  {
    id: "2",
    name: "Exhibition booth install",
    type: "Evidence",
    assigned: "Jason",
    description:
      "Evidence of the exhibition booth installation and setup.",
    submitted: "13 October 2026",
    project: "Exhibition Project",
    file: "exhibition-booth-evidence.jpg",
  },
  {
    id: "3",
    name: "Exhibition booth install",
    type: "Evidence",
    assigned: "Jason",
    description:
      "Additional evidence of the exhibition booth installation.",
    submitted: "13 October 2026",
    project: "Exhibition Project",
    file: "exhibition-booth-additional.jpg",
  },
  {
    id: "4",
    name: "Market Open Short Film",
    type: "Content",
    assigned: "Jason",
    description:
      "Short film content prepared for the Market Open campaign.",
    submitted: "13 October 2026",
    project: "Marketing Campaign",
    file: "market-open-short-film.mp4",
  },
  {
    id: "5",
    name: "Partnership Announcement",
    type: "Content",
    assigned: "Michelle",
    description:
      "Announcement content prepared for the partnership campaign.",
    submitted: "13 October 2026",
    project: "Partnership Campaign",
    file: "partnership-announcement.pdf",
  },
];

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const item = reviewData.find((entry) => entry.id === id);

  const [notes, setNotes] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const [savedReviews, setSavedReviews] = useState(() => {
    return JSON.parse(
      localStorage.getItem("jgf-review-decisions") || "{}"
    );
  });

  if (!item) {
    return (
      <div className="relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] overflow-x-hidden pb-14 pt-6 text-center text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
        <div className={`mx-auto mt-10 max-w-md rounded-2xl p-6 ${GLASS}`}>
          <h2 className="text-[15px] font-semibold text-white">
            Review item not found
          </h2>
          <button
            onClick={() => navigate("/my-work")}
            className={`${PILL} mt-4`}
          >
            Back to My Work
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = savedReviews[item.id]?.status || "Pending";

  const saveDecision = (status) => {
    if (status === "Revision Requested" && !notes.trim()) {
      setShowRevision(true);
      return;
    }

    const updated = {
      ...savedReviews,
      [item.id]: {
        status,
        notes,
        updatedAt: new Date().toISOString(),
      },
    };

    localStorage.setItem(
      "jgf-review-decisions",
      JSON.stringify(updated)
    );

    setSavedReviews(updated);
    setConfirmation(status);
    setShowRevision(false);
  };

  return (
    <div className="rd-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .rd-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .rd-root button { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .rd-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-4 px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* PAGE HEADER */}
        <div>
          <button
            onClick={() => navigate("/my-work")}
            className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/65 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to My Work
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
                Review Detail
              </h1>
              <p className="mt-1.5 text-xs text-white/55">
                Review and decide.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                currentStatus === "Approved"
                  ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                  : "bg-amber-300/10 text-amber-300 ring-amber-300/25"
              }`}
            >
              <Clock3 size={12} />
              {currentStatus}
            </span>
          </div>
        </div>

        {/* ITEM INFORMATION */}
        <div className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-white/80">
              {item.type}
            </span>

            <span className="text-[11px] text-white/45">
              Review ID: #{item.id.padStart(3, "0")}
            </span>
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-white md:text-[20px]">
            {item.name}
          </h2>

          <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-white/55">
            {item.description}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              icon={UserRound}
              label="Assigned Person"
              value={item.assigned}
            />
            <InfoItem
              icon={FileText}
              label="Content Type"
              value={item.type}
            />
            <InfoItem
              icon={CalendarDays}
              label="Submitted"
              value={item.submitted}
            />
            <InfoItem
              icon={FileText}
              label="Project"
              value={item.project}
            />
          </div>
        </div>

        {/* SUBMISSION / EVIDENCE */}
        <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-3 flex items-center gap-2">
            {item.type === "Evidence" ? (
              <Image size={16} className="text-white/55" />
            ) : (
              <FileText size={16} className="text-white/55" />
            )}

            <h3 className="text-[15px] font-semibold text-white">
              {item.type === "Evidence"
                ? "Submitted Evidence"
                : "Submitted Content"}
            </h3>
          </div>

          <div className={`flex flex-col items-center gap-3 border-dashed p-6 text-center ${INNER} border-white/15`}>
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/55">
              {item.type === "Evidence" ? (
                <Image size={22} />
              ) : (
                <FileText size={22} />
              )}
            </div>

            <div>
              <p className="text-[13px] font-medium text-white">
                {item.file}
              </p>
              <p className="mt-1 text-[11px] text-white/50">
                Preview not available yet
              </p>
            </div>

            <p className="max-w-md text-[11px] leading-relaxed text-white/40">
              This is a placeholder. The actual file needs to be connected to
              the submission data from the backend.
            </p>
          </div>
        </section>

        {/* REVIEW NOTES */}
        <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare size={16} className="text-white/55" />
            <h3 className="text-[15px] font-semibold text-white">
              Review Notes
            </h3>
          </div>

          <p className="mb-3 text-[12px] text-white/55">
            Add feedback.
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Write your review notes here..."
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.05] p-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60"
          />

          {showRevision && !notes.trim() && (
            <p className="mt-2 text-[11px] text-[#E04848]">
              Add notes before requesting revision.
            </p>
          )}
        </section>

        {/* DECISION */}
        <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <h3 className="text-[15px] font-semibold text-white">
            Review Decision
          </h3>

          <p className="mt-1 text-[12px] text-white/55">
            Choose an action.
          </p>

          {confirmation && (
            <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-2.5 text-[12px] text-emerald-300">
              Decision saved: {confirmation}
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => saveDecision("Revision Requested")}
              disabled={currentStatus === "Approved"}
              className={PILL}
            >
              <RotateCcw size={14} />
              Request Revision
            </button>

            <button
              type="button"
              onClick={() => saveDecision("Approved")}
              disabled={currentStatus === "Approved"}
              className={PILL_PRIMARY}
            >
              <CheckCircle2 size={15} />
              Approve Submission
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-white/50" />

      <div className="min-w-0">
        <p className="text-[11px] text-white/50">
          {label}
        </p>
        <p className="mt-0.5 break-words text-[13px] font-medium text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
