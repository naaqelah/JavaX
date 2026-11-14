
import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

// Desain token sama dengan halaman lain (Overview, Inventory, Promotors, dst.)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";

export default function PlaceholderPage() {
  const location = useLocation();

  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");

  const title = pageName
    ? pageName.replace(/\b\w/g, (char) => char.toUpperCase())
    : "My Work";

  return (
    <div className="ph-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .ph-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .ph-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-5 px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C42B2B]">
            Java Global Futures / Workspace
          </p>
          <h1 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
            {title}
          </h1>
          <p className="mt-1.5 text-xs text-white/55">
            Workspace activity.
          </p>
        </div>

        <div className={`flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-6 text-center ${GLASS}`}>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[#B82323]/25 bg-[#A21E1E]/15">
            <Construction size={20} className="text-[#C42B2B]" />
          </div>

          <h2 className="text-[15px] font-semibold text-white">
            {title}
          </h2>

          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-white/55">
            This module is being migrated to the new React workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
