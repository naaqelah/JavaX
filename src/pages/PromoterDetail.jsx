
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  Pencil,
  X,
} from "lucide-react";

// Desain token sama dengan halaman lain (panel kaca, font Plus Jakarta Sans)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";

// Data awal sama dengan daftar Promoter (dipakai jika belum ada data tersimpan)
const fallbackPromoters = [
  { id: 1, name: "Alfian", ig: "@javafx.promo01", ig_status: "not_found", tt: "@javafx.trader01", tt_status: "not_found", done: 0, total: 3 },
  { id: 2, name: "Gusti", ig: "@scalping.id", ig_status: "missing", tt: null, tt_status: "verified", done: 0, total: 3 },
  { id: 3, name: "Putri", ig: "@chart.notes", ig_status: "not_found", tt: "@market.recap.id", tt_status: "verified", done: 0, total: 3 },
  { id: 4, name: "Rizky", ig: "@forex.insight", ig_status: "verified", tt: "@forex.insight.tt", tt_status: "verified", done: 0, total: 3 },
];

const statusConfig = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  },
  not_found: {
    label: "Not found",
    icon: CircleAlert,
    className: "bg-[#A21E1E]/15 text-[#E04848] ring-[#B82323]/30",
  },
  missing: {
    label: "Missing",
    icon: CircleAlert,
    className: "bg-amber-300/10 text-amber-300 ring-amber-300/25",
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.not_found;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default function PromoterDetail() {
  const { id } = useParams();

  const [promoters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jgf-promotors") || "null") || fallbackPromoters;
    } catch {
      return fallbackPromoters;
    }
  });

  const promoter = promoters.find((item) => String(item.id) === String(id));
  const [posts, setPosts] = useState([false, false, false]);

  if (!promoter) {
    return (
      <div className="relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] overflow-x-hidden pb-14 pt-6 text-center text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
        <div className={`mx-auto mt-10 max-w-md rounded-2xl p-6 ${GLASS}`}>
          <h2 className="text-[15px] font-semibold text-white">Promoter not found</h2>
          <Link to="/promotors" className={`${PILL} mt-4`}>
            Back to Promoter
          </Link>
        </div>
      </div>
    );
  }

  const doneCount = posts.filter(Boolean).length;
  const total = posts.length;
  const progress = Math.round((doneCount / total) * 100);

  const togglePost = (index) =>
    setPosts((current) => current.map((value, i) => (i === index ? !value : value)));

  return (
    <div className="pd-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .pd-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .pd-root button, .pd-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .pd-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-4 px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        <Link to="/promotors" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/65 transition hover:text-white">
          <ArrowLeft size={15} />
          Back to Promoter
        </Link>

        {/* HEADER */}
        <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-[#A21E1E]/40 to-white/[0.06] text-[18px] font-semibold text-white">
              {promoter.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold leading-tight tracking-tight text-white md:text-[22px]">
                {promoter.name}
              </h1>
              <p className="mt-1 text-[12px] text-white/55">Promoter · Post checklist 3 posts</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">Progress {progress}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* SOCIAL ACCOUNTS */}
          <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
            <h2 className="text-[15px] font-semibold text-white">Social media accounts</h2>
            <p className="mt-1 text-[12px] text-white/55">Verification status for each account.</p>

            <div className="mt-4 space-y-3">
              {[
                { type: "Instagram", handle: promoter.ig, status: promoter.ig_status, icon: <Camera size={15} className="text-[#C42B2B]" /> },
                { type: "TikTok", handle: promoter.tt, status: promoter.tt_status, icon: <span className="text-[14px] font-bold">♪</span> },
              ].map((account) => (
                <div key={account.type} className={`flex flex-wrap items-center justify-between gap-3 p-3.5 ${INNER}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white">
                      {account.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-white/55">{account.type}</p>
                      <p className={`truncate text-[13px] font-medium ${account.handle ? "text-white" : "text-white/40"}`}>
                        {account.handle || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={account.handle ? account.status : "missing"} />
                </div>
              ))}
            </div>
          </section>

          {/* POST CHECKLIST */}
          <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-white">Post checklist</h2>
                <p className="mt-1 text-[12px] text-white/55">
                  {doneCount} of {total} posts completed
                </p>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-white">{progress}%</span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>

            <ul className="mt-4 space-y-2">
              {posts.map((done, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => togglePost(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-[13px] transition ${
                      done
                        ? "border-emerald-400/25 bg-emerald-400/10 text-white"
                        : "border-white/[0.07] bg-black/35 text-white/75 hover:border-white/20"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          done ? "border-emerald-300 bg-emerald-400 text-black" : "border-white/30"
                        }`}
                      >
                        {done && <Check size={11} />}
                      </span>
                      Post {index + 1}
                    </span>
                    <span className="text-[11px] text-white/45">{done ? "Done" : "Pending"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="flex items-center gap-2 text-[11px] text-white/45">
          <Pencil size={12} />
          Checklist changes are not saved yet; they reset when the page is reloaded.
        </p>
      </div>
    </div>
  );
}
