import PersonAvatar from "../components/ui/PersonAvatar";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Tag,
  Users,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
  Link2,
  FileImage,
  Eye,
  X,
  Clock3,
} from "lucide-react";

// Desain token sama dengan Overview, MarketingPerformance, MyWork, SocialMedia, TeamScorecards & ContentCalendar
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";
const LABEL = "mb-1.5 block text-[12px] font-medium text-white/85";

const initialMembers = [
  { initials: "JA", name: "Jason" },
  { initials: "AG", name: "Agung" },
  { initials: "AN", name: "Anabele" },
  { initials: "CH", name: "Charlene" },
];

const initialTasks = [
  {
    id: 1,
    title: "Test 1",
    priority: "Medium",
    deadline: "2027-01-08T22:29",
    submitted: "31 Oct 2026, 19:46",
    status: "Submitted on time",
    completed: true,
    expanded: true,
    content: "Test 1",
    platform: "Instagram",
    contentType: "Video",
    assignee: "Jason",
    notes: "",
    evidence: "screenshot_2026-10-31_19-46-00.png",
  },
  {
    id: 2,
    title: "Test 2",
    priority: "Medium",
    deadline: "2027-01-08T22:29",
    submitted: "31 Oct 2026, 19:46",
    status: "In Progress",
    completed: false,
    expanded: false,
    content: "",
    platform: "",
    contentType: "",
    assignee: "",
    notes: "",
    evidence: "",
  },
  {
    id: 3,
    title: "Test 3",
    priority: "Medium",
    deadline: "2027-01-08T22:29",
    submitted: "31 Oct 2026, 19:46",
    status: "In Progress",
    completed: false,
    expanded: false,
    content: "",
    platform: "",
    contentType: "",
    assignee: "",
    notes: "",
    evidence: "",
  },
];

function ProjectDetail() {
  const { id } = useParams();

  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    deadline: "",
    description: "",
  });

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem(`jgf-project-tasks-${id}`);
    return savedTasks ? JSON.parse(savedTasks) : initialTasks;
  });

  const [newTask, setNewTask] = useState("");
  const [newDeadline, setNewDeadline] = useState("2027-01-08T22:29");
  const [newPriority, setNewPriority] = useState("Medium");
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [showEditTask, setShowEditTask] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentTarget, setContentTarget] = useState(null);

  const [availableMembers] = useState([
    "Michael",
    "Lidia",
    "Bella",
    "Reinhart",
    "Jodie",
  ]);

  // Load project berdasarkan ID
  useEffect(() => {
    const savedProjects = JSON.parse(
      localStorage.getItem("jgf-new-projects") || "[]"
    );

    const selectedProject = savedProjects.find(
      (item) => String(item.id) === String(id)
    );

    if (selectedProject) {
      setProject(selectedProject);

      setMembers(
        (selectedProject.members || []).map((member) => {
          if (typeof member === "string") {
            return {
              name: member,
              initials: member
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            };
          }

          return member;
        })
      );
    } else {
      setProject({
        id,
        name: "Test collab2",
        category: "Podcast",
        deadline: "2026-10-11",
        description: "",
        members: [],
        status: "in_progress",
      });

      setMembers(initialMembers);
    }
  }, [id]);

  // Simpan checklist
  useEffect(() => {
    localStorage.setItem(
      `jgf-project-tasks-${id}`,
      JSON.stringify(tasks)
    );
  }, [tasks, id]);

  // Simpan progress project
  useEffect(() => {
    const progressData = JSON.parse(
      localStorage.getItem("jgf-project-progress") || "{}"
    );

    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    progressData[id] = {
      done: completed,
      total: tasks.length,
      status:
        tasks.length > 0 && completed === tasks.length
          ? "completed"
          : "in_progress",
    };

    localStorage.setItem(
      "jgf-project-progress",
      JSON.stringify(progressData)
    );
  }, [tasks, id]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const updateTask = (taskId, changes) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task
      )
    );
  };

  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask.trim(),
      priority: newPriority,
      deadline: newDeadline,
      submitted: "-",
      status: "In Progress",
      completed: false,
      expanded: false,
      content: "",
      platform: "",
      contentType: "",
      assignee: "",
      notes: "",
      evidence: "",
    };

    setTasks((previous) => [...previous, task]);
    setNewTask("");
  };

  const deleteTask = (taskId) => {
    if (!window.confirm("Delete this checklist item?")) return;

    setTasks((previous) =>
      previous.filter((task) => task.id !== taskId)
    );
  };

  const addMember = (name) => {
    if (members.some((member) => member.name === name)) return;

    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newMember = { initials, name };
    const updatedMembers = [...members, newMember];

    setMembers(updatedMembers);

    const savedProjects = JSON.parse(
      localStorage.getItem("jgf-new-projects") || "[]"
    );

    const projectExists = savedProjects.some(
      (item) => String(item.id) === String(id)
    );

    const updatedProjects = projectExists
      ? savedProjects.map((item) =>
          String(item.id) === String(id)
            ? { ...item, members: updatedMembers }
            : item
        )
      : [...savedProjects, { ...project, members: updatedMembers }];

    localStorage.setItem(
      "jgf-new-projects",
      JSON.stringify(updatedProjects)
    );

    setProject((previous) => ({
      ...previous,
      members: updatedMembers,
    }));

    setShowAddPeople(false);
  };

  const handleSaveEditProject = () => {
    if (!editForm.name.trim()) {
      alert("Project name is required.");
      return;
    }

    const updatedProject = {
      ...project,
      ...editForm,
    };

    const savedProjects = JSON.parse(
      localStorage.getItem("jgf-new-projects") || "[]"
    );

    const projectExists = savedProjects.some(
      (item) => String(item.id) === String(id)
    );

    const updatedProjects = projectExists
      ? savedProjects.map((item) =>
          String(item.id) === String(id) ? updatedProject : item
        )
      : [...savedProjects, updatedProject];

    localStorage.setItem(
      "jgf-new-projects",
      JSON.stringify(updatedProjects)
    );

    setProject(updatedProject);
    setShowEditProject(false);

    alert("Project updated successfully.");
  };

  const handleDeleteProject = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    const savedProjects = JSON.parse(
      localStorage.getItem("jgf-new-projects") || "[]"
    );

    const updatedProjects = savedProjects.filter(
      (item) => String(item.id) !== String(id)
    );

    localStorage.setItem(
      "jgf-new-projects",
      JSON.stringify(updatedProjects)
    );

    const deletedIds = JSON.parse(
      localStorage.getItem("jgf-deleted-project-ids") || "[]"
    );

    if (!deletedIds.map(String).includes(String(id))) {
      deletedIds.push(String(id));
    }

    localStorage.setItem(
      "jgf-deleted-project-ids",
      JSON.stringify(deletedIds)
    );

    localStorage.removeItem(`jgf-project-tasks-${id}`);

    window.location.href = "/projects";
  };

  const formatDeadline = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!project) {
    return <div className="p-6 text-sm text-white/55">Loading project...</div>;
  }

  return (
    <div className="pr-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .pr-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .pr-root button, .pr-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .pr-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-5 px-4 pb-6 lg:px-5">
        {/* Top Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/projects"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] pl-3 pr-4 text-[13px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97] md:h-9 md:text-[12px]"
          >
            <ArrowLeft size={14} />
            Back
          </Link>

          <div className="grid w-full grid-cols-2 items-stretch gap-2.5 sm:flex sm:w-auto sm:gap-2">
            <button
              onClick={() => {
                setEditForm({
                  name: project.name || "",
                  category: project.category || "",
                  deadline: project.deadline || "",
                  description: project.description || "",
                });

                setShowEditProject(true);
              }}
              className={PILL + " max-md:h-12 max-md:rounded-xl max-md:text-[13px] max-md:font-semibold"}
            >
              <Pencil size={14} />
              Edit Project
            </button>

            <button
              onClick={handleDeleteProject}
              className="inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#B82323]/50 bg-[#A21E1E] px-3.5 text-[13px] font-semibold text-white md:h-9 md:rounded-lg md:text-[12px] shadow-[0_8px_18px_-8px_rgba(162,30,30,0.7)] transition hover:brightness-110 active:scale-[0.97]"
            >
              <Trash2 size={14} />
              Delete Project
            </button>
          </div>
        </div>

        {/* Project Hero */}
        <section className={`flex flex-col justify-between gap-5 rounded-2xl p-4 sm:p-5 md:p-6 lg:flex-row lg:items-center ${GLASS}`}>
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <h1 className="min-w-0 break-words text-xl font-semibold leading-tight tracking-tight text-white md:text-[22px]">{project?.name || "Project Name"}</h1>
              <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-300/25 md:py-0.5 md:text-[10px]">
                In progress
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-white/60">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} />
                Deadline {project.deadline
                  ? new Date(project.deadline).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag size={13} />
                {project.category || "-"}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {members.length} people
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {members.map((member) => (
                <div
                  key={member.name}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-0.5 pr-3.5 text-[12px] text-white/90 md:text-[11px]"
                >
                  <PersonAvatar name={member.name} className="h-8 w-8 text-[11px]" />
                  {member.name}
                </div>
              ))}

              <button
                onClick={() => setShowAddPeople(!showAddPeople)}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-white/25 px-4 text-[13px] text-white/80 transition hover:border-white/40 hover:bg-white/[0.05] sm:w-auto md:h-auto md:gap-1 md:px-3 md:py-1.5 md:text-[11px]"
              >
                <Plus size={14} />
                Add people
              </button>
            </div>

            {showAddPeople && (
              <div className={`mt-3 max-w-sm rounded-xl bg-[#1a0d10]/95 p-2.5 ${GLASS}`}>
                <div className="mb-1.5 flex items-center justify-between px-1 text-[12px] font-semibold text-white">
                  Add team member
                  <button onClick={() => setShowAddPeople(false)} className="text-white/55 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                {availableMembers
                  .filter(
                    (name) => !members.some((member) => member.name === name)
                  )
                  .map((name) => (
                    <button
                      key={name}
                      onClick={() => addMember(name)}
                      className="block w-full rounded-lg px-3 py-3 text-left text-[13px] text-white/80 transition hover:bg-white/[0.07] hover:text-white md:py-2 md:text-[11px]"
                    >
                      + {name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="flex w-full shrink-0 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 p-3.5 lg:w-auto lg:border-0 lg:bg-transparent lg:p-0">
            <div className="lg:text-right">
              <div className="text-2xl font-semibold tabular-nums text-white">{progress}%</div>
              <div className="mt-1 text-xs text-white/60 md:text-[11px]">
                {completedTasks} of {tasks.length} tasks completed
              </div>
            </div>

            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full lg:h-14 lg:w-14"
              style={{
                background: `conic-gradient(#B82323 ${progress}%, rgba(255,255,255,0.1) 0)`,
              }}
            >
              <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#1a0d10] text-xs font-semibold text-white lg:h-[44px] lg:w-[44px] lg:text-[11px]">
                {progress}%
              </div>
            </div>
          </div>
        </section>

        {/* Tasks Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-[15px]">Tasks checklist</h2>
          <button
            onClick={() => document.getElementById("new-task-input")?.focus()}
            className={PILL + " max-md:h-11 max-sm:w-full"}
          >
            <Plus size={13} />
            Add Checklist item
          </button>
        </div>

        {/* Checklist Cards */}
        {tasks.map((task) => (
          <section
            key={task.id}
            className={`rounded-2xl p-4 sm:p-5 ${GLASS}`}
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 md:flex md:flex-wrap md:items-center md:gap-2.5">
              <button
                onClick={() =>
                  updateTask(task.id, {
                    completed: !task.completed,
                    status: !task.completed ? "Submitted on time" : "In Progress",
                  })
                }
                className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md transition before:absolute before:-inset-2.5 before:content-[''] md:mt-0 md:h-5 md:w-5 ${
                  task.completed
                    ? "bg-white text-[#120809] shadow-[0_4px_12px_-4px_rgba(255,255,255,0.4)]"
                    : "border border-white/20 bg-white/[0.05] text-white/60 hover:border-white/40"
                }`}
                title="Toggle task completion"
              >
                {task.completed ? <Check size={12} /> : <Minus size={12} />}
              </button>

              <span
                className={`min-w-0 break-words text-[15px] font-semibold leading-snug md:text-[13px] ${
                  task.completed ? "text-white/45 line-through" : "text-white"
                }`}
              >
                {task.title}
              </span>

              <span className="rounded-full bg-[#B82323]/15 px-2.5 py-1 text-[11px] font-semibold text-[#E04848] ring-1 ring-[#B82323]/25 md:px-2 md:py-0.5 md:text-[10px]">
                {task.priority}
              </span>

              <div className="col-span-3 flex flex-wrap items-center gap-x-3 gap-y-2.5 text-xs text-white/60 md:col-auto md:ml-auto md:gap-2.5 md:text-[11px] md:text-white/50">
                <span className="flex items-center gap-1.5 md:gap-1">
                  <CalendarDays size={13} />
                  Deadline {formatDeadline(task.deadline)}
                </span>

                <span className="hidden items-center gap-1 md:flex">
                  <Clock3 size={12} />
                  Submitted {task.submitted}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 md:py-0.5 md:text-[10px] ${
                    task.completed
                      ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                      : "bg-white/[0.06] text-white/75 ring-white/15"
                  }`}
                >
                  {task.status}
                </span>

                <div className="ml-auto flex items-center gap-2 md:contents">
                  <button
                    onClick={() => setShowEditTask(task)}
                    aria-label="Edit task"
                    title="Edit task"
                    className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white md:h-7 md:w-7"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 transition hover:text-[#C42B2B] md:h-auto md:w-auto md:border-0 md:bg-transparent md:text-white/40"
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>

                  <button
                    onClick={() =>
                      updateTask(task.id, { expanded: !task.expanded })
                    }
                    aria-label={task.expanded ? "Collapse task" : "Expand task"}
                    aria-expanded={task.expanded}
                    className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:text-white md:h-auto md:w-auto md:border-0 md:bg-transparent md:text-white/55"
                  >
                    {task.expanded ? (
                      <ChevronUp size={17} />
                    ) : (
                      <ChevronDown size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {task.expanded && (
              <div className="mt-4 space-y-3">
                {/* Content */}
                <div className={`p-3.5 ${INNER}`}>
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55 md:mb-2.5 md:text-[10px] md:text-white/45">
                    Content
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:mb-2.5">
                    <button
                      onClick={() => {
                        setContentTarget(task);
                        setShowContentModal(true);
                      }}
                      className={PILL + " h-11 px-3 text-[13px] md:h-8 md:text-[12px]"}
                    >
                      <Plus size={13} />
                      New content
                    </button>

                    <button
                      onClick={() => {
                        setContentTarget(task);
                        setShowContentModal(true);
                      }}
                      className={PILL + " h-11 px-3 text-[13px] md:h-8 md:text-[12px]"}
                    >
                      <Link2 size={13} />
                      Link content
                    </button>
                  </div>

                  {task.content ? (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-white/[0.07] bg-black/40 p-3 sm:flex sm:flex-wrap sm:items-center md:p-2.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-white/85 md:h-8 md:w-8">
                        <span className="text-xs font-bold md:text-[11px]">IG</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-[14px] font-semibold leading-snug text-white md:text-[12px]">{task.content}</div>
                        <div className="mt-1 break-words text-xs text-white/60 md:mt-0.5 md:text-[11px] md:text-white/50">
                          {task.platform} · {task.contentType} · {task.assignee}
                        </div>
                        <div className="mt-1.5 text-[11px] leading-relaxed text-emerald-300 md:mt-1 md:text-[10px]">
                          Idea › Drafting › In review › Approved › Scheduled › Published
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updateTask(task.id, {
                            content: "",
                            platform: "",
                            contentType: "",
                            assignee: "",
                          })
                        }
                        className="col-span-2 inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 px-3 text-[13px] text-[#E04848] transition hover:bg-[#A21E1E]/15 sm:w-auto md:h-auto md:px-2.5 md:py-1 md:text-[11px] md:text-[#C42B2B]"
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-white/55 md:text-[11px] md:text-white/45">
                      No linked content.
                    </p>
                  )}
                </div>

                {/* Evidence */}
                <div className={`p-3.5 ${INNER}`}>
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55 md:mb-2.5 md:text-[10px] md:text-white/45">
                    Evidence
                  </div>

                  <label className={`${PILL} mb-3 h-11 w-full cursor-pointer px-3 text-[13px] sm:w-auto md:mb-2.5 md:h-8 md:text-[12px]`}>
                    <Plus size={13} />
                    Add Evidence
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          updateTask(task.id, { evidence: file.name });
                        }
                      }}
                    />
                  </label>

                  {task.evidence && (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-white/[0.07] bg-black/40 p-3 sm:flex sm:flex-wrap sm:items-center md:p-2.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-white/75 md:h-8 md:w-8">
                        <FileImage size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold leading-snug text-white [overflow-wrap:anywhere] md:text-[12px]">
                          {task.evidence}
                        </div>
                        <div className="mt-1 text-[11px] text-white/55 md:mt-0.5 md:text-[10px] md:text-white/45">
                          Uploaded locally in this session
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 sm:contents">
                        <button
                          onClick={() =>
                            alert("File preview is not available in the frontend version yet.")
                          }
                          className={PILL + " h-11 flex-1 px-3 text-[13px] sm:flex-none md:h-7 md:px-2.5 md:text-[11px]"}
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button
                          onClick={() => updateTask(task.id, { evidence: "" })}
                          aria-label="Delete evidence"
                          title="Delete evidence"
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition hover:text-[#C42B2B] sm:border-0 sm:bg-transparent md:h-auto md:w-auto md:text-white/40"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-xs text-white/60 md:text-[11px] md:text-white/55">
                    Task notes (optional)
                  </label>
                  <textarea
                    value={task.notes}
                    onChange={(event) =>
                      updateTask(task.id, { notes: event.target.value })
                    }
                    placeholder="Add notes here..."
                    rows={2}
                    className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.05] p-3 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60"
                  />
                  <div className="mt-1.5 text-right text-[11px] text-white/45 md:mt-1 md:text-[10px] md:text-white/40">
                    Notes last only this session
                  </div>
                </div>
              </div>
            )}
          </section>
        ))}

        {/* Add Checklist Item */}
        <div className={`flex flex-col gap-2.5 rounded-2xl p-4 lg:flex-row lg:items-center ${GLASS}`}>
          <input
            id="new-task-input"
            type="text"
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();
            }}
            placeholder="Add a checklist item"
            className={FIELD + " h-11 w-full min-w-0 shrink-0 lg:h-10 lg:flex-1"}
          />

          <input
            type="datetime-local"
            value={newDeadline}
            onChange={(event) => setNewDeadline(event.target.value)}
            className={FIELD + " h-11 lg:h-10 lg:w-auto"}
          />

          <select
            value={newPriority}
            onChange={(event) => setNewPriority(event.target.value)}
            className={FIELD + " h-11 lg:h-10 lg:w-auto"}
          >
            <option>Medium</option>
            <option>High</option>
            <option>Low</option>
          </select>

          <button
            onClick={addTask}
            className={PILL_PRIMARY + " h-11 w-full px-4 lg:h-10 lg:w-auto"}
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* Edit Task Modal */}
        {showEditTask && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className={`w-full max-w-[460px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl ${GLASS}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">Edit Checklist Item</h3>
                <button onClick={() => setShowEditTask(null)} className="text-white/55 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <label className={LABEL}>
                Task name
              </label>
              <input
                value={showEditTask.title}
                onChange={(event) =>
                  setShowEditTask({
                    ...showEditTask,
                    title: event.target.value,
                  })
                }
                className={FIELD + " mb-4"}
              />

              <label className={LABEL}>
                Priority
              </label>
              <select
                value={showEditTask.priority}
                onChange={(event) =>
                  setShowEditTask({
                    ...showEditTask,
                    priority: event.target.value,
                  })
                }
                className={FIELD + " mb-5"}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowEditTask(null)}
                  className={PILL + " h-9 px-4"}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateTask(showEditTask.id, {
                      title: showEditTask.title,
                      priority: showEditTask.priority,
                    });
                    setShowEditTask(null);
                  }}
                  className={PILL_PRIMARY + " h-9 px-4"}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        , document.body)}

        {/* Content Modal */}
        {showContentModal && contentTarget && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className={`w-full max-w-[460px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl ${GLASS}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">Link Content</h3>
                <button onClick={() => setShowContentModal(false)} className="text-white/55 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <label className={LABEL}>
                Content name
              </label>
              <input
                id="content-name"
                defaultValue=""
                placeholder="Enter content name"
                className={FIELD + " mb-4"}
              />

              <label className={LABEL}>
                Platform
              </label>
              <select
                id="content-platform"
                className={FIELD + " mb-4"}
              >
                <option>Instagram</option>
                <option>TikTok</option>
                <option>YouTube</option>
                <option>Facebook</option>
              </select>

              <label className={LABEL}>
                Content type
              </label>
              <select
                id="content-type"
                className={FIELD + " mb-5"}
              >
                <option>Video</option>
                <option>Image</option>
                <option>Carousel</option>
                <option>Story</option>
              </select>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setShowContentModal(false)}
                  className={PILL + " h-9 px-4"}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const content = document.getElementById("content-name").value;
                    const platform = document.getElementById("content-platform").value;
                    const contentType = document.getElementById("content-type").value;

                    if (!content.trim()) {
                      alert("Please enter content name.");
                      return;
                    }

                    updateTask(contentTarget.id, {
                      content,
                      platform,
                      contentType,
                      assignee: members[0]?.name || "",
                    });

                    setShowContentModal(false);
                    setContentTarget(null);
                  }}
                  className={PILL_PRIMARY + " h-9 px-4"}
                >
                  Save Content
                </button>
              </div>
            </div>
          </div>
        , document.body)}

        {/* Edit Project Modal */}
        {showEditProject && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
            <div className={`w-full max-w-[520px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl ${GLASS}`}>

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">Edit Project</h3>
                <button onClick={() => setShowEditProject(false)} className="text-white/55 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={LABEL}>
                    Project Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className={FIELD}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    Category
                  </label>
                  <input
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className={FIELD}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editForm.deadline?.slice(0, 10) || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, deadline: e.target.value })
                    }
                    className={FIELD}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/[0.05] p-3 text-[13px] text-white outline-none transition focus:border-[#B82323]/60"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowEditProject(false)}
                  className={PILL + " h-9 px-4"}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveEditProject}
                  className={PILL_PRIMARY + " h-9 px-4"}
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        , document.body)}
      </div>
    </div>
  );
}

export default ProjectDetail;
