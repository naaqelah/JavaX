import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Grid3X3,
  Lightbulb,
  Mic,
  Megaphone,
  Briefcase,
  RefreshCw,
} from "lucide-react";

// Desain token sama dengan halaman lain (Overview, Projects, ProjectDetail, dst.)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const PILL =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white px-5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";
const LABEL = "mb-1.5 block text-[12px] font-medium text-white/85";

const teamMembers = [
  "Abraham Partogi Liem Silaen",
  "Amabel Eugenia",
  "Ezra Judah",
  "Jason Judah Pakasi",
  "Yudi T. Sinambela",
  "Lidia Wulan",
  "Meyva Linda",
  "Reinhart Okta Putra",
  "Stephanie Jodie",
];

const categories = [
  { name: "All", count: 3, icon: Grid3X3 },
  { name: "Creative", count: 0, icon: Lightbulb },
  { name: "Podcast", count: 1, icon: Mic },
  { name: "Ads", count: 0, icon: Megaphone },
  { name: "Corporate", count: 1, icon: Briefcase },
  { name: "Campaign", count: 1, icon: RefreshCw },
];

function ProjectCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    deadline: "",
    description: "",
    members: [],
  });

  const [activeFilter, setActiveFilter] = useState("All");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleMember = (member) => {
    setForm((previous) => ({
      ...previous,
      members: previous.members.includes(member)
        ? previous.members.filter((item) => item !== member)
        : [...previous.members, member],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const savedProjects = JSON.parse(
      localStorage.getItem("jgf-new-projects") || "[]"
    );

    const newProject = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      deadline: form.deadline,
      description: form.description,
      members: form.members,
      owner: "You",
      done: 0,
      total: 0,
      status: "in_progress",
    };

    localStorage.setItem(
      "jgf-new-projects",
      JSON.stringify([...savedProjects, newProject])
    );

    alert("Project saved in the browser.");
    navigate("/projects");
  };

  return (
    <div className="pc-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .pc-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .pc-root button, .pc-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .pc-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* Back */}
        <Link
          to="/projects"
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/65 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to project
        </Link>

        <h1 className="mb-5 text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
          Create New Project
        </h1>

        <form onSubmit={handleSubmit} className={`rounded-2xl p-4 sm:p-5 md:p-6 ${GLASS}`}>
          {/* Alert */}
          <div className="mb-5 flex min-h-[44px] items-center gap-2.5 rounded-xl border border-[#B82323]/30 bg-[#A21E1E]/15 px-4 py-2.5 text-[12px] font-medium text-[#E04848]">
            <AlertCircle size={16} />
            <span>1 overdue: test collab</span>
          </div>

          {/* Project Information */}
          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr]">
            <div>
              <label className={LABEL}>
                Project name <span className="text-[#C42B2B]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter project name"
                className={FIELD}
              />
            </div>

            <div>
              <label className={LABEL}>
                Category <span className="text-[#C42B2B]">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={FIELD}
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Web">Web</option>
                <option value="Content Production">Content Production</option>
                <option value="Social Media">Social Media</option>
                <option value="Brand Identity">Brand Identity</option>
                <option value="Partnerships">Partnerships</option>
                <option value="Video Production">Video Production</option>
                <option value="Podcast">Podcast</option>
              </select>
            </div>

            <div>
              <label className={LABEL}>
                Deadline <span className="text-[#C42B2B]">*</span>
              </label>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
                className={FIELD}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className={LABEL}>
              What is this project for?{" "}
              <span className="font-normal italic text-white/40">
                (optional)
              </span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of this project"
              className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.05] p-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60"
            />
          </div>

          {/* Team Members */}
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
            <Users size={16} />
            Team
            <span className="text-[12px] font-normal italic text-white/40">(optional)</span>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <label
                key={member}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[11px] transition ${
                  form.members.includes(member)
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.members.includes(member)}
                  onChange={() => toggleMember(member)}
                  className="h-3.5 w-3.5 accent-[#A21E1E]"
                />
                {member}
              </label>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="mb-7 flex flex-wrap gap-2">
            {categories.map(({ name, count, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveFilter(name)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition ${
                  activeFilter === name
                    ? "border-white/30 bg-white text-[#120809] shadow-[0_6px_16px_-8px_rgba(255,255,255,0.25)]"
                    : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                <Icon size={13} />
                {name}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    activeFilter === name
                      ? "bg-black/30 text-white"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-2.5 border-t border-white/[0.08] pt-5">
            <Link
              to="/projects"
              className={PILL}
            >
              Cancel
            </Link>

            <button
              type="submit"
              className={PILL_PRIMARY}
            >
              + Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectCreate;
