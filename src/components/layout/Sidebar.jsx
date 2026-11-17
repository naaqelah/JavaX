
import { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  ChartNoAxesCombined,
  Share2,
  Users,
  CalendarDays,
  SquareCheck,
  Package,
  Megaphone,
  Terminal,
  Bot,
  RefreshCw,
  FileText,
  PanelLeft,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import javaLogo from "../../assets/images/Java_logo.png";
import reinhartPhoto from "../../assets/images/REINHART.jpeg";

const navigation = [
  {
    title: "Today",
    items: [
      { label: "Overview", path: "/overview", icon: LayoutDashboard },
      { label: "My Work", path: "/my-work", icon: ListChecks },
    ],
  },
  {
    title: "Performance",
    items: [
      { label: "Marketing Performance", path: "/marketing-performance", icon: ChartNoAxesCombined },
      { label: "Social Media", path: "/social-media", icon: Share2 },
      { label: "Team Scorecards", path: "/team-scorecards", icon: Users },
      { label: "Report Generator", path: "/monthly-report", icon: FileText },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Content Calendar", path: "/content-calendar", icon: CalendarDays },
      { label: "Project", path: "/projects", icon: SquareCheck },
      { label: "Inventory", path: "/inventory", icon: Package },
      { label: "Promoter", path: "/promotors", icon: Megaphone },
    ],
  },
  {
    title: "System",
    items: [
      { label: "AI Assistant", path: "/ai-assistant", icon: Terminal },
      { label: "Agent Office", path: "/agent-office", icon: Bot },
      { label: "Integrations", path: "/integrations", icon: RefreshCw },
    ],
  },
];

// Kurva easing halus dan durasi yang sama untuk semua animasi sidebar
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// Teks yang memudar dan menyempit saat ciut (desktop). Di mobile selalu tampil.
const fadeText = (collapsed) =>
  `transition-[opacity,width,max-width] duration-300 ${EASE} ${
    collapsed ? "lg:max-w-0 lg:overflow-hidden lg:opacity-0" : "max-w-[200px] opacity-100"
  }`;

// Efek glow di tepi bawah item aktif (seperti referensi) dan titik kilau di sudut
function ActiveGlow() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#E05555] shadow-[0_0_10px_2px_rgba(224,85,85,0.7)]" />
  );
}
// Link yang memunculkan percikan kecil (sparkle) saat ditekan
function SparkLink({ className, children, onClick, ...rest }) {
  return (
    <NavLink
      {...rest}
      onClick={onClick}
      className={(args) => `${typeof className === "function" ? className(args) : className} sb-press`}
    >
      {(args) => (
        <>
          {args.isActive && <ActiveGlow />}
          {typeof children === "function" ? children(args) : children}
        </>
      )}
    </NavLink>
  );
}

// Lebar sidebar di desktop: 240px (terbuka) atau 72px (ciut, hanya ikon).
// Mobile selalu memakai lebar penuh dan tidak terpengaruh mode ciut.
export default function Sidebar({ mobileOpen, setMobileOpen, collapsed, onToggleCollapse }) {
  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");

        /* Scrollbar menu disembunyikan agar rail ikon terlihat bersih */
        .sb-nav { scrollbar-width: none; }
        .sb-nav::-webkit-scrollbar { display: none; }

        /* Efek tekan: sedikit mengecil */
        .sb-press { transition: transform 150ms ease, background-color 200ms ease, box-shadow 300ms ease, color 200ms ease; }
        .sb-press:active { transform: scale(0.97); }

        /* (percikan saat ditekan dinonaktifkan) */
        @keyframes sb-spark-unused {
          0% { transform: translate(0, 0) scale(1); opacity: 1; box-shadow: 0 0 6px 2px rgba(255,255,255,0.7); }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        .sb-spark { animation: sb-spark 600ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }

        /* Glow lembut untuk item aktif dan tombol AI */
        @keyframes sb-glow-pulse {
          0%, 100% { box-shadow: 0 0 12px -4px rgba(255,255,255,0.25); }
          50% { box-shadow: 0 0 22px -2px rgba(255,255,255,0.45); }
        }
        .sb-active { animation: sb-glow-pulse 2.6s ease-in-out infinite; }
        .sb-ai-btn:hover { box-shadow: 0 0 28px -4px rgba(255,255,255,0.55); }
      `}</style>

      {/* Mobile Overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${EASE} lg:hidden ${
          mobileOpen
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-[10000]
          flex h-screen w-[240px] max-w-[85vw] flex-col
          border-r border-white/[0.08]
          bg-black text-white
          font-['Plus_Jakarta_Sans',_'Inter',sans-serif]
          transition-[width,transform] duration-300 ${EASE}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}
        `}
      >
        {/* Brand */}
        <div
          className={`flex h-[64px] shrink-0 items-center justify-between px-5 transition-[padding] duration-300 ${EASE} ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <div className={`flex min-w-0 items-center gap-2.5 transition-[gap] duration-300 ${EASE} ${collapsed ? "lg:gap-0" : ""}`}>
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#A21E1E]">
              <img src={javaLogo} alt="Java logo" className="h-full w-full object-contain" />
            </div>

            <div className={`min-w-0 ${fadeText(collapsed)}`}>
              <h2 className="text-[14px] font-semibold leading-snug tracking-tight text-white">
                Java Global Futures
              </h2>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-2 text-white/50 transition hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>

          {/* Toggle ciut / buka (desktop) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden shrink-0 items-center justify-center rounded-lg p-1.5 text-white/50 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white ${collapsed ? "lg:hidden" : "lg:flex"}`}
          >
            <PanelLeft size={18} />
          </button>
        </div>

        {/* Toggle saat ciut: baris sendiri di bawah logo agar logo tetap sejajar dengan header */}
        <div className={`shrink-0 justify-center pb-2 ${collapsed ? "hidden lg:flex" : "hidden"}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="rounded-lg p-1.5 text-white/50 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`sb-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-5 transition-[padding] duration-300 ${EASE} px-4 lg:px-0 ${
          collapsed ? "lg:pt-4" : "lg:px-3"
        }`}>
          {navigation.map((section, sectionIndex) => (
            <div key={section.title} className={`${collapsed ? "mb-4 lg:mb-3" : "mb-8"}`}>
              {/* Judul section (teks saat terbuka) */}
              <p
                className={`overflow-hidden px-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-white/35 transition-[opacity,max-height,margin] duration-300 ${EASE} ${
                  collapsed ? "lg:max-h-0 lg:opacity-0 lg:mb-0" : "mb-2 max-h-6 opacity-100"
                }`}
              >
                {section.title}
              </p>

              {/* Pemisah tipis saat ciut (pengganti judul) */}
              {sectionIndex > 0 && (
                <div
                  aria-hidden="true"
                  className={`mx-auto mb-2 h-px w-6 bg-white/10 transition-opacity duration-300 ${EASE} ${
                    collapsed ? "lg:opacity-100" : "lg:hidden"
                  }`}
                />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SparkLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/projects"}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        group relative flex h-10 items-center gap-3
                        overflow-hidden rounded-xl border px-3
                        text-[13px] font-medium
                        transition-[padding,gap,background-color,border-color,color,box-shadow] duration-300 ${EASE}
                        ${collapsed ? "lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:gap-0 lg:px-0" : ""}
                        ${
                          isActive
                            ? "border-[#A21E1E]/60 bg-[#A21E1E]/[0.12] text-white shadow-[0_0_18px_-4px_rgba(162,30,30,0.9),inset_0_0_16px_-6px_rgba(224,85,85,0.6)]"
                            : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_14px_-6px_rgba(255,255,255,0.3)]"
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            strokeWidth={1.8}
                            className={`shrink-0 transition-colors duration-200 ${
                              isActive
                                ? "text-white"
                                : "text-white/45 group-hover:text-white"
                            }`}
                          />

                          <span className={`truncate ${fadeText(collapsed)}`}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </SparkLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {/* Profil di bawah sidebar: foto, nama, dan jabatan */}
        <div className={`shrink-0 px-4 pb-4 pt-3 transition-[padding] duration-300 ${EASE} ${
          collapsed ? "lg:px-2" : "lg:px-3"
        }`}>
          <div className={`flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 transition-[padding,gap,width] duration-300 ${EASE} ${
            collapsed ? "lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:py-1.5 lg:border-transparent lg:bg-transparent" : ""
          }`}>
            <img
              src={reinhartPhoto}
              alt="Reinhart profile"
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
            />

            <div className={`min-w-0 flex-1 ${fadeText(collapsed)}`}>
              <p className="truncate text-[13px] font-semibold leading-tight text-white">
                Reinhart Okta
              </p>
              <p className="truncate text-[11px] leading-tight text-white/50">
                Manager
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
