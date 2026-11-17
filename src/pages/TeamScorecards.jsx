import { Fragment, useMemo, useState } from "react";
import PersonAvatar from "../components/ui/PersonAvatar";
import GlassSelect from "../components/ui/GlassSelect";
import { MONTH_OPTIONS } from "../components/ui/monthOptions";
import PersonKpiList from "../components/analytics/PersonKpiList";
import {
  ArrowRight,
  ChevronDown,
  ChevronDown as RowChevron,
  Calculator,
  FileSpreadsheet,
  FileText,
  FileUp,
  Inbox,
  Info,
  CalendarDays,
  Users,
  AlertTriangle,
} from "lucide-react";

// Desain token sama dengan Overview, MarketingPerformance, MyWork & SocialMedia
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";

const initialPeople = [
  { id: 1, name: "Lidia", role: "Lead Performance Marketing", kpis: 2, composite: 96.1, tier: "on_track" },
  { id: 2, name: "Bella", role: "Content Creator", kpis: 1, composite: 95.8, tier: "on_track" },
  { id: 3, name: "Michael", role: "Lead Performance Marketing", kpis: 1, composite: 87.3, tier: "attention" },
  { id: 4, name: "Jason", role: "Performing Marketing Executive", kpis: 1, composite: null, tier: "no_data" },
  { id: 5, name: "Jodie", role: "Content Strategist", kpis: 1, composite: null, tier: "no_data" },
  { id: 6, name: "Lidia", role: "Marketing Operations Executive", kpis: 1, composite: null, tier: "no_data" },
];

const months = [
  "October 2026",
  "September 2026",
  "August 2026",
  "July 2026",
];

const tierConfig = {
  on_track: {
    label: "On Track",
    color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
    dot: "bg-emerald-400",
  },
  attention: {
    label: "Need Attention",
    color: "text-amber-300 bg-amber-300/10 border-amber-300/25",
    dot: "bg-amber-300",
  },
  no_data: {
    label: "No Data",
    color: "text-white/60 bg-white/[0.05] border-white/10",
    dot: "bg-white/40",
  },
};

const kpiOptions = [
  "Leads per month",
  "Content published",
  "Audience growth",
  "Engagement rate",
  "Marketing conversion",
];

const axis = [0, 30, 60, 90, 100, 120];

function getPercentage(value) {
  return Math.min(100, Math.max(0, (value / 120) * 100));
}

function downloadCSV(people) {
  const rows = [
    ["Person", "Role", "KPIs", "Composite", "Tier"],
    ...people.map((p) => [
      p.name,
      p.role,
      p.kpis,
      p.composite ?? "-",
      tierConfig[p.tier].label,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "team-scorecards.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const GRID_COLS =
  "grid-cols-[44px_minmax(170px,1.5fr)_minmax(210px,2.2fr)_70px_minmax(140px,1.3fr)_150px]";

export default function TeamScorecards() {
  const [selectedMonth, setSelectedMonth] = useState("October 2026");
  const [people, setPeople] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jgf-team-scorecards")) || initialPeople;
    } catch {
      return initialPeople;
    }
  });

  const [showRanking, setShowRanking] = useState(true);
  const [showAssign, setShowAssign] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const [personId, setPersonId] = useState("");
  const [kpi, setKpi] = useState("");
  const [openPerson, setOpenPerson] = useState(null);
  const openedPerson = people.find((person) => person.id === openPerson) ?? null;
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("1");
  const [message, setMessage] = useState("");

  const ranked = useMemo(
    () =>
      [...people]
        .filter((p) => p.composite !== null)
        .sort((a, b) => b.composite - a.composite),
    [people]
  );

  const unranked = people.filter((p) => p.composite === null).length;
  const attention = people.filter((p) => p.tier === "attention").length;

  function savePeople(updated) {
    setPeople(updated);
    localStorage.setItem("jgf-team-scorecards", JSON.stringify(updated));
  }

  function handleAssign(e) {
    e.preventDefault();

    if (!personId || !kpi) {
      setMessage("Please select a person and KPI.");
      return;
    }

    const selectedPerson = people.find((p) => p.id === Number(personId));

    if (!selectedPerson) return;

    const updated = people.map((p) =>
      p.id === Number(personId)
        ? { ...p, kpis: p.kpis + 1 }
        : p
    );

    savePeople(updated);

    setMessage(
      `${kpi} has been assigned to ${selectedPerson.name}. This is a local frontend simulation.`
    );

    setPersonId("");
    setKpi("");
    setTarget("");
    setWeight("1");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="ts-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .ts-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .ts-root button, .ts-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .ts-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-4 lg:px-5">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
              Team Scorecards
            </h1>
            <p className="mt-1.5 text-xs text-white/55">
              Team Performance from the latest synchronised data
            </p>
          </div>

          <div className="grid w-full grid-cols-2 items-center gap-3 md:flex md:w-auto md:justify-end md:gap-2">
            <div className="relative col-span-2 md:col-span-1">
              <GlassSelect
                label="Month"
                className="w-full md:w-[190px]"
                icon={<CalendarDays size={14} />}
                value={selectedMonth}
                options={MONTH_OPTIONS}
                onChange={setSelectedMonth}
              />
            </div>

            <button onClick={handlePrint} className={PILL + " h-10 w-full justify-center md:h-9 md:w-auto"}>
              <Calculator size={14} />
              Board Dossier
            </button>

            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setShowExport(!showExport)}
                className={PILL_PRIMARY + " h-10 w-full justify-center px-3.5 md:h-9 md:w-auto"}
              >
                <FileUp size={14} />
                Export As
                <ChevronDown size={13} />
              </button>

              {showExport && (
                <div className={`absolute right-0 top-11 z-30 w-44 rounded-xl bg-[#1a0d10]/95 p-1.5 shadow-2xl ${GLASS}`}>
                  <button
                    onClick={() => {
                      handlePrint();
                      setShowExport(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileText size={14} />
                    PDF / Print
                  </button>

                  <button
                    onClick={() => {
                      downloadCSV(people);
                      setShowExport(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileSpreadsheet size={14} />
                    Excel / CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ATTENTION */}
        {attention > 0 && (
          <div className="mb-5 flex min-h-10 py-2.5 md:h-10 md:py-0 items-center gap-2.5 rounded-xl border border-[#B82323]/25 bg-[#A21E1E]/10 px-3 text-[14px] md:text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="grid h-7 w-7 max-md:h-9 max-md:w-9 shrink-0 place-items-center rounded-full bg-[#A21E1E]/30"><AlertTriangle size={14} /></span>
            {attention} item{attention > 1 ? "s" : ""} needs attention
            <span className="ml-auto flex items-center gap-1 text-[12px] text-white/55">View<ArrowRight size={14} /></span>
          </div>
        )}

        {/* SUBMITTED RESULTS */}
        <div className={`mb-5 rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="flex items-center gap-3 text-[15px] font-semibold text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C42B2B]/30 bg-[#A21E1E]/20 text-[#E04848]">
              <Inbox size={16} />
            </div>
            Your submitted results
          </div>
          <p className="mt-2 pl-12 text-[12px] leading-relaxed text-white/55">
            Sent for review. Figure unchanged until approved.
          </p>
        </div>

        {/* TEAM LIST (phone): kartu rapi, klik untuk membuka daftar KPI */}
        <div className="mb-6 space-y-3 md:hidden">
          {people.map((person) => {
            const tier = tierConfig[person.tier];
            const open = openPerson === person.id;

            return (
              <div
                key={person.id}
                className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                  open ? "border-white/20 bg-white/[0.05]" : "border-white/[0.09] bg-black/40"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenPerson(open ? null : person.id)}
                  className="flex w-full items-center gap-3.5 px-4 pb-3 pt-4 text-left"
                >
                  <PersonAvatar name={person.name} className="h-10 w-10" />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-white">{person.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-white/55">{person.role}</span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-white/55 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
                  />
                </button>

                <div className="grid grid-cols-3 gap-3 border-t border-white/[0.07] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">KPIs</p>
                    <p className="mt-1 text-[15px] font-semibold tabular-nums text-white">{person.kpis}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Composite</p>
                    <p className="mt-1 text-[15px] font-semibold tabular-nums text-white">
                      {person.composite !== null ? `${person.composite.toFixed(1)}%` : "-"}
                    </p>
                    {person.composite !== null && (
                      <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${person.tier === "attention" ? "bg-amber-300" : "bg-emerald-400"}`}
                          style={{ width: `${getPercentage(person.composite)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Tier</p>
                    <span className={`mt-1 inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${tier.color}`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tier.dot}`} />
                      {tier.label}
                    </span>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-white/[0.07]">
                    <PersonKpiList personName={person.name} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* TEAM TABLE */}
        <div className={`mb-6 hidden overflow-x-auto rounded-2xl [container-type:inline-size] md:block ${GLASS}`}>
          <div className="min-w-[780px]">
            <div className={`grid ${GRID_COLS} items-center gap-2 border-b border-white/[0.12] bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/55`}>
              <div />
              <div>Person</div>
              <div>Role/Position</div>
              <div>KPIs</div>
              <div>Composite</div>
              <div>Tier</div>
            </div>

            {people.map((person) => {
              const tier = tierConfig[person.tier];

              return (
                <Fragment key={person.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={openPerson === person.id}
                  onClick={() => setOpenPerson(openPerson === person.id ? null : person.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setOpenPerson(openPerson === person.id ? null : person.id);
                    }
                  }}
                  className={`grid min-h-[68px] cursor-pointer ${GRID_COLS} items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 transition-colors duration-150 last:border-0 hover:bg-white/[0.03] ${openPerson === person.id ? "bg-white/[0.04]" : ""}`}
                >
                  <RowChevron size={14} className={`text-white/55 transition-transform duration-200 ${openPerson === person.id ? "" : "-rotate-90"}`} />

                  <div className="flex items-center gap-3 whitespace-nowrap text-[13px] font-semibold text-white">
                    <PersonAvatar name={person.name} className="h-10 w-10" />
                    {person.name}
                  </div>

                  <div className="text-[12px] text-white/70">
                    {person.role}
                  </div>

                  <div className="text-[13px] tabular-nums text-white/90">{person.kpis}</div>

                  <div>
                    <p className="text-[13px] font-semibold tabular-nums text-white">
                      {person.composite !== null
                        ? `${person.composite.toFixed(1)}%`
                        : "-"}
                    </p>

                    {person.composite !== null && (
                      <div className="mt-1.5 h-[5px] max-w-[110px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            person.tier === "attention"
                              ? "bg-amber-300"
                              : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${getPercentage(person.composite)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tier.color}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
                      {tier.label}
                    </span>
                  </div>
                </div>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* KPI DETAIL (dibuka dari baris tim di atas) */}
        {openedPerson && (
          <div key={openedPerson.id} className={`mb-6 hidden rounded-2xl md:block ${GLASS}`}>
            <PersonKpiList personName={openedPerson.name} />
          </div>
        )}
        {/* TEAM RANKING */}
        <section className="mb-4">
          <button
            onClick={() => setShowRanking(!showRanking)}
            className={`flex h-12 w-full items-center gap-2.5 rounded-xl px-4 text-left text-[13px] font-semibold text-white transition hover:bg-white/[0.04] ${GLASS}`}
          >
            <ChevronDown
              size={14}
              className={`text-white/55 transition-transform ${
                showRanking ? "" : "-rotate-90"
              }`}
            />
            Team ranking
          </button>

          {showRanking && (
            <div className={`mt-3 rounded-2xl p-5 md:p-6 ${GLASS}`}>
              <h2 className="text-[15px] font-semibold text-white">Team ranking</h2>
              <p className="mb-7 mt-1 text-[12px] text-white/55">
                Composite across each person's reported KPIs, against the 100% rule
              </p>

              <div className="relative ml-14 mr-8 pt-8">
                <div
                  className="absolute bottom-7 top-0 z-10 border-l border-dashed border-[#C42B2B]/80"
                  style={{ left: `${getPercentage(100)}%` }}
                >
                  <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#B82323]/30 bg-[#A21E1E]/20 px-2.5 py-0.5 text-[11px] font-medium text-[#E04848]">
                    100% Target
                  </span>
                </div>

                {ranked.map((person) => {
                  const pct = getPercentage(person.composite);

                  return (
                    <div
                      key={person.id}
                      className="relative mb-3.5 h-[24px]"
                    >
                      <span className="absolute -left-14 top-0 w-12 truncate text-[11px] leading-[24px] text-white/80">
                        {person.name}
                      </span>

                      <div className="absolute inset-0 rounded-md bg-white/[0.06]">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-[#8F2028] to-[#C42B2B] shadow-lg shadow-red-900/30"
                          style={{ width: `${pct}%` }}
                        />
                        <span
                          className="absolute top-0 ml-2 text-[11px] font-semibold leading-[24px] text-white"
                          style={{ left: `${pct}%` }}
                        >
                          {Math.round(person.composite)}%
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="relative mt-4 h-6 border-t border-white/10">
                  {axis.map((value) => (
                    <span
                      key={value}
                      className={`absolute top-1 -translate-x-1/2 text-[10px] text-white/50 ${value === 90 ? "max-md:hidden" : ""}`}
                      style={{ left: `${getPercentage(value)}%` }}
                    >
                      {value}%
                    </span>
                  ))}
                </div>
              </div>

              {unranked > 0 && (
                <div className={`mt-6 flex items-center gap-3 p-3.5 text-[12px] text-white/75 ${INNER}`}>
                  <Users size={16} className="shrink-0 text-white/55" />
                  <span>
                    <strong className="font-semibold text-white">{unranked} people have</strong> no recorded result this month and are not ranked.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ASSIGN KPI */}
        <section className="mb-5">
          <button
            onClick={() => setShowAssign(!showAssign)}
            className={`flex h-12 w-full items-center gap-2.5 rounded-xl px-4 text-left text-[13px] font-semibold text-white transition hover:bg-white/[0.04] ${GLASS}`}
          >
            <ChevronDown
              size={14}
              className={`text-white/55 transition-transform ${
                showAssign ? "" : "-rotate-90"
              }`}
            />
            Assign a KPI
          </button>

          {showAssign && (
            <form
              onSubmit={handleAssign}
              className={`mt-3 rounded-2xl p-5 md:p-6 ${GLASS}`}
            >
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    Person <span className="text-[#C42B2B]">*</span>
                  </label>
                  <select
                    required
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Choose somebody</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    KPI <span className="text-[#C42B2B]">*</span>
                  </label>
                  <select
                    required
                    value={kpi}
                    onChange={(e) => setKpi(e.target.value)}
                    className={FIELD}
                  >
                    <option value="">Choose a KPI</option>
                    {kpiOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    Monthly target
                  </label>
                  <input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="No default"
                    className={FIELD}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-white/85">
                    Weight (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="1"
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  className={PILL_PRIMARY + " h-10 px-4"}
                >
                  Assign for this period
                </button>

                <span className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] text-white/75">
                  <CalendarDays size={14} />
                  August 2026
                </span>
              </div>

              {message && (
                <p className={`mt-4 p-3 text-[12px] text-white/80 ${INNER}`}>
                  {message}
                </p>
              )}
            </form>
          )}
        </section>

        {/* SOURCE INFORMATION */}
        <div className={`rounded-2xl p-5 md:p-6 ${GLASS}`}>
          <h3 className="mb-2.5 flex items-center gap-3 text-[15px] font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04]">
              <Info size={16} />
            </span>
            Where these figures come from
          </h3>
          <p className="text-[12px] leading-relaxed text-white/55 sm:pl-12">
            KPI figures are automatically synced from the source spreadsheet
            or Marketing Performance data. They are not entered manually on
            this page.
          </p>
        </div>
      </div>
    </div>
  );
}