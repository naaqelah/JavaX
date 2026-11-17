import { useMemo, useState } from "react";
import { InstagramLogo, TikTokLogo } from "../components/icons/SocialLogos";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Camera,
  Plus,
  Search,
  RefreshCw,
  X,
  CircleAlert,
} from "lucide-react";

// Desain token sama dengan halaman lain (Overview, Projects, Inventory, dst.)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const TILE =
  "rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/20";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white px-4 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-[#B82323]/60 [color-scheme:dark]";
const LABEL = "mb-1.5 block text-[12px] font-medium text-white/85";

const initialPromotors = [
  {
    id: 1,
    name: "Alfian",
    photo: null,
    ig: "@javafx.promo01",
    ig_status: "not_found",
    tt: "@javafx.trader01",
    tt_status: "not_found",
    done: 0,
    total: 3,
  },
  {
    id: 2,
    name: "Gusti",
    photo: null,
    ig: "@scalping.id",
    ig_status: "missing",
    tt: null,
    tt_status: "verified",
    done: 0,
    total: 3,
  },
  {
    id: 3,
    name: "Putri",
    photo: null,
    ig: "@chart.notes",
    ig_status: "not_found",
    tt: "@market.recap.id",
    tt_status: "verified",
    done: 0,
    total: 3,
  },
  {
    id: 4,
    name: "Rizky",
    photo: null,
    ig: "@forex.insight",
    ig_status: "verified",
    tt: "@forex.insight.tt",
    tt_status: "verified",
    done: 0,
    total: 3,
  },
];

const promoterOptions = [
  { id: 1, name: "Alfian" },
  { id: 2, name: "Gusti" },
  { id: 3, name: "Putri" },
  { id: 4, name: "Rizky" },
];

const initialStats = {
  verified: 0,
  not_found: 4,
  missing_tiktok: 1,
  not_checked: 0,
};

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

const GRID_COLS =
  "grid-cols-[minmax(150px,1.1fr)_minmax(190px,1.5fr)_minmax(150px,1.2fr)_minmax(220px,1.8fr)_minmax(130px,1fr)_130px]";

function Panel({ children, className = "" }) {
  return (
    <section
      className={`mb-5 rounded-2xl p-4 md:p-5 ${GLASS} ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeading({ title, description, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-[12px] text-white/55">
            {description}
          </p>
        )}

      </div>

      {children}
    </div>
  );
}

// Status yang ditampilkan per akun:
// - tidak ada handle  -> Missing (akun belum diisi, status data diabaikan)
// - ada handle        -> status verifikasi; "missing" dengan handle berarti belum ditemukan
function displayStatus(handle, status) {
  if (!handle) return "missing";
  if (status === "missing") return "not_found";
  return status;
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.not_found;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${config.className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 p-3.5 ${TILE}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04] text-white">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-white/55">{label}</p>
        <p className="text-lg font-semibold tracking-tight tabular-nums text-white">{value}</p>
      </div>
    </div>
  );
}

function SocialAccount({ type, username }) {
  const isInstagram = type === "ig";

  return (
    <div className="flex min-h-9 items-center gap-2.5 overflow-wrap-anywhere">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05]">
        {isInstagram ? <InstagramLogo className="h-4 w-4" /> : <TikTokLogo className="h-4 w-4" />}
      </span>

      <span
        className={`break-all text-[12px] ${
          username ? "text-white/90" : "text-white/45"
        }`}
      >
        {username || "— Not provided"}
      </span>
    </div>
  );
}

function PromoterAvatar({ promoter }) {
  return (
    <div className="flex h-9 items-center gap-2.5 text-[13px] font-semibold text-white">
      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[#A21E1E]/40 to-white/[0.06] text-[13px]">
        {promoter.photo ? (
          <img
            src={promoter.photo}
            alt={promoter.name}
            className="h-full w-full object-cover"
          />
        ) : (
          promoter.name.charAt(0).toUpperCase()
        )}
      </div>

      {promoter.name}
    </div>
  );
}

export default function Promotors() {
  const navigate = useNavigate();

  const [promotors, setPromotors] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("jgf-promotors") ||
          JSON.stringify(initialPromotors)
      );
    } catch {
      return initialPromotors;
    }
  });

  const [accountOptions, setAccountOptions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("jgf-promotor-options") ||
          JSON.stringify(promoterOptions)
      );
    } catch {
      return promoterOptions;
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [selectedPromoter, setSelectedPromoter] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pairs, setPairs] = useState([
    { instagram: "", tiktok: "" },
  ]);

  const [sheetUrl, setSheetUrl] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [showImportMessage, setShowImportMessage] = useState(false);

  const [stats] = useState(initialStats);

  const [showAccountMessage, setShowAccountMessage] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");

  const [rosterPeriod] = useState(
    "Week 2 — September 2026 · 08-14 September 2026"
  );

  const [reportingPeriod] = useState("Week 1 — September 2026");

  const attention = promotors.filter(
    (item) =>
      item.ig_status !== "verified" ||
      item.tt_status !== "verified"
  ).length;

  const filteredPromotors = useMemo(() => {
    const term = search.trim().toLowerCase();

    return promotors.filter((item) => {
      const matchesSearch =
        !term ||
        `${item.name} ${item.ig || ""} ${item.tt || ""}`
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        !statusFilter ||
        item.ig_status === statusFilter ||
        item.tt_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [promotors, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPromotors.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const visiblePromotors = filteredPromotors.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const savePromotors = (updated) => {
    setPromotors(updated);
    localStorage.setItem("jgf-promotors", JSON.stringify(updated));
  };

  // Klik Post: centang sampai post tersebut; klik post yang sudah tercentang membatalkan dari post itu
  const togglePost = (promoterId, index) => {
    savePromotors(
      promotors.map((item) => {
        if (item.id !== promoterId) return item;
        const nextDone = index < item.done ? index : index + 1;
        return { ...item, done: Math.min(nextDone, item.total) };
      })
    );
  };

  const updatePair = (index, field, value) => {
    setPairs((previous) =>
      previous.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair
      )
    );
  };

  const addPair = () => {
    setPairs((previous) => [
      ...previous,
      { instagram: "", tiktok: "" },
    ]);
  };

  const resetAccountForm = () => {
    setSelectedPromoter("");
    setDisplayName("");
    setPairs([{ instagram: "", tiktok: "" }]);
    setShowAccountMessage(false);
  };

  const handleSaveAccount = (event) => {
    event.preventDefault();

    const selected = accountOptions.find(
      (person) => String(person.id) === String(selectedPromoter)
    );

    if (!selected) return;

    const name = displayName.trim() || selected.name;

    const validPairs = pairs.filter(
      (pair) => pair.instagram.trim() || pair.tiktok.trim()
    );

    if (validPairs.length === 0) {
      setAccountMessage("Enter at least one Instagram or TikTok account.");
      setShowAccountMessage(true);
      return;
    }

    const newPromotors = validPairs.map((pair, index) => ({
      id: Date.now() + index,
      name,
      photo: null,
      ig: pair.instagram.trim() || null,
      ig_status: pair.instagram.trim() ? "not_found" : "missing",
      tt: pair.tiktok.trim() || null,
      tt_status: pair.tiktok.trim() ? "not_found" : "missing",
      done: 0,
      total: 3,
    }));

    const updated = [...promotors, ...newPromotors];

    savePromotors(updated);

    setAccountMessage("Account added to the roster.");
    setShowAccountMessage(true);

    resetAccountForm();
  };

  const handleImport = (event) => {
    event.preventDefault();

    if (!sheetUrl.trim()) {
      setImportMessage("Please enter a URL or Spreadsheet ID first.");
    } else {
      setImportMessage(
        "Import simulation: Google Sheets is not connected to the backend yet."
      );
    }

    setShowImportMessage(true);
  };

  const handleVerify = () => {
    alert(
      "TikTok verification is not connected to the API yet. Account status has not been changed."
    );
  };

  const goToPage = (nextPage) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  };

  const showingText = filteredPromotors.length
    ? `Showing ${startIndex + 1} - ${Math.min(
        startIndex + rowsPerPage,
        filteredPromotors.length
      )} of ${filteredPromotors.length} promoters`
    : "Showing 0 promoters";

  return (
    <div className="pm-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .pm-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .pm-root button, .pm-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .pm-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* PAGE HEADER */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
            Promoter
          </h1>
          <p className="mt-1.5 text-xs text-white/55">
            Handles, verification, checklists
          </p>
        </div>

        {/* ATTENTION BANNER */}
        {attention > 0 && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("not_found");
              setPage(1);
              document
                .getElementById("promoter-roster")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mb-5 flex min-h-9 py-1.5 md:h-10 md:py-0 w-full items-center gap-2.5 rounded-xl border border-[#B82323]/25 bg-[#A21E1E]/10 px-3 text-left text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:brightness-110"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#A21E1E]/30"><AlertTriangle size={14} /></span>
            {attention} item{attention > 1 ? "s" : ""} needs attention
            <span className="ml-auto flex items-center gap-1 text-[12px] text-white/55">View<ArrowRight size={14} /></span>
          </button>
        )}

        {/* IMPORT FROM SHEET */}
        <Panel>
          <h2 className="mb-1 text-[15px] font-semibold tracking-tight text-white">
            Import from sheet
          </h2>

          <p className="text-[12px] text-white/55">
            Reads the tracking sheet your scraper writes. Nothing is
            written back to it.
          </p>

          <div className="my-4 border-t border-white/[0.08]" />

          <form onSubmit={handleImport}>
            <label
              htmlFor="sheet"
              className={LABEL}
            >
              Google Sheets URL or Spreadsheet ID
            </label>

            <input
              id="sheet"
              type="text"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                setShowImportMessage(false);
              }}
              className={`${FIELD} rounded-full px-5`}
              placeholder="Paste your Google Sheets link here..."
            />

            <p className="my-2.5 text-[11px] text-white/50">
              Make sure the spreadsheet is accessible to the connected
              account. Connect spreadsheet
            </p>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white text-[13px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(162,30,30,0.34),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-110"
            >
              <ArrowUpRight size={15} />
              Connect spreadsheet
            </button>

            {showImportMessage && (
              <p className={`mt-3 px-3 py-2.5 text-[11px] text-amber-300 ${INNER}`}>
                {importMessage}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-[11px] text-white/50">
              <Info size={13} />
              Data is imported in read-only mode. Changes must be made
              in the source spreadsheet.
            </div>
          </form>
        </Panel>

        {/* ADD ACCOUNTS */}
        <Panel>
          <PanelHeading
            title="Add accounts"
            description="Register promoter accounts and connect their Instagram and TikTok usernames."
          >
            <div className={`flex items-center gap-2.5 px-3.5 py-2 ${INNER}`}>
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04] text-white">
                <CalendarDays size={15} />
              </div>
              <div>
                <p className="text-[11px] text-white/55">
                  Reporting Period
                </p>
                <p className="text-[12px] font-semibold text-white">{reportingPeriod}</p>
              </div>
            </div>
          </PanelHeading>

          <div className={`px-4 py-4 md:px-5 ${INNER}`}>
            <h3 className="mb-3 text-[13px] font-semibold text-white">
              Promoter information
            </h3>

            <form onSubmit={handleSaveAccount}>
              <select
                value={selectedPromoter}
                onChange={(e) => setSelectedPromoter(e.target.value)}
                required
                className={`${FIELD} appearance-none`}
              >
                <option value="" disabled>
                  Choose a promoter
                </option>

                {accountOptions.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                    className="bg-[#141414]"
                  >
                    {person.name}
                  </option>
                ))}
              </select>

              <label
                htmlFor="displayName"
                className={`${LABEL} mt-3`}
              >
                Display name (optional)
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={FIELD}
                placeholder="Enter display name"
              />

              <h3 className="mb-3 mt-6 border-t border-white/[0.08] pt-5 text-[13px] font-semibold text-white">
                Social media accounts
              </h3>

              <div className="space-y-3">
                {pairs.map((pair, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-2 gap-3 max-md:grid-cols-1 ${
                      index > 0
                        ? "border-t border-dashed border-white/15 pt-3"
                        : ""
                    }`}
                  >
                    <div>
                      <label className={LABEL}>
                        Instagram username
                      </label>
                      <div className="relative">
                        <Camera
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C42B2B]"
                        />
                        <input
                          type="text"
                          value={pair.instagram}
                          onChange={(e) =>
                            updatePair(index, "instagram", e.target.value)
                          }
                          className={`${FIELD} pl-10`}
                          placeholder="@username_instagram"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL}>
                        Tiktok username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-white/75">
                          ♪
                        </span>
                        <input
                          type="text"
                          value={pair.tiktok}
                          onChange={(e) =>
                            updatePair(index, "tiktok", e.target.value)
                          }
                          className={`${FIELD} pl-10`}
                          placeholder="@username_tiktok"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12px] text-white/55">
                  {pairs.length} account pair{pairs.length > 1 ? "s" : ""}
                </span>

                <button
                  type="button"
                  onClick={addPair}
                  className={PILL}
                >
                  <Plus size={13} />
                  Add Another Pair
                </button>
              </div>

              {showAccountMessage && (
                <p className={`mt-3 px-3 py-2.5 text-[11px] text-amber-300 ${INNER}`}>
                  {accountMessage}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2.5 border-t border-white/[0.08] pt-4 max-[480px]:flex-col">
                <button
                  type="button"
                  onClick={resetAccountForm}
                  className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-lg border border-white/10 bg-transparent px-4 text-[12px] font-medium text-white/65 transition hover:border-white/25 hover:text-white max-[480px]:w-full"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`${PILL_PRIMARY} max-[480px]:w-full`}
                >
                  <Check size={14} />
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </Panel>

        {/* ROSTER */}
        <Panel>
          <PanelHeading
            title="Promoter roster & post checklist"
            description="Reads the tracking sheet your scraper writes. Nothing is written back to it."
          >
            <div className="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:flex-col max-md:items-stretch">
              <span className={`inline-flex h-9 items-center px-3.5 text-[12px] font-medium text-white/85 ${INNER} max-md:w-full`}>
                {rosterPeriod}
              </span>

              <button
                type="button"
                onClick={handleVerify}
                className={`${PILL} max-md:w-full`}
              >
                <RefreshCw size={13} />
                Verify Tiktok
              </button>
            </div>
          </PanelHeading>

          <div className="mb-4 border-t border-white/[0.08]" />

          <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[480px]:grid-cols-1">
            <StatCard
              icon={CheckCircle2}
              label="Verified"
              value={stats.verified}
            />
            <StatCard
              icon={X}
              label="Not found"
              value={stats.not_found}
            />
            <StatCard
              icon={AlertTriangle}
              label="Missing Tiktok"
              value={stats.missing_tiktok}
            />
            <StatCard
              icon={Clock}
              label="Not checked"
              value={stats.not_checked}
            />
          </div>
        </Panel>

        {/* SEARCH AND FILTER */}
        <div
          id="promoter-roster"
          className="mb-3 grid grid-cols-[1fr_220px] gap-2.5 max-[900px]:grid-cols-1"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search promoter, IG or TikTok username..."
              className={`${FIELD} pl-10`}
            />
          </div>

          <div className="relative h-10 rounded-lg border border-white/10 bg-white/[0.05]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-full w-full cursor-pointer appearance-none rounded-lg bg-transparent px-3.5 pr-9 text-[13px] text-white outline-none [color-scheme:dark]"
            >
              <option value="">All status</option>
              <option value="verified">Verified</option>
              <option value="not_found">Not found</option>
              <option value="missing">Missing</option>
            </select>

            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/55"
            />
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="overflow-x-auto rounded-2xl max-md:overflow-visible">
          <div className={`min-w-[1030px] overflow-hidden rounded-2xl ${GLASS} max-md:min-w-0 max-md:overflow-visible max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:backdrop-blur-none`}>
            <div className={`grid ${GRID_COLS} items-center gap-3 border-b border-white/[0.12] bg-white/[0.04] px-5 text-[11px] font-semibold uppercase tracking-wider text-white/55 max-md:hidden`}>
              <div className="py-2.5">Promoter</div>
              <div>Social media account</div>
              <div>Verification status</div>
              <div>Post Checklist (3 post)</div>
              <div>Progress</div>
              <div>Actions</div>
            </div>

            {visiblePromotors.map((promoter) => {
              const percentage =
                promoter.total > 0
                  ? Math.round(
                      (promoter.done / promoter.total) * 100
                    )
                  : 0;

              return (
                <div
                  key={promoter.id}
                  className={`grid min-h-[96px] ${GRID_COLS} items-start gap-3 border-b border-white/[0.06] px-5 py-3 text-[13px] transition-colors duration-150 last:border-b-0 hover:bg-white/[0.035] max-md:mb-3 max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-2 max-md:rounded-xl max-md:border max-md:border-white/[0.08] max-md:bg-black/40 max-md:p-3.5 max-md:last:border-b`}
                >
                  <div className="flex min-w-0 items-center max-md:col-start-1 max-md:row-start-1">
                    <PromoterAvatar promoter={promoter} />
                  </div>

                  <div className="min-w-0 max-md:col-start-1 max-md:row-start-2">
                    <SocialAccount
                      type="ig"
                      username={promoter.ig}
                    />
                    <SocialAccount
                      type="tt"
                      username={promoter.tt}
                    />
                  </div>

                  <div className="min-w-0 max-md:col-start-2 max-md:row-start-2 max-md:justify-self-end">
                    <div className="flex min-h-9 items-center">
                      <StatusBadge status={displayStatus(promoter.ig, promoter.ig_status)} />
                    </div>
                    <div className="flex min-h-9 items-center">
                      <StatusBadge status={displayStatus(promoter.tt, promoter.tt_status)} />
                    </div>
                  </div>

                  <div className="flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2 max-md:col-span-2 max-md:row-start-4 max-md:border-t max-md:border-white/[0.08] max-md:pt-3">
                    {Array.from(
                      { length: promoter.total },
                      (_, index) => (
                        <button
                          type="button"
                          key={index}
                          role="checkbox"
                          aria-checked={index < promoter.done}
                          aria-label={`Post ${index + 1}`}
                          onClick={() => togglePost(promoter.id, index)}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1 text-[12px] text-white/85 transition hover:text-white active:scale-[0.97]"
                        >
                          <span
                            className={`relative grid h-[16px] w-[16px] place-items-center rounded-full border-[1.5px] ${
                              index < promoter.done
                                ? "border-emerald-400 bg-emerald-400"
                                : "border-white/35"
                            }`}
                          >
                            {index < promoter.done && (
                              <Check size={10} className="text-white" />
                            )}
                          </span>
                          Post {index + 1}
                        </button>
                      )
                    )}
                  </div>

                  <div className="pt-2 max-md:col-span-2 max-md:row-start-5">
                    <div className="h-1.5 w-[calc(100%-12px)] overflow-hidden rounded-full bg-white/10 max-md:w-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8F2028] to-[#C42B2B]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <small className="mt-1.5 block text-[11px] tabular-nums text-white/55">
                      {promoter.done}/{promoter.total}
                    </small>
                  </div>

                  <div className="flex items-center max-md:col-span-2 max-md:row-start-1 max-md:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/promotors/${promoter.id}`)}
                      className={PILL + " h-8 px-3"}
                    >
                      View
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {visiblePromotors.length === 0 && (
              <div className="p-8 text-center text-[12px] text-white/55">
                No promoters match.
              </div>
            )}
          </div>
        </div>

        {/* TABLE FOOTER */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] max-md:justify-center">
          <div className="text-white/55">{showingText}</div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-white/55">
            <span className="mr-1">Rows per page</span>

            <div className="relative h-9 w-[76px] rounded-lg border border-white/10 bg-white/[0.05]">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="h-full w-full cursor-pointer appearance-none rounded-lg bg-transparent pl-3 pr-6 text-[12px] font-medium text-white outline-none [color-scheme:dark]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/55"
              />
            </div>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white transition hover:border-white/25 hover:bg-white/[0.09] disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/25 bg-white text-[12px] font-semibold text-[#120809]"
            >
              {currentPage}
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white transition hover:border-white/25 hover:bg-white/[0.09] disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
