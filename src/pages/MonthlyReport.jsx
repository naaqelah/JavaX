// Monthly Report Generator: pilih periode, isi data bulanan, lihat preview, simpan sebagai PDF.
// Sumber data: form input bulanan (tersimpan di IndexedDB browser ini) + data dashboard yang memang
// tersimpan (Content Calendar, Promoter, foto tim). Tidak ada angka bawaan/dummy.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, Download, FileText,
  ImagePlus, Plus, Printer, RefreshCw, Trash2, Upload,
} from "lucide-react";
import GlassSelect from "../components/ui/GlassSelect";
import { TEAM } from "../data/people";
import ReportDocument, { buildSheets } from "../report/ReportPages";
import { derive, validate } from "../report/calc";
import { generateTexts, resolveTexts } from "../report/insights";
import {
  ANALYST_METRICS, MONTHS, SECTIONS, emptyReport, fileToDataUrl, listReports, parsePeriod,
  periodLabel, previousPeriod, putReport, removeReport, reportFileName,
} from "../report/store";

const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97] disabled:opacity-40";
const PILL_PRIMARY =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white px-3.5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";
const LABEL = "mb-1.5 block text-[12px] font-medium text-white/75";

// Mengubah nilai di dalam objek bertingkat tanpa memutasi aslinya
const setIn = (object, path, value) => {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const base = Array.isArray(object) ? [...object] : { ...(object || {}) };
  base[head] = setIn(base[head], rest, value);
  return base;
};
const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
};

function Field({ label, value, onChange, type = "text", placeholder, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={LABEL}>{label}</span>
      <input type={type} inputMode={type === "number" ? "decimal" : undefined} value={value ?? ""} placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)} className={FIELD} />
    </label>
  );
}
// Area teks. Bila kosong dan ada narasi otomatis, narasi otomatis yang tampil di laporan.
function Area({ label, value, onChange, auto, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-white/75">{label}</span>
        {auto !== undefined && (
          value?.trim()
            ? <button type="button" onClick={() => onChange("")} className="text-[11px] font-medium text-white/55 underline">Use auto text</button>
            : <span className="text-[11px] text-white/45">Auto text in use</span>
        )}
      </span>
      <textarea rows={rows} value={value ?? ""} placeholder={auto || ""} onChange={(event) => onChange(event.target.value)}
        className={`${FIELD} h-auto py-2 leading-relaxed`} />
      {auto !== undefined && !value?.trim() && auto && (
        <button type="button" onClick={() => onChange(auto)} className="mt-1 text-[11px] font-medium text-white/55 underline">Edit auto text</button>
      )}
    </label>
  );
}

// Pengelola foto: unggah, keterangan, urutan, hapus (hanya dari laporan)
function ImageManager({ images, onChange, max = 8, hint }) {
  const input = useRef(null);
  const add = async (files) => {
    const added = [];
    for (const file of Array.from(files)) {
      try { added.push({ src: await fileToDataUrl(file), caption: "" }); } catch { /* bukan gambar: lewati */ }
    }
    if (added.length) onChange([...(images || []), ...added].slice(0, max));
  };
  const move = (index, step) => {
    const next = [...images];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-white/75">Images ({images?.length || 0}/{max})</span>
        <button type="button" onClick={() => input.current?.click()} className={PILL + " h-8 px-3"}><ImagePlus size={13} />Add images</button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      </div>
      {hint && <p className="mt-1 text-[11px] text-white/45">{hint}</p>}
      {images?.length > 0 && (
        <ul className="mt-2 space-y-2">
          {images.map((image, index) => (
            <li key={index} className={`flex items-center gap-2 p-2 ${INNER}`}>
              <img src={image.src} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
              <input value={image.caption} placeholder="Caption (optional)" onChange={(event) => onChange(setIn(images, [index, "caption"], event.target.value))} className={FIELD + " h-9"} />
              <button type="button" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0} className={PILL + " h-9 w-9 px-0"}><ArrowUp size={13} /></button>
              <button type="button" aria-label="Move down" onClick={() => move(index, 1)} disabled={index === images.length - 1} className={PILL + " h-9 w-9 px-0"}><ArrowDown size={13} /></button>
              <button type="button" aria-label="Remove image" onClick={() => onChange(images.filter((_, i) => i !== index))} className={PILL + " h-9 w-9 px-0"}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ title, enabled, onToggle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`overflow-hidden ${INNER}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] font-semibold text-white">
          <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="truncate">{title}</span>
        </button>
        {onToggle && (
          <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-white/60">
            <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} className="h-4 w-4 accent-[#B91C1C]" />
            Show
          </label>
        )}
      </div>
      {open && <div className="space-y-3 border-t border-white/[0.08] p-3">{children}</div>}
    </div>
  );
}

// Daftar item yang bisa ditambah/dihapus (update, program, analis, kanal, action plan)
function Repeater({ items, onChange, blank, addLabel, render }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className={`space-y-3 p-3 ${INNER}`}>
          {render(item, (field, value) => onChange(setIn(items, [index, field], value)))}
          <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className={PILL + " h-8 px-3"}><Trash2 size={12} />Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, blank()])} className={PILL}><Plus size={13} />{addLabel}</button>
    </div>
  );
}

// ------------------------------------------------------------------ Editor
function Editor({ report, previous, onChange, onBack, saveState }) {
  const set = (path, value) => onChange(setIn(report, path, value));
  const data = useMemo(() => derive(report, previous), [report, previous]);
  const auto = useMemo(() => generateTexts(report, data), [report, data]);
  const texts = useMemo(() => resolveTexts(report, data), [report, data]);
  const { sheets, pageCount } = useMemo(() => buildSheets(report, data, texts), [report, data, texts]);
  const issues = useMemo(() => validate(report, data), [report, data]);
  const [tab, setTab] = useState("edit");
  const [printing, setPrinting] = useState(false);
  const [notice, setNotice] = useState("");
  const previewRef = useRef(null);
  const [zoom, setZoom] = useState(0.4);

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setZoom(Math.max(0.15, Math.min(1, entry.contentRect.width / 1588))));
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab]);

  // Cetak: dokumen dirender lewat portal ke <body>, lalu dialog cetak browser dibuka (Save as PDF)
  useEffect(() => {
    if (!printing) return undefined;
    const title = document.title;
    document.title = reportFileName(report.period);
    const done = () => { document.title = title; setPrinting(false); };
    window.addEventListener("afterprint", done, { once: true });
    const timer = setTimeout(() => window.print(), 350);
    return () => { clearTimeout(timer); window.removeEventListener("afterprint", done); };
  }, [printing, report.period]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportFileName(report.period)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Tarik data yang memang tersimpan di dashboard untuk periode ini
  const pullContent = () => {
    const cards = readJson("jgf-content-calendar");
    if (!Array.isArray(cards)) return setNotice("No saved Content Calendar data in this browser.");
    const inMonth = cards.filter((card) => String(card.date || "").startsWith(report.period));
    onChange(setIn(setIn(report, ["production", "produced"], String(inMonth.length)), ["production", "published"],
      String(inMonth.filter((card) => card.status === "published").length)));
    return setNotice(`Content Calendar: ${inMonth.length} items dated ${periodLabel(report.period)}.`);
  };
  const pullPromoter = () => {
    const promoters = readJson("jgf-promotors");
    if (!Array.isArray(promoters)) return setNotice("No saved Promoter data in this browser.");
    const done = promoters.reduce((total, item) => total + Number(item.done || 0), 0);
    const total = promoters.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const verified = promoters.filter((item) => item.ig_status === "verified" || item.tt_status === "verified").length;
    const status = `${promoters.length} promoter terdaftar, ${verified} dengan akun terverifikasi. Checklist posting: ${done} dari ${total} selesai.`;
    const programs = report.programs.some((program) => program.title === "Social Media Promoter")
      ? report.programs.map((program) => (program.title === "Social Media Promoter" ? { ...program, status } : program))
      : [...report.programs, { title: "Social Media Promoter", subtitle: "Promoter program progress", status, nextPlan: "", notes: "", images: [] }];
    onChange(setIn(report, ["programs"], programs));
    return setNotice("Promoter data added to Progress & Planning. Note: it reflects the current state, not a specific month.");
  };

  const k = report.kpi;
  const pair = (key, label, targetLabel = "Target") => (
    <div className="grid grid-cols-2 gap-2">
      <Field type="number" label={`${label} (actual)`} value={k[key].actual} onChange={(value) => set(["kpi", key, "actual"], value)} />
      <Field type="number" label={`${label} (${targetLabel.toLowerCase()})`} value={k[key].target} onChange={(value) => set(["kpi", key, "target"], value)} />
    </div>
  );
  const toggle = (key) => (value) => set(["sections", key], value);
  const on = report.sections;

  return (
    <div className="space-y-4">
      {/* Header editor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className={PILL}><ArrowLeft size={14} />Reports</button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white md:text-[20px]">{periodLabel(report.period)} Report</h1>
            <p className="text-[11px] text-white/50">{pageCount} pages · {saveState}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassSelect label="Status" value={report.status} onChange={(value) => set(["status"], value)}
            options={[{ value: "draft", label: "Draft" }, { value: "final", label: "Final" }]} className="w-[110px]" />
          <button type="button" onClick={exportJson} className={PILL}><Download size={13} />Export data</button>
          <button type="button" onClick={() => setPrinting(true)} className={PILL_PRIMARY}><Printer size={13} />Download PDF</button>
        </div>
      </div>

      {/* Kelengkapan data */}
      <div className={`p-3 ${INNER}`}>
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 text-[12px] text-white/75"><CheckCircle2 size={14} className="text-emerald-400" />All required data is filled in.</p>
        ) : (
          <details>
            <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-white/85">
              <AlertTriangle size={14} className="text-amber-300" />{issues.length} data {issues.length === 1 ? "item" : "items"} missing. Empty parts are left out of the report.
            </summary>
            <ul className="mt-2 grid gap-1 text-[12px] text-white/60 sm:grid-cols-2">
              {issues.map((issue, index) => <li key={index}><b className="font-semibold text-white/80">{issue.section}:</b> {issue.message}</li>)}
            </ul>
          </details>
        )}
        {notice && <p className="mt-2 text-[12px] text-white/70">{notice}</p>}
      </div>

      {/* Tab untuk layar kecil */}
      <div role="tablist" className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 xl:hidden">
        {[["edit", "Edit"], ["preview", "Preview"]].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
            className={`h-9 flex-1 rounded-lg text-[13px] font-medium ${tab === key ? "bg-[#C42428] text-white" : "text-white/65"}`}>{label}</button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* ------------------------- Form ------------------------- */}
        <div className={`space-y-3 ${tab === "edit" ? "" : "hidden xl:block"}`}>
          <Section title="Cover & author" defaultOpen>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Department" value={report.meta.department} onChange={(value) => set(["meta", "department"], value)} />
              <Field label="Company" value={report.meta.company} onChange={(value) => set(["meta", "company"], value)} />
              <Field label="Author" value={report.meta.author} onChange={(value) => set(["meta", "author"], value)} />
              <Field label="Author title" value={report.meta.authorTitle} onChange={(value) => set(["meta", "authorTitle"], value)} />
            </div>
            <div>
              <span className={LABEL}>Author photo (from team photos)</span>
              <GlassSelect label="Author photo" value={report.meta.authorPhoto || ""} placeholder="No photo"
                onChange={(value) => set(["meta", "authorPhoto"], value || null)}
                options={[{ value: "", label: "No photo" }, ...TEAM.map((person) => ({ value: person.photo, label: person.name }))]} />
            </div>
            <ImageManager max={1} images={report.meta.coverImage ? [{ src: report.meta.coverImage, caption: "" }] : []}
              hint="Optional cover visual."
              onChange={(images) => set(["meta", "coverImage"], images[0]?.src || null)} />
          </Section>

          <Section title="Marketing KPI" defaultOpen>
            {pair("leads", "Total Leads")}
            {pair("registration", "Registration")}
            {pair("ftd", "FTD")}
            {pair("deposit", "Total Deposit, Rp")}
            {pair("adSpend", "Ad Spend, Rp", "Budget")}
            <div className="grid grid-cols-3 gap-2">
              <Field type="number" label="ROAS target, %" value={k.roasTarget} onChange={(value) => set(["kpi", "roasTarget"], value)} />
              <Field type="number" label="CPL max, Rp" value={k.cplTarget} onChange={(value) => set(["kpi", "cplTarget"], value)} />
              <Field type="number" label="CPA max, Rp" value={k.cpaTarget} onChange={(value) => set(["kpi", "cpaTarget"], value)} />
            </div>
            <p className="text-[11px] text-white/45">ROAS, CPL, CPR, CPA, conversion rates and achievement are calculated automatically.</p>
          </Section>

          <Section title="Executive Summary" enabled={on.execSummary} onToggle={toggle("execSummary")}>
            <Area label="Summary" rows={5} value={report.text.execSummary} auto={auto.execSummary} onChange={(value) => set(["text", "execSummary"], value)} />
            <Area label="Strategic notes" rows={4} value={report.text.strategicNotes} auto={auto.strategicNotes} onChange={(value) => set(["text", "strategicNotes"], value)} />
          </Section>

          <Section title="Department Updates" enabled={on.updates} onToggle={toggle("updates")}>
            <Repeater items={report.updates} onChange={(value) => set(["updates"], value)} addLabel="Add update"
              blank={() => ({ title: "", status: "", insight: "", nextAction: "", images: [] })}
              render={(item, edit) => (
                <>
                  <Field label="Title" value={item.title} placeholder="e.g. Podcast Studio" onChange={(value) => edit("title", value)} />
                  <Area label="Status" rows={2} value={item.status} onChange={(value) => edit("status", value)} />
                  <Area label="Insight" rows={2} value={item.insight} onChange={(value) => edit("insight", value)} />
                  <Area label="Next action" rows={2} value={item.nextAction} onChange={(value) => edit("nextAction", value)} />
                  <ImageManager images={item.images} onChange={(value) => edit("images", value)} />
                </>
              )} />
          </Section>

          <Section title="Social Media" enabled={on.social} onToggle={toggle("social")}>
            <Area label="Overview note" value={report.text.socialNote} auto={auto.socialNote} onChange={(value) => set(["text", "socialNote"], value)} />
            {report.platforms.map((platform, index) => {
              const edit = (field) => (value) => set(["platforms", index, field], value);
              return (
                <Section key={platform.key} title={platform.name}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Account / handle" value={platform.handle} onChange={edit("handle")} className="col-span-2" />
                    <Field type="number" label="Followers" value={platform.followers} onChange={edit("followers")} />
                    <Field type="number" label="Views" value={platform.views} onChange={edit("views")} />
                    <Field type="number" label="Impressions" value={platform.impressions} onChange={edit("impressions")} />
                    <Field type="number" label="Engagement" value={platform.engagement} onChange={edit("engagement")} />
                    <Field type="number" label="Posts" value={platform.posts} onChange={edit("posts")} />
                    <Field label="Post breakdown" value={platform.postBreakdown} placeholder="7 Shorts · 6 Market Review" onChange={edit("postBreakdown")} />
                    <Field type="number" label="Awareness ad cost, Rp" value={platform.adCost} onChange={edit("adCost")} />
                    <Field type="number" label="New followers (ads)" value={platform.newFollowers} onChange={edit("newFollowers")} />
                  </div>
                  <Area label="Insights" value={platform.insights} onChange={edit("insights")} />
                  <Area label="Next plan" value={platform.nextPlan} onChange={edit("nextPlan")} />
                  <ImageManager max={4} images={platform.images} onChange={edit("images")} hint="First image is the account header; the rest are content thumbnails." />
                </Section>
              );
            })}
          </Section>

          <Section title="Content Production" enabled={on.production} onToggle={toggle("production")}>
            <button type="button" onClick={pullContent} className={PILL}><RefreshCw size={13} />Use Content Calendar counts</button>
            <div className="grid grid-cols-3 gap-2">
              {[["produced", "Produced"], ["published", "Published"], ["video", "Video"], ["design", "Design"], ["live", "Live streaming"], ["webinar", "Webinar"]].map(([key, label]) => (
                <Field key={key} type="number" label={label} value={report.production[key]} onChange={(value) => set(["production", key], value)} />
              ))}
            </div>
            <Area label="Insights" value={report.production.insights} onChange={(value) => set(["production", "insights"], value)} />
            <Area label="Next plan" value={report.production.nextPlan} onChange={(value) => set(["production", "nextPlan"], value)} />
            <ImageManager max={6} images={report.production.images} onChange={(value) => set(["production", "images"], value)} hint="Content highlights." />
          </Section>

          <Section title="Campaign Performance" enabled={on.campaign} onToggle={toggle("campaign")}>
            <div className="grid grid-cols-2 gap-2">
              <Field type="number" label="Ad impressions" value={report.ads.impressions} onChange={(value) => set(["ads", "impressions"], value)} />
              <Field type="number" label="Ad clicks" value={report.ads.clicks} onChange={(value) => set(["ads", "clicks"], value)} />
            </div>
            <span className={LABEL}>Channel breakdown</span>
            <Repeater items={report.channels} onChange={(value) => set(["channels"], value)} addLabel="Add channel"
              blank={() => ({ name: "", rating: "3", note: "" })}
              render={(item, edit) => (
                <>
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <Field label="Channel" value={item.name} placeholder="Meta Ads" onChange={(value) => edit("name", value)} />
                    <Field type="number" label="Rating 1–5" value={item.rating} onChange={(value) => edit("rating", String(Math.max(0, Math.min(5, Math.round(Number(value) || 0)))))} />
                  </div>
                  <Area label="Note" rows={2} value={item.note} onChange={(value) => edit("note", value)} />
                </>
              )} />
            <Area label="Summary" value={report.text.campaignSummary} auto={auto.campaignSummary} onChange={(value) => set(["text", "campaignSummary"], value)} />
            <Area label="Insights" value={report.text.campaignInsights} auto={auto.campaignInsights} onChange={(value) => set(["text", "campaignInsights"], value)} />
            <Area label="Next plan" value={report.text.campaignNextPlan} auto={auto.campaignNextPlan} onChange={(value) => set(["text", "campaignNextPlan"], value)} />
          </Section>

          <Section title="Analyst Performance" enabled={on.analyst} onToggle={toggle("analyst")}>
            <span className={LABEL}>Monthly targets (team total)</span>
            <div className="grid grid-cols-3 gap-2">
              {ANALYST_METRICS.map(([key, label]) => (
                <Field key={key} type="number" label={label} value={report.analystTargets[key]} onChange={(value) => set(["analystTargets", key], value)} />
              ))}
            </div>
            <Repeater items={report.analysts} onChange={(value) => set(["analysts"], value)} addLabel="Add analyst"
              blank={() => ({ name: "", ...Object.fromEntries(ANALYST_METRICS.map(([key]) => [key, ""])) })}
              render={(item, edit) => (
                <>
                  <Field label="Analyst name" value={item.name} onChange={(value) => edit("name", value)} />
                  <div className="grid grid-cols-3 gap-2">
                    {ANALYST_METRICS.map(([key, label]) => <Field key={key} type="number" label={label} value={item[key]} onChange={(value) => edit(key, value)} />)}
                  </div>
                </>
              )} />
            <Area label="Insights" value={report.text.analystInsights} auto={auto.analystInsights} onChange={(value) => set(["text", "analystInsights"], value)} />
            <Area label="Recommendations" value={report.text.analystPlan} auto={auto.analystPlan} onChange={(value) => set(["text", "analystPlan"], value)} />
          </Section>

          <Section title="Progress & Planning" enabled={on.programs} onToggle={toggle("programs")}>
            <button type="button" onClick={pullPromoter} className={PILL}><RefreshCw size={13} />Add Promoter program data</button>
            <Repeater items={report.programs} onChange={(value) => set(["programs"], value)} addLabel="Add program"
              blank={() => ({ title: "", subtitle: "", status: "", nextPlan: "", notes: "", images: [] })}
              render={(item, edit) => (
                <>
                  <Field label="Program" value={item.title} placeholder="e.g. Ads Video" onChange={(value) => edit("title", value)} />
                  <Field label="Subtitle" value={item.subtitle} onChange={(value) => edit("subtitle", value)} />
                  <Area label="Current status" rows={2} value={item.status} onChange={(value) => edit("status", value)} />
                  <Area label="Next plan" rows={2} value={item.nextPlan} onChange={(value) => edit("nextPlan", value)} />
                  <Area label="Notes" rows={3} value={item.notes} onChange={(value) => edit("notes", value)} />
                  <ImageManager max={6} images={item.images} onChange={(value) => edit("images", value)} />
                </>
              )} />
          </Section>

          <Section title="Action Plan" enabled={on.actionPlan} onToggle={toggle("actionPlan")}>
            <Repeater items={report.actionPlan} onChange={(value) => set(["actionPlan"], value)} addLabel="Add action"
              blank={() => ({ priority: "", action: "", owner: "", target: "" })}
              render={(item, edit) => (
                <>
                  <div className="grid grid-cols-[90px_1fr] gap-2">
                    <Field label="Priority" value={item.priority} placeholder="High" onChange={(value) => edit("priority", value)} />
                    <Field label="Owner" value={item.owner} onChange={(value) => edit("owner", value)} />
                  </div>
                  <Area label="Action" rows={2} value={item.action} onChange={(value) => edit("action", value)} />
                  <Field label="Target" value={item.target} onChange={(value) => edit("target", value)} />
                </>
              )} />
          </Section>

          <Section title="Outro" enabled={on.outro} onToggle={toggle("outro")}>
            <Area label="Closing note" rows={4} value={report.text.outro} auto={auto.outro} onChange={(value) => set(["text", "outro"], value)} />
          </Section>
        </div>

        {/* ------------------------- Preview ------------------------- */}
        <div className={`min-w-0 ${tab === "preview" ? "" : "hidden xl:block"}`}>
          <div ref={previewRef} className="rp-preview" style={{ "--rp-zoom": zoom }}>
            <ReportDocument sheets={sheets} />
          </div>
        </div>
      </div>

      {printing && createPortal(<div className="rp-print-root"><ReportDocument sheets={sheets} /></div>, document.body)}
    </div>
  );
}

// ------------------------------------------------------------------ Halaman utama
export default function MonthlyReport() {
  const [reports, setReports] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const importInput = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    listReports().then(setReports).catch(() => { setReports([]); setError("Could not open report storage in this browser."); });
  }, []);

  const active = reports?.find((report) => report.id === activeId) || null;
  const previous = active ? reports.find((report) => report.period === previousPeriod(active.period)) || null : null;

  const change = (next) => {
    setReports((current) => current.map((report) => (report.id === next.id ? next : report)));
    setSaveState("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      putReport(next).then(() => setSaveState("Saved")).catch(() => setSaveState("Save failed (storage full?)"));
    }, 600);
  };
  const create = async () => {
    const period = `${year}-${month}`;
    const existing = reports.find((report) => report.period === period);
    if (existing) return setActiveId(existing.id);
    const report = emptyReport(period);
    await putReport(report);
    setReports((current) => [report, ...current].sort((a, b) => (a.period < b.period ? 1 : -1)));
    return setActiveId(report.id);
  };
  const remove = async (report) => {
    if (!window.confirm(`Delete the ${periodLabel(report.period)} report? This cannot be undone.`)) return;
    await removeReport(report.id);
    setReports((current) => current.filter((item) => item.id !== report.id));
  };
  const importJson = async (file) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.period || !parsed?.kpi) throw new Error("bad file");
      const report = { ...emptyReport(parsed.period), ...parsed, id: `report-${parsed.period}` };
      await putReport(report);
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)].sort((a, b) => (a.period < b.period ? 1 : -1)));
      setError("");
    } catch {
      setError("That file is not a Monthly Report data file.");
    }
  };

  if (active)
    return <Editor report={active} previous={previous} onChange={change} onBack={() => setActiveId(null)} saveState={saveState} />;

  const years = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - 2 + index));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Monthly Report Generator</h1>
        <p className="mt-1.5 text-xs text-white/55">Fill in the month&rsquo;s data once, then preview and download the report as PDF.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Reports created", reports ? reports.length : "…"],
          ["Latest period", reports?.[0] ? periodLabel(reports[0].period) : "None yet"],
          ["Final reports", reports ? reports.filter((report) => report.status === "final").length : "…"],
        ].map(([label, value]) => (
          <div key={label} className={`p-4 ${INNER}`}>
            <p className="text-[11px] text-white/55">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
        <h2 className="text-base font-semibold text-white md:text-[15px]">Create new report</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2.5">
          <div className="w-[160px]"><span className={LABEL}>Month</span>
            <GlassSelect label="Month" value={month} onChange={setMonth} options={MONTHS.map((name, index) => ({ value: String(index + 1).padStart(2, "0"), label: name }))} /></div>
          <div className="w-[110px]"><span className={LABEL}>Year</span>
            <GlassSelect label="Year" value={year} onChange={setYear} options={years} /></div>
          <button type="button" onClick={create} disabled={!reports} className={PILL_PRIMARY + " h-10"}><Plus size={14} />Create report</button>
          <button type="button" onClick={() => importInput.current?.click()} disabled={!reports} className={PILL + " h-10"}><Upload size={13} />Import data file</button>
          <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(event) => { if (event.target.files[0]) importJson(event.target.files[0]); event.target.value = ""; }} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          Reports are stored in this browser only. Use Export data inside a report to back it up or move it to another device.
        </p>
        {error && <p className="mt-2 text-[12px] text-[#E04848]">{error}</p>}
      </section>

      <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
        <h2 className="text-base font-semibold text-white md:text-[15px]">Reports</h2>
        {!reports ? (
          <p className="mt-3 text-[13px] text-white/55">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="mt-3 text-[13px] text-white/55">No reports yet. Pick a month above and create the first one.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reports.map((report) => {
              const { year: reportYear } = parsePeriod(report.period);
              return (
                <li key={report.id} className={`flex flex-wrap items-center gap-3 p-3 ${INNER}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-white/85"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">{periodLabel(report.period)}</p>
                    <p className="text-[11px] text-white/50">
                      {report.status === "final" ? "Final" : "Draft"} · created {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {reportYear}
                    </p>
                  </div>
                  <button type="button" onClick={() => setActiveId(report.id)} className={PILL}>Open</button>
                  <button type="button" aria-label={`Delete ${periodLabel(report.period)} report`} onClick={() => remove(report)} className={PILL + " w-9 px-0"}><Trash2 size={13} /></button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
