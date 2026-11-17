// Report Generator: laporan mingguan dan bulanan.
// Alur: pilih jenis + periode -> isi/tarik data -> template terisi otomatis -> sunting apa saja ->
// preview -> simpan atau unduh PDF. Semua suntingan (angka, teks, foto, urutan halaman) tersimpan di
// snapshot laporan itu sendiri di IndexedDB browser ini; data dashboard tidak pernah diubah.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, Download, FileText,
  ImagePlus, Images, Plus, Printer, RefreshCw, RotateCcw, Sparkles, Trash2, Upload,
} from "lucide-react";
import GlassSelect from "../components/ui/GlassSelect";
import { TEAM } from "../data/people";
import ReportDocument, { buildSheets } from "../report/ReportPages";
import { OVERRIDE_FIELDS, derive, validate } from "../report/calc";
import { generateTexts, resolveTexts } from "../report/insights";
import {
  ANALYST_METRICS, MONTHS, PHOTO_CATEGORIES, SECTION_CATALOG, addDays, customId, emptyReport, fileToDataUrl,
  findPrevious, fmtDate, inPeriod, isCustom, isWeekly, labelOf, listPhotos, listReports, migrate, mondayOf,
  periodLabel, putPhoto, putReport, removePhoto, removeReport, reportFileName, reportId, toIso, typeLabel,
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

const GALLERY_SECTIONS = ["updates", "social", "production", "programs"];
const TITLE_FIELDS = [
  ["coverMain", "Cover: main text", "e.g. JULY or 6–12 JUL"],
  ["coverKind", "Cover: MONTHLY / WEEKLY"],
  ["coverWord", "Cover: REPORT"],
  ["titleMain", "Title page: heading"],
  ["subtitle", "Title page: subtitle"],
  ["execTitle", "Summary title"],
  ["kpiChartTitle", "KPI chart title"],
  ["strategicTitle", "Strategic notes heading"],
  ["updatePrefix", "Update title prefix"],
  ["activitiesTitle", "Weekly activities title", null, "weekly"],
  ["socialTitle", "Social media title"],
  ["productionTitle", "Content production title"],
  ["campaignTitle", "Campaign title"],
  ["analystTitle", "Analyst title", null, "monthly"],
  ["evaluationTitle", "Evaluation title", null, "weekly"],
  ["nextWeekTitle", "Next week plan title", null, "weekly"],
  ["actionTitle", "Action plan title", null, "monthly"],
  ["outroTitle", "Outro title"],
];
const STATUS_OPTIONS = ["Done", "In progress", "Planned", "Blocked"];

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
const sortReports = (list) =>
  [...list].sort((a, b) => ((isWeekly(a) ? a.range.start : `${a.period}-01`) < (isWeekly(b) ? b.range.start : `${b.period}-01`) ? 1 : -1));

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

// Pengelola foto: unggah, ambil dari pustaka (terbaru dulu, sesuai periode dan kategori), saran otomatis,
// keterangan, tanggal, urutan, hapus (hanya dari laporan; file di pustaka tidak ikut terhapus)
function ImageManager({ images = [], onChange, max = 8, hint, category = "general", report, photos, reloadPhotos }) {
  const input = useRef(null);
  const [picker, setPicker] = useState(false);
  const [anyCategory, setAnyCategory] = useState(false);
  const [anyPeriod, setAnyPeriod] = useState(false);
  const [message, setMessage] = useState("");

  const toEntry = (photo) => ({ src: photo.src, caption: photo.caption || "", date: photo.date, category: photo.category, photoId: photo.id });
  const used = new Set(images.map((image) => image.photoId).filter(Boolean));
  const matches = (photos || []).filter(
    (photo) => !used.has(photo.id) && (anyCategory || photo.category === category) && (anyPeriod || inPeriod(report, photo.date))
  );

  const upload = async (files) => {
    const added = [];
    for (const file of Array.from(files)) {
      try {
        const photo = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src: await fileToDataUrl(file),
          caption: "",
          date: toIso(new Date(file.lastModified || Date.now())),
          category,
        };
        await putPhoto(photo);
        added.push(toEntry(photo));
      } catch { /* bukan gambar: lewati */ }
    }
    if (added.length) {
      onChange([...images, ...added].slice(0, max));
      reloadPhotos?.();
      setMessage("Photo date comes from the file's modified date. Check it matches the report period.");
    }
  };
  const suggest = () => {
    const room = max - images.length;
    const picks = (photos || [])
      .filter((photo) => !used.has(photo.id) && photo.category === category && inPeriod(report, photo.date))
      .slice(0, Math.max(0, room));
    if (!picks.length) return setMessage("No unused photo for this category within the report period.");
    onChange([...images, ...picks.map(toEntry)]);
    return setMessage(`Added ${picks.length} latest photo${picks.length === 1 ? "" : "s"}. Check each date before publishing.`);
  };
  const move = (index, step) => {
    const next = [...images];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const full = images.length >= max;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-white/75">Photos ({images.length}/{max}) · optional</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={suggest} disabled={full} className={PILL + " h-8 px-2.5"}><Sparkles size={12} />Suggest latest</button>
          <button type="button" onClick={() => setPicker((value) => !value)} className={PILL + " h-8 px-2.5"}><Images size={12} />Library</button>
          <button type="button" onClick={() => input.current?.click()} disabled={full} className={PILL + " h-8 px-2.5"}><ImagePlus size={12} />Upload</button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { upload(event.target.files); event.target.value = ""; }} />
      </div>
      {hint && <p className="mt-1 text-[11px] text-white/45">{hint}</p>}
      {message && <p className="mt-1 text-[11px] text-white/60">{message}</p>}

      {picker && (
        <div className={`mt-2 p-2.5 ${INNER}`}>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/65">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={anyCategory} onChange={(event) => setAnyCategory(event.target.checked)} className="accent-[#B91C1C]" />Other categories</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={anyPeriod} onChange={(event) => setAnyPeriod(event.target.checked)} className="accent-[#B91C1C]" />Other periods</label>
          </div>
          {matches.length === 0 ? (
            <p className="mt-2 text-[12px] text-white/55">No matching photo. Upload one, or tick the options above to widen the search.</p>
          ) : (
            <ul className="mt-2 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {matches.map((photo) => (
                <li key={photo.id}>
                  <button type="button" disabled={full} onClick={() => onChange([...images, toEntry(photo)])} className="block w-full text-left disabled:opacity-40">
                    <img src={photo.src} alt="" className="h-16 w-full rounded-md object-cover" />
                    <span className="mt-1 block text-[10px] leading-tight text-white/70">{fmtDate(photo.date)}</span>
                    <span className={`block text-[10px] leading-tight ${inPeriod(report, photo.date) ? "text-emerald-300" : "text-amber-300"}`}>
                      {inPeriod(report, photo.date) ? "In period" : "Other period"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {images.length > 0 && (
        <ul className="mt-2 space-y-2">
          {images.map((image, index) => (
            <li key={index} className={`flex flex-wrap items-center gap-2 p-2 ${INNER}`}>
              <img src={image.src} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
              <div className="grid min-w-[160px] flex-1 gap-1.5 sm:grid-cols-[1fr_130px]">
                <input value={image.caption} placeholder="Caption (optional)" onChange={(event) => onChange(setIn(images, [index, "caption"], event.target.value))} className={FIELD + " h-9"} />
                <input type="date" aria-label="Photo date" value={image.date || ""} onChange={(event) => onChange(setIn(images, [index, "date"], event.target.value))} className={FIELD + " h-9 px-2"} />
              </div>
              {image.date && !inPeriod(report, image.date) && <span className="text-[10px] font-medium text-amber-300">Outside period</span>}
              <button type="button" aria-label="Move up" onClick={() => move(index, -1)} disabled={index === 0} className={PILL + " h-9 w-9 px-0"}><ArrowUp size={13} /></button>
              <button type="button" aria-label="Move down" onClick={() => move(index, 1)} disabled={index === images.length - 1} className={PILL + " h-9 w-9 px-0"}><ArrowDown size={13} /></button>
              <button type="button" aria-label="Remove photo from report" onClick={() => onChange(images.filter((_, i) => i !== index))} className={PILL + " h-9 w-9 px-0"}><Trash2 size={13} /></button>
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
            <input type="checkbox" checked={enabled !== false} onChange={(event) => onToggle(event.target.checked)} className="h-4 w-4 accent-[#B91C1C]" />
            Show
          </label>
        )}
      </div>
      {open && <div className="space-y-3 border-t border-white/[0.08] p-3">{children}</div>}
    </div>
  );
}

// Daftar item yang bisa ditambah/dihapus (update, program, analis, kanal, action plan, aktivitas)
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
function Editor({ report, previous, photos, reloadPhotos, onChange, onBack, saveState }) {
  const set = (path, value) => onChange(setIn(report, path, value));
  const weekly = isWeekly(report);
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
  const [addChoice, setAddChoice] = useState("");

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
    document.title = reportFileName(report);
    const done = () => { document.title = title; setPrinting(false); };
    window.addEventListener("afterprint", done, { once: true });
    const timer = setTimeout(() => window.print(), 350);
    return () => { clearTimeout(timer); window.removeEventListener("afterprint", done); };
  }, [printing, report]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportFileName(report)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Tarik data yang memang tersimpan di dashboard untuk periode ini (hanya dibaca, tidak diubah)
  const pullContent = () => {
    const cards = readJson("jgf-content-calendar");
    if (!Array.isArray(cards)) return setNotice("No saved Content Calendar data in this browser.");
    const inRange = cards.filter((card) => inPeriod(report, card.date));
    onChange(setIn(setIn(report, ["production", "produced"], String(inRange.length)), ["production", "published"],
      String(inRange.filter((card) => card.status === "published").length)));
    return setNotice(`Content Calendar: ${inRange.length} items dated ${labelOf(report)}. You can still edit the numbers.`);
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
    return setNotice("Promoter data added to Progress & Planning. It reflects the current state, not a specific period.");
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
  const has = (id) => report.order.includes(id);
  const img = (category) => ({ category, report, photos, reloadPhotos });

  // ---- Urutan halaman dan bagian bebas
  const order = report.order;
  const moveSection = (index, step) => {
    const next = [...order];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set(["order"], next);
  };
  const removeSection = (id) => {
    onChange({
      ...report,
      order: order.filter((item) => item !== id),
      custom: isCustom(id) ? report.custom.filter((section) => section.id !== id) : report.custom,
    });
  };
  const availableSections = Object.entries(SECTION_CATALOG).filter(([id]) => !order.includes(id));
  const addSection = (choice) => {
    if (!choice) return;
    if (choice === "custom") {
      const id = customId();
      onChange({
        ...report,
        order: [...order, id],
        custom: [...report.custom, { id, title: "New section", ribbon: "", group: "Additional", body: "", images: [] }],
        sections: { ...report.sections, [id]: true },
      });
    } else {
      onChange({ ...report, order: [...order, choice], sections: { ...report.sections, [choice]: true } });
    }
    setAddChoice("");
  };
  const sectionLabel = (id) =>
    isCustom(id) ? `Custom: ${report.custom.find((section) => section.id === id)?.title || "Untitled"}` : SECTION_CATALOG[id]?.label || id;
  const layoutField = (id, key, value) => set(["layout", id, key], value);

  const overridden = Object.keys(report.overrides).filter((key) => report.overrides[key] !== "" && report.overrides[key] != null);

  // ---- Form per bagian bawaan (tampil sesuai urutan di report.order)
  const forms = {
    execSummary: (
      <Section key="execSummary" title={weekly ? "Weekly Summary" : "Executive Summary"} enabled={on.execSummary} onToggle={toggle("execSummary")}>
        <Area label="Summary" rows={5} value={report.text.execSummary} auto={auto.execSummary} onChange={(value) => set(["text", "execSummary"], value)} />
        <Area label="Strategic notes" rows={4} value={report.text.strategicNotes} auto={auto.strategicNotes} onChange={(value) => set(["text", "strategicNotes"], value)} />
      </Section>
    ),
    updates: (
      <Section key="updates" title="Department Updates" enabled={on.updates} onToggle={toggle("updates")}>
        <Repeater items={report.updates} onChange={(value) => set(["updates"], value)} addLabel="Add update"
          blank={() => ({ title: "", status: "", insight: "", nextAction: "", images: [] })}
          render={(item, edit) => (
            <>
              <Field label="Title" value={item.title} placeholder="e.g. Podcast Studio" onChange={(value) => edit("title", value)} />
              <Area label="Status" rows={2} value={item.status} onChange={(value) => edit("status", value)} />
              <Area label="Insight" rows={2} value={item.insight} onChange={(value) => edit("insight", value)} />
              <Area label="Next action" rows={2} value={item.nextAction} onChange={(value) => edit("nextAction", value)} />
              <ImageManager images={item.images} onChange={(value) => edit("images", value)} {...img("update")} />
            </>
          )} />
      </Section>
    ),
    activities: (
      <Section key="activities" title="Weekly Activities" enabled={on.activities} onToggle={toggle("activities")}>
        <Repeater items={report.activities} onChange={(value) => set(["activities"], value)} addLabel="Add activity"
          blank={() => ({ date: report.range?.start || "", activity: "", status: "Done", pic: "" })}
          render={(item, edit) => (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field type="date" label="Date" value={item.date} onChange={(value) => edit("date", value)} />
                <div><span className={LABEL}>Status</span>
                  <GlassSelect label="Status" value={item.status || "Done"} onChange={(value) => edit("status", value)} options={STATUS_OPTIONS} /></div>
              </div>
              <Area label="Activity / achievement" rows={2} value={item.activity} onChange={(value) => edit("activity", value)} />
              <Field label="PIC" value={item.pic} onChange={(value) => edit("pic", value)} />
            </>
          )} />
      </Section>
    ),
    social: (
      <Section key="social" title="Social Media" enabled={on.social} onToggle={toggle("social")}>
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
              <ImageManager max={4} images={platform.images} onChange={edit("images")} hint="First photo is the account header; the rest are content thumbnails." {...img(platform.key)} />
            </Section>
          );
        })}
      </Section>
    ),
    production: (
      <Section key="production" title="Content Production" enabled={on.production} onToggle={toggle("production")}>
        <button type="button" onClick={pullContent} className={PILL}><RefreshCw size={13} />Use Content Calendar counts</button>
        <div className="grid grid-cols-3 gap-2">
          {[["produced", "Produced"], ["published", "Published"], ["video", "Video"], ["design", "Design"], ["live", "Live streaming"], ["webinar", "Webinar"]].map(([key, label]) => (
            <Field key={key} type="number" label={label} value={report.production[key]} onChange={(value) => set(["production", key], value)} />
          ))}
        </div>
        <Area label="Insights" value={report.production.insights} onChange={(value) => set(["production", "insights"], value)} />
        <Area label="Next plan" value={report.production.nextPlan} onChange={(value) => set(["production", "nextPlan"], value)} />
        <ImageManager max={6} images={report.production.images} onChange={(value) => set(["production", "images"], value)} hint="Content highlights." {...img("production")} />
      </Section>
    ),
    campaign: (
      <Section key="campaign" title="Campaign Performance" enabled={on.campaign} onToggle={toggle("campaign")}>
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
    ),
    analyst: (
      <Section key="analyst" title="Analyst Performance" enabled={on.analyst} onToggle={toggle("analyst")}>
        <span className={LABEL}>Targets (team total)</span>
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
    ),
    programs: (
      <Section key="programs" title="Progress & Planning" enabled={on.programs} onToggle={toggle("programs")}>
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
              <ImageManager max={6} images={item.images} onChange={(value) => edit("images", value)} {...img("program")} />
            </>
          )} />
      </Section>
    ),
    evaluation: (
      <Section key="evaluation" title="Evaluation & Next Week Plan" enabled={on.evaluation} onToggle={toggle("evaluation")}>
        <Area label="Weekly evaluation" rows={4} value={report.text.evaluation} auto={auto.evaluation} onChange={(value) => set(["text", "evaluation"], value)} />
        <Area label="Next week plan" rows={4} value={report.text.nextWeek} auto={auto.nextWeek} onChange={(value) => set(["text", "nextWeek"], value)} />
        <span className={LABEL}>Next week action items</span>
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
    ),
    actionPlan: (
      <Section key="actionPlan" title="Action Plan" enabled={on.actionPlan} onToggle={toggle("actionPlan")}>
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
    ),
    outro: (
      <Section key="outro" title="Outro" enabled={on.outro} onToggle={toggle("outro")}>
        <Area label="Closing note" rows={4} value={report.text.outro} auto={auto.outro} onChange={(value) => set(["text", "outro"], value)} />
      </Section>
    ),
  };
  const customForm = (section) => {
    const index = report.custom.findIndex((item) => item.id === section.id);
    const edit = (field) => (value) => set(["custom", index, field], value);
    return (
      <Section key={section.id} title={`Custom: ${section.title || "Untitled"}`} enabled={on[section.id]} onToggle={toggle(section.id)}>
        <Field label="Title" value={section.title} onChange={edit("title")} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ribbon label" value={section.ribbon} placeholder="REPORT" onChange={edit("ribbon")} />
          <Field label="Table of contents group" value={section.group} placeholder="Additional" onChange={edit("group")} />
        </div>
        <Area label="Text" rows={6} value={section.body} onChange={edit("body")} />
        <ImageManager max={6} images={section.images} onChange={edit("images")} hint="Photos are optional; without photos the section is a text page." {...img("general")} />
      </Section>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header editor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className={PILL}><ArrowLeft size={14} />Reports</button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white md:text-[20px]">{typeLabel(report)} · {labelOf(report)}</h1>
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
              onChange={(images) => set(["meta", "coverImage"], images[0]?.src || null)} {...img("cover")} />
          </Section>

          <Section title="Titles & subtitles">
            <p className="text-[11px] text-white/45">Leave a field empty to keep the default title. Use \n for a line break.</p>
            {TITLE_FIELDS.filter(([, , , only]) => !only || only === report.type).map(([key, label, placeholder]) => (
              <Field key={key} label={label} value={report.labels[key]} placeholder={placeholder || "Default"}
                onChange={(value) => set(["labels", key], value.replace(/\\n/g, "\n"))} />
            ))}
          </Section>

          <Section title={`Marketing KPI (${weekly ? "this week" : "this month"})`} defaultOpen>
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

          <Section title={`Displayed values${overridden.length ? ` · ${overridden.length} edited` : ""}`}>
            <p className="text-[11px] leading-relaxed text-white/50">
              Calculated figures use the data above. Type a number to change what this report shows; the source data stays untouched. Revert to go back to the calculated value.
            </p>
            {overridden.length > 0 && (
              <button type="button" onClick={() => set(["overrides"], {})} className={PILL}><RotateCcw size={13} />Revert all to calculated</button>
            )}
            <div className="space-y-2">
              {OVERRIDE_FIELDS.map((field) => {
                const value = report.overrides[field.key];
                const edited = value !== "" && value != null;
                const calculated = data.auto[field.from || field.key];
                return (
                  <div key={field.key} className="grid grid-cols-[1fr_120px_auto] items-end gap-2">
                    <div className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-white/75">{field.label}</span>
                      <span className="text-[11px] text-white/45">Calculated: {calculated === null || calculated === undefined ? "N/A" : field.fmt(calculated)}</span>
                    </div>
                    <input type="number" inputMode="decimal" aria-label={`${field.label} shown in report`} value={value ?? ""} placeholder="Auto"
                      onChange={(event) => set(["overrides", field.key], event.target.value)} className={FIELD + " h-9"} />
                    <button type="button" aria-label={`Revert ${field.label}`} disabled={!edited} onClick={() => set(["overrides", field.key], "")} className={PILL + " h-9 w-9 px-0"}><RotateCcw size={13} /></button>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Pages & layout" defaultOpen>
            <p className="text-[11px] leading-relaxed text-white/50">
              Reorder, hide or remove sections, and add your own. Photos are optional everywhere: hide them per section, or change columns and photo height.
            </p>
            <ul className="space-y-2">
              {order.map((id, index) => {
                const layout = report.layout[id] || {};
                const gallery = GALLERY_SECTIONS.includes(id) || isCustom(id);
                return (
                  <li key={id} className={`space-y-2 p-2.5 ${INNER}`}>
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white">{sectionLabel(id)}</span>
                      <label className="flex shrink-0 items-center gap-1 text-[11px] text-white/60">
                        <input type="checkbox" checked={on[id] !== false} onChange={(event) => set(["sections", id], event.target.checked)} className="h-4 w-4 accent-[#B91C1C]" />Show
                      </label>
                      <button type="button" aria-label="Move section up" disabled={index === 0} onClick={() => moveSection(index, -1)} className={PILL + " h-8 w-8 px-0"}><ArrowUp size={12} /></button>
                      <button type="button" aria-label="Move section down" disabled={index === order.length - 1} onClick={() => moveSection(index, 1)} className={PILL + " h-8 w-8 px-0"}><ArrowDown size={12} /></button>
                      <button type="button" aria-label="Remove section" onClick={() => removeSection(id)} className={PILL + " h-8 w-8 px-0"}><Trash2 size={12} /></button>
                    </div>
                    {gallery && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-white/60">
                        <label className="flex items-center gap-1.5">Columns
                          <select value={layout.cols || ""} onChange={(event) => layoutField(id, "cols", event.target.value ? Number(event.target.value) : "")} className="h-7 rounded-md border border-white/10 bg-black/40 px-1 text-white [color-scheme:dark]">
                            <option value="">Auto</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                          </select></label>
                        <label className="flex items-center gap-1.5">Photo height
                          <select value={layout.h || ""} onChange={(event) => layoutField(id, "h", event.target.value ? Number(event.target.value) : "")} className="h-7 rounded-md border border-white/10 bg-black/40 px-1 text-white [color-scheme:dark]">
                            <option value="">Auto</option>{[90, 120, 150, 200, 260, 320].map((n) => <option key={n} value={n}>{n}px</option>)}
                          </select></label>
                        <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(layout.dates)} onChange={(event) => layoutField(id, "dates", event.target.checked)} className="accent-[#B91C1C]" />Show photo dates</label>
                        <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(layout.hide)} onChange={(event) => layoutField(id, "hide", event.target.checked)} className="accent-[#B91C1C]" />No photos</label>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <span className={LABEL}>Add section</span>
                <GlassSelect label="Add section" value={addChoice} placeholder="Choose a section" onChange={addSection}
                  options={[...availableSections.map(([id, entry]) => ({ value: id, label: entry.label })), { value: "custom", label: "Custom section (free text + photos)" }]} />
              </div>
            </div>
          </Section>

          {order.map((id) => (isCustom(id) ? report.custom.filter((section) => section.id === id).map(customForm) : forms[id]))}
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

// ------------------------------------------------------------------ Pustaka dokumentasi
function Library({ photos, reloadPhotos }) {
  const input = useRef(null);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const add = async (files) => {
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        await putPhoto({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          src: await fileToDataUrl(file), caption: "",
          date: toIso(new Date(file.lastModified || Date.now())), category,
        });
        count += 1;
      } catch { /* bukan gambar */ }
    }
    await reloadPhotos();
    setMessage(count ? `${count} photo${count === 1 ? "" : "s"} added. Dates come from the files' modified dates; change a date when you add it to a report.` : "No image files were added.");
  };
  const setCat = async (photo, value) => { await putPhoto({ ...photo, category: value }); reloadPhotos(); };
  return (
    <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
      <h2 className="text-base font-semibold text-white md:text-[15px]">Documentation library</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-white/50">
        Photos for reports. Pick them from a report&rsquo;s Library button; the newest photo within the report period and category is suggested first. Removing a photo here does not remove it from reports that already use it.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2.5">
        <div className="w-[220px]"><span className={LABEL}>Category for new photos</span>
          <GlassSelect label="Category" value={category} onChange={setCategory} options={PHOTO_CATEGORIES.map(([value, label]) => ({ value, label }))} /></div>
        <button type="button" onClick={() => input.current?.click()} className={PILL + " h-10"}><ImagePlus size={14} />Add photos</button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { add(event.target.files); event.target.value = ""; }} />
      </div>
      {message && <p className="mt-2 text-[12px] text-white/65">{message}</p>}
      {photos.length === 0 ? (
        <p className="mt-3 text-[13px] text-white/55">No photos yet.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo) => (
            <li key={photo.id} className={`overflow-hidden ${INNER}`}>
              <img src={photo.src} alt="" className="h-20 w-full object-cover" />
              <div className="space-y-1 p-2">
                <p className="text-[11px] font-medium text-white/80">{fmtDate(photo.date)}</p>
                <select value={photo.category} onChange={(event) => setCat(photo, event.target.value)} aria-label="Photo category" className="h-7 w-full rounded-md border border-white/10 bg-black/40 px-1 text-[11px] text-white [color-scheme:dark]">
                  {PHOTO_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" onClick={async () => { await removePhoto(photo.id); reloadPhotos(); }} className={PILL + " h-7 w-full px-2"}><Trash2 size={11} />Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Halaman utama
export default function MonthlyReport() {
  const [reports, setReports] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [saveState, setSaveState] = useState("Saved");
  const [error, setError] = useState("");
  const now = new Date();
  const [type, setType] = useState("monthly");
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [start, setStart] = useState(mondayOf(toIso(now)));
  const [end, setEnd] = useState(addDays(mondayOf(toIso(now)), 6));
  const importInput = useRef(null);
  const saveTimer = useRef(null);

  const reloadPhotos = () => listPhotos().then(setPhotos).catch(() => setPhotos([]));
  useEffect(() => {
    listReports().then(setReports).catch(() => { setReports([]); setError("Could not open report storage in this browser."); });
    reloadPhotos();
  }, []);

  const active = reports?.find((report) => report.id === activeId) || null;
  const previous = active ? findPrevious(active, reports) : null;

  const change = (next) => {
    setReports((current) => current.map((report) => (report.id === next.id ? next : report)));
    setSaveState("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      putReport(next).then(() => setSaveState("Saved")).catch(() => setSaveState("Save failed (storage full?)"));
    }, 600);
  };
  const create = async () => {
    setError("");
    const weekly = type === "weekly";
    if (weekly && (!start || !end || end < start)) return setError("Choose a start date, and an end date on or after it.");
    const key = weekly ? start : `${year}-${month}`;
    const existing = reports.find((report) => report.id === reportId(type, key));
    if (existing) return setActiveId(existing.id);
    const report = emptyReport(type, key, weekly ? end : undefined);
    await putReport(report);
    setReports((current) => sortReports([report, ...current]));
    return setActiveId(report.id);
  };
  const remove = async (report) => {
    if (!window.confirm(`Delete the ${typeLabel(report)} for ${labelOf(report)}? This cannot be undone.`)) return;
    await removeReport(report.id);
    setReports((current) => current.filter((item) => item.id !== report.id));
  };
  const importJson = async (file) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.period || !parsed?.kpi) throw new Error("bad file");
      const report = migrate(parsed);
      report.id = reportId(report.type, report.period);
      await putReport(report);
      setReports((current) => sortReports([report, ...current.filter((item) => item.id !== report.id)]));
      setError("");
    } catch {
      setError("That file is not a report data file.");
    }
  };

  if (active)
    return <Editor report={active} previous={previous} photos={photos} reloadPhotos={reloadPhotos} onChange={change} onBack={() => setActiveId(null)} saveState={saveState} />;

  const years = Array.from({ length: 5 }, (_, index) => String(now.getFullYear() - 2 + index));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">Report Generator</h1>
        <p className="mt-1.5 text-xs text-white/55">Create weekly and monthly marketing reports. Fill in the data once, edit anything, preview, then download as PDF.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Reports created", reports ? reports.length : "…"],
          ["Latest", reports?.[0] ? `${typeLabel(reports[0])} · ${labelOf(reports[0])}` : "None yet"],
          ["Final reports", reports ? reports.filter((report) => report.status === "final").length : "…"],
        ].map(([label, value]) => (
          <div key={label} className={`p-4 ${INNER}`}>
            <p className="text-[11px] text-white/55">{label}</p>
            <p className="mt-1 truncate text-lg font-semibold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
        <h2 className="text-base font-semibold text-white md:text-[15px]">Create new report</h2>
        <div role="tablist" aria-label="Report type" className="mt-3 inline-flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {[["monthly", "Monthly Report"], ["weekly", "Weekly Report"]].map(([key, label]) => (
            <button key={key} role="tab" aria-selected={type === key} type="button" onClick={() => setType(key)}
              className={`h-9 rounded-lg px-4 text-[13px] font-medium ${type === key ? "bg-[#C42428] text-white" : "text-white/65"}`}>{label}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2.5">
          {type === "monthly" ? (
            <>
              <div className="w-[160px]"><span className={LABEL}>Month</span>
                <GlassSelect label="Month" value={month} onChange={setMonth} options={MONTHS.map((name, index) => ({ value: String(index + 1).padStart(2, "0"), label: name }))} /></div>
              <div className="w-[110px]"><span className={LABEL}>Year</span>
                <GlassSelect label="Year" value={year} onChange={setYear} options={years} /></div>
            </>
          ) : (
            <>
              <Field type="date" label="Start date" value={start} className="w-[170px]" onChange={(value) => { setStart(value); if (value) setEnd(addDays(value, 6)); }} />
              <Field type="date" label="End date" value={end} className="w-[170px]" onChange={setEnd} />
            </>
          )}
          <button type="button" onClick={create} disabled={!reports} className={PILL_PRIMARY + " h-10"}><Plus size={14} />Create {type} report</button>
          <button type="button" onClick={() => importInput.current?.click()} disabled={!reports} className={PILL + " h-10"}><Upload size={13} />Import data file</button>
          <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(event) => { if (event.target.files[0]) importJson(event.target.files[0]); event.target.value = ""; }} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-white/45">
          Reports are stored in this browser only. Edits stay inside the report; dashboard data is never changed. Use Export data inside a report to back it up or move it to another device.
        </p>
        {error && <p className="mt-2 text-[12px] text-[#E04848]">{error}</p>}
      </section>

      <section className={`rounded-2xl p-4 md:p-5 ${GLASS}`}>
        <h2 className="text-base font-semibold text-white md:text-[15px]">Reports</h2>
        {!reports ? (
          <p className="mt-3 text-[13px] text-white/55">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="mt-3 text-[13px] text-white/55">No reports yet. Choose a type and period above and create the first one.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reports.map((report) => (
              <li key={report.id} className={`flex flex-wrap items-center gap-3 p-3 ${INNER}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-white/85"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white">{typeLabel(report)} · {labelOf(report)}</p>
                  <p className="text-[11px] text-white/50">
                    {report.status === "final" ? "Final" : "Draft"} · created {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button type="button" onClick={() => setActiveId(report.id)} className={PILL}>Open</button>
                <button type="button" aria-label={`Delete ${typeLabel(report)} ${labelOf(report)}`} onClick={() => remove(report)} className={PILL + " w-9 px-0"}><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Library photos={photos} reloadPhotos={reloadPhotos} />
    </div>
  );
}
