import { Fragment, useMemo, useState } from "react";
import PersonAvatar from "../components/ui/PersonAvatar";
import GlassSelect from "../components/ui/GlassSelect";
import { MONTH_OPTIONS } from "../components/ui/monthOptions";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Plus,
} from "lucide-react";

// Desain token sama dengan Overview, MarketingPerformance, MyWork, SocialMedia, TeamScorecards, ContentCalendar & ProjectDetail
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD_SELECT =
  "h-9 min-w-[170px] appearance-none rounded-lg border border-white/10 bg-white/[0.05] pl-3.5 pr-9 text-xs text-white outline-none transition focus:border-[#B82323]/60 [color-scheme:dark]";

const initialProjects = [
  {
    id: 1,
    name: "Test Notification",
    owner: "Jason",
    category: "Web",
    done: 8,
    total: 8,
    status: "completed",
  },
  {
    id: 2,
    name: "Q3 Creative Refresh",
    owner: "Agung",
    category: "Content Production",
    done: 20,
    total: 20,
    status: "completed",
  },
  {
    id: 3,
    name: "Test Colab",
    owner: "Anabele",
    category: "Social Media",
    done: 1,
    total: 3,
    status: "in_progress",
  },
  {
    id: 4,
    name: "Brand Guidelines",
    owner: "Charlene",
    category: "Brand Identity",
    done: 20,
    total: 20,
    status: "completed",
  },
  {
    id: 5,
    name: "Influencer Brief",
    owner: "Michael",
    category: "Partnerships",
    done: 20,
    total: 20,
    status: "completed",
  },
  {
    id: 6,
    name: "Launch Video",
    owner: "Lidia",
    category: "Video Production",
    done: 20,
    total: 20,
    status: "completed",
  },
];

const months = [
  "October 2026",
  "September 2026",
  "August 2026",
  "July 2026",
];

const statusLabels = {
  completed: "Completed",
  in_progress: "In Progress",
  blocked: "Blocked",
  overdue: "Past Deadline",
};

const statusStyle = {
  completed: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  in_progress: "border-amber-300/30 bg-amber-300/10 text-amber-300",
  blocked: "border-white/20 bg-white/15 text-[#E04848]",
  overdue: "border-white/20 bg-white/15 text-[#E04848]",
};

const barStyle = {
  completed: "bg-emerald-400",
  in_progress: "bg-amber-300",
  blocked: "bg-[#B82323]",
  overdue: "bg-[#B82323]",
};

const GRID_COLS =
  "grid-cols-[minmax(170px,1.4fr)_minmax(210px,1.7fr)_minmax(150px,1.2fr)_140px_140px_44px]";

function Projects() {
const [projects] = useState(() => {
  const savedProjects = JSON.parse(
    localStorage.getItem("jgf-new-projects") || "[]"
  );

  const deletedIds = JSON.parse(
    localStorage.getItem("jgf-deleted-project-ids") || "[]"
  ).map(String);

  // Gabungkan project bawaan dan project baru berdasarkan ID
  const projectMap = new Map();

  initialProjects.forEach((project) => {
    projectMap.set(String(project.id), project);
  });

  // Data tersimpan akan menggantikan data lama jika ID sama
  savedProjects.forEach((project) => {
    const existing = projectMap.get(String(project.id));

    projectMap.set(String(project.id), {
      ...existing,
      ...project,
    });
  });

  // Hilangkan project yang sudah dihapus
  return Array.from(projectMap.values())
    .filter((project) => !deletedIds.includes(String(project.id)))
    .map((project) => ({
      ...project,
      owner:
        project.owner ||
        project.members?.[0]?.name ||
        project.members?.[0] ||
        "Unassigned",
      done: project.done ?? 0,
      total: project.total ?? 0,
      status: project.status || "in_progress",
    }));
});
  const [selectedMonth, setSelectedMonth] = useState("October 2026");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [exportOpen, setExportOpen] = useState(false);

  const attention = useMemo(
    () => projects.filter((project) =>
      ["blocked", "overdue"].includes(project.status)
    ).length,
    [projects]
  );

  const handleExport = (format) => {
    const headers = ["Project", "Owner", "Category", "Progress", "Status"];
    const rows = projects.map((project) => [
      project.name,
      project.owner,
      project.category,
      `${project.done}/${project.total}`,
      statusLabels[project.status],
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    if (format === "CSV") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "projects.csv";
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Export ${format} is not enabled in the frontend version yet.`);
    }

    setExportOpen(false);
  };

  return (
    <div className="pj-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .pj-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .pj-root button, .pj-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .pj-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-5 px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Projects</h1>
            <p className="mt-1.5 text-xs text-white/55">
              Work in progress, by owner
            </p>
          </div>

          <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <div className="relative col-span-2 sm:col-span-1">
              <GlassSelect
                label="Month"
                className="w-full sm:w-[190px]"
                icon={<CalendarDays size={14} />}
                value={selectedMonth}
                options={MONTH_OPTIONS}
                onChange={setSelectedMonth}
              />
            </div>

            <button
              type="button"
              onClick={() => alert("Board Dossier is not connected to the backend yet.")}
              className={PILL + " h-10 w-full justify-center border-white/15 bg-white/[0.04] text-white/90 sm:h-9 sm:w-auto"}
            >
              <Calculator size={14} />
              Board Dossier
            </button>

            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setExportOpen(!exportOpen)}
                className={PILL_PRIMARY + " h-10 w-full justify-center px-3.5 sm:h-9 sm:w-auto"}
              >
                <FileText size={14} />
                Export As
                <ChevronDown size={13} />
              </button>

              {exportOpen && (
                <div className={`absolute right-0 top-11 z-20 w-44 rounded-xl bg-[#1a0d10]/95 p-1.5 shadow-2xl ${GLASS}`}>
                  <button
                    onClick={() => handleExport("PDF")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileText size={14} />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("Excel")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileSpreadsheet size={14} />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport("CSV")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/85 hover:bg-white/[0.07]"
                  >
                    <FileText size={14} />
                    CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attention Banner */}
        {attention > 0 && (
          <div className="flex min-h-9 py-1.5 md:h-10 md:py-0 items-center gap-2.5 rounded-xl border border-[#B82323]/40 bg-gradient-to-b from-[#A21E1E] to-[#8F1A1A] px-3.5 text-[12px] font-medium text-white shadow-[0_6px_18px_-8px_rgba(162,30,30,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]">
            <AlertTriangle size={16} />
            <span>
              {attention} item{attention > 1 ? "s" : ""} needs attention
            </span>
            <ArrowRight size={16} className="ml-auto" />
          </div>
        )}

        {/* Project Roster */}
        <section className={`overflow-hidden rounded-2xl p-4 sm:p-5 ${GLASS}`}>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="mt-1 text-[12px] text-white/55">
                Reads live data from your connected Google Sheets.
              </p>
            </div>
            <Link
              to="/projects/create"
              className={PILL_PRIMARY + " h-9 px-4"}
            >
              <Plus size={14} />
              New Project
            </Link>
          </div>

          <div className="mb-4 border-t border-white/[0.08]" />

          {/* Table */}
          <div className="rounded-xl border border-white/[0.08] bg-black/30 max-md:border-0 max-md:bg-transparent md:overflow-x-auto">
            <div className="md:min-w-[820px]">
              <div className={`grid ${GRID_COLS} max-md:hidden items-center gap-3 border-b border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55`}>
                <div>Project</div>
                <div>Owner</div>
                <div>Category</div>
                <div>Progress</div>
                <div>Status</div>
                <div />
              </div>

              {projects.length > 0 ? (
                [
                  { title: "In progress", items: projects.filter((p) => p.status !== "completed") },
                  { title: "Completed", items: projects.filter((p) => p.status === "completed") },
                ].filter((group) => group.items.length > 0).map((group) => (
                <Fragment key={group.title}>
                <button
                  type="button"
                  onClick={() => setCollapsedSections((prev) => ({ ...prev, [group.title]: !prev[group.title] }))}
                  aria-expanded={!collapsedSections[group.title]}
                  className="mt-3 flex w-full items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-left text-[12px] font-semibold text-white/80 transition first:mt-0 hover:bg-white/[0.04] max-md:mb-1.5 max-md:rounded-xl max-md:border max-md:border-white/[0.08]"
                >
                  <span>
                    {group.title} <span className="ml-1 text-white/40">({group.items.length})</span>
                  </span>
                  <ChevronDown size={14} className={`text-white/55 transition-transform duration-200 ${collapsedSections[group.title] ? "-rotate-90" : ""}`} />
                </button>
                {!collapsedSections[group.title] && group.items.map((project) => {
                  const progress =
                    project.total > 0
                      ? Math.round((project.done / project.total) * 100)
                      : 0;

                  return (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className={`group grid min-h-[64px] ${GRID_COLS} max-md:grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 border-b border-white/[0.06] px-4 py-3.5 max-md:mb-1.5 max-md:rounded-xl max-md:border max-md:border-white/[0.08] max-md:bg-black/40 max-md:p-4 md:items-center md:gap-3 md:py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.04]`}
                    >
                      <div className="truncate text-[13px] font-semibold text-white max-md:col-start-1 max-md:row-start-1 max-md:min-w-0 max-md:text-[15px]">
                        {project.name}
                      </div>

                      <div className="flex min-w-0 items-center gap-2.5 text-[12px] text-white/75 max-md:col-start-1 max-md:row-start-2">
                        <PersonAvatar name={project.owner} className="h-10 w-10 text-[12px]" />
                        <span className="truncate">{project.owner}</span>
                      </div>

                      <div className="max-md:hidden">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-white/75">
                          {project.category}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-[12px] font-semibold tabular-nums text-white max-md:hidden">
                        <span>
                          {project.done}/{project.total}
                        </span>
                        <div className="h-[5px] w-full max-w-[100px] overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${barStyle[project.status] || "bg-amber-300"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[project.status] || statusStyle.in_progress}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabels[project.status] || project.status}
                        </span>
                      </div>

                      <div className="flex justify-center text-[#C42B2B] transition group-hover:translate-x-0.5 max-md:col-start-2 max-md:row-start-2 max-md:justify-self-end max-md:grid max-md:h-9 max-md:w-9 max-md:shrink-0 max-md:place-items-center max-md:rounded-full max-md:border max-md:border-white/20 max-md:text-white/80">
                        <ChevronRight size={15} />
                      </div>
                    </Link>
                  );
                })}
                </Fragment>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-[12px] text-white/55">
                  No projects yet.
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-white/45">
            Showing {projects.length} projects · {selectedMonth}
          </p>
        </section>
      </div>
    </div>
  );
}

export default Projects;
