
import { useState, useEffect, useRef } from "react";
import javaLogo from "../../assets/images/Java_logo.png";
import {
  Menu,
  ChevronDown,
  Database,
  Printer,
  Bell,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  Monitor,
  Sun,
  Moon,
  Settings,
  LogOut,
} from "lucide-react";

// Desain token sama dengan halaman lain (panel kaca merah-hitam)
const BTN =
  "rounded-xl border border-white/10 bg-white/[0.05] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/25 hover:bg-white/[0.09] hover:text-white";

export default function Header({ onMenuClick }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [appearance, setAppearance] = useState(
    () => localStorage.getItem("appearance") || "dark"
  );

  const headerRef = useRef(null);

  const notificationCount = 0;

  // Terapkan tema (System, Light, Dark) sesuai pilihan tersimpan
  useEffect(() => {
    const root = document.documentElement;

    const applyAppearance = (mode) => {
      const resolved =
        mode === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : mode;

      root.dataset.appearance = mode;
      root.dataset.theme = resolved;
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
    };

    applyAppearance(appearance);
    localStorage.setItem("appearance", appearance);

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      if (appearance === "system") {
        applyAppearance("system");
      }
    };

    media.addEventListener("change", handleSystemChange);

    return () => {
      media.removeEventListener("change", handleSystemChange);
    };
  }, [appearance]);

  // Tutup dropdown workspace saat klik di luar atau Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setWorkspaceOpen(false);
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setWorkspaceOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleWorkspace = () => {
    setWorkspaceOpen((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Header Spacer */}
      <div className="h-0 max-[700px]:h-[64px]" />

      <header
        ref={headerRef}
        className="
          sticky top-0 z-40
          flex h-[64px] min-h-[64px] items-center justify-between gap-3
          border-b border-white/[0.08]
          bg-black px-4 py-0 text-white
          font-['Plus_Jakarta_Sans',_'Inter',sans-serif]
          max-[700px]:fixed max-[700px]:left-0
          max-[700px]:right-0 max-[700px]:top-0
          max-[700px]:h-[60px] max-[700px]:min-h-[60px]
          max-[700px]:bg-black
          max-[700px]:px-3
        "
      >
        {/* LEFT */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* Hamburger */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className={`
              hidden h-10 w-10 shrink-0 place-items-center
              ${BTN}
              max-[700px]:grid
            `}
          >
            <Menu size={20} />
          </button>

          {/* Workspace Switcher */}
          <div className="relative min-w-0 flex-1 md:flex-none">
            <button
              type="button"
              onClick={toggleWorkspace}
              className={`
                flex h-[46px] w-full max-w-[280px]
                min-w-0 items-center gap-2.5
                rounded-xl border border-white/[0.09]
                bg-black px-2.5
                transition hover:border-white/20 hover:bg-[#0a0a0a]
                max-[700px]:h-[42px]
                max-[700px]:max-w-none
              `}
            >
              <span className="
                grid h-8 w-8 shrink-0 place-items-center max-[700px]:hidden
                overflow-hidden rounded-lg bg-[#A21E1E]
              ">
                <img src={javaLogo} alt="Java logo" className="h-full w-full object-contain" />
              </span>

              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2.5 whitespace-nowrap text-[13px] font-semibold">
                  JAVAFX
                  <span className="
                    rounded-[4px] bg-white/85
                    px-[5px] py-[2px] text-[9px]
                    font-bold leading-none text-[#120809]
                    max-[360px]:hidden
                  ">
                    LIVE
                  </span>
                </span>

                <span className="block truncate text-[11px] text-white/55 max-[700px]:hidden">
                  Forex & Commodities Brokerage
                </span>
              </span>

              <ChevronDown
                size={13}
                className="ml-1.5 shrink-0 text-white/55"
              />
            </button>

            {/* Workspace Dropdown */}
            {workspaceOpen && (
              <div className="
                absolute left-0 top-[calc(100%+8px)]
                z-[60] w-[300px] max-w-[90vw]
                rounded-xl border border-white/[0.09]
                bg-[#1a0d10]/95 p-2
                shadow-[0_18px_44px_rgba(0,0,0,0.6)]
                backdrop-blur-xl
              ">
                <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.05] p-2.5">
                  <span className="
                    grid h-[28px] w-[28px]
                    shrink-0 place-items-center
                    overflow-hidden rounded-md bg-[#A21E1E]
                  ">
                    <img src={javaLogo} alt="Java logo" className="h-full w-full object-contain" />
                  </span>

                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      JAVAFX
                    </p>
                    <p className="text-[11px] text-white/55">
                      Forex & Commodities Brokerage
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Source */}
          <a
            href="#"
            title="Source: Google Sheets"
            className={`
              flex h-9 items-center justify-center gap-2
              whitespace-nowrap rounded-lg px-3
              text-[12px] font-medium text-white/85
              ${BTN}
              max-[1000px]:w-9 max-[1000px]:px-0
            `}
          >
            <Database size={14} />
            <span className="max-[1000px]:hidden">
              Source: Google Sheets
            </span>
          </a>

          {/* Executive Brief */}
          <a
            href="#"
            title="Executive Brief"
            className={`
              flex h-9 items-center justify-center gap-2
              whitespace-nowrap rounded-lg px-3
              text-[12px] font-medium text-white/85
              ${BTN}
              max-[1000px]:w-9 max-[1000px]:px-0
              max-[480px]:hidden
            `}
          >
            <Printer size={14} />
            <span className="max-[1000px]:hidden">
              Executive Brief
            </span>
          </a>

          {/* Notifications */}
          <a
            href="#"
            title="Notifications"
            aria-label={`Notifications, ${notificationCount} unread`}
            className={`
              relative flex h-9 w-9 shrink-0
              items-center justify-center rounded-lg
              text-white/85 ${BTN}
            `}
          >
            <Bell size={15} />

            {notificationCount > 0 && (
              <span className="
                absolute -right-[8px] -top-[7px]
                grid h-[18px] min-w-[18px] place-items-center
                rounded-full border-2 border-[#120809]
                bg-[#A21E1E] px-[4px]
                text-[10px] font-bold text-white
              ">
                {notificationCount > 99
                  ? "99+"
                  : notificationCount}
              </span>
            )}
          </a>

          {/* Profil: inisial saja, dropdown berisi info akun, menu, dan tema */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/85 ${BTN}`}
            >
              <UserRound size={16} />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[280px] max-w-[90vw] overflow-hidden rounded-2xl py-1.5 border border-white/[0.09] bg-[#0b0b0b]/95 shadow-[0_18px_44px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              >
                <div className="border-b border-white/[0.08] py-1.5">
                  {[
                    { label: "KPI configuration", icon: SlidersHorizontal },
                    { label: "Team access", icon: UserCog },
                    { label: "Accounts", icon: Users },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.label}
                        href="#"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] text-white/85 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Icon size={16} strokeWidth={1.8} className="shrink-0 text-white/60" />
                        {item.label}
                      </a>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[13px] text-white/85">Appearance</span>
                  <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/40 p-0.5">
                    {[
                      { id: "system", label: "System", icon: Monitor },
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const selected = appearance === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setAppearance(mode.id)}
                          aria-label={`${mode.label} appearance`}
                          aria-pressed={selected}
                          className={`grid h-7 w-8 place-items-center rounded-md transition ${
                            selected ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
                          }`}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-white/[0.08] py-1.5">
                  <a
                    href="#"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-3 text-[13px] text-white/85 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Settings size={16} strokeWidth={1.8} className="shrink-0 text-white/60" />
                    Settings
                  </a>
                  <a
                    href="#"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-3 text-[13px] text-red-300 transition hover:bg-white/[0.06] hover:text-red-200"
                  >
                    <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
                    Log out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
