// Report Generator: laporan mingguan dan bulanan.
// Alur: pilih jenis + periode -> isi/tarik data -> template terisi otomatis -> sunting apa saja ->
// preview -> simpan atau unduh PDF. Semua suntingan (angka, teks, foto, urutan halaman) tersimpan di
// snapshot laporan itu sendiri di IndexedDB browser ini; data dashboard tidak pernah diubah.
import { Fragment, cloneElement, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, ChevronDown, Download, FileText,
  ImagePlus, Images, Plus, Printer, RefreshCw, Replace, RotateCcw, Sparkles, Trash2, Upload,
} from "lucide-react";
import GlassSelect from "../components/ui/GlassSelect";
import { TEAM } from "../data/people";
import ReportDocument, { buildSheets } from "../report/ReportPages";
import { dashboardPrevious, fieldSource, sourceSummary, syncFromDashboard } from "../report/dashboard";
import greenSpec from "../report/template/specs/monthly-green.json";
import { WEEK_PHOTOS, WEEK_START, makePreviousWeekReport, makeWeekFrom } from "../report/sampleWeek";
import { BUILTIN_PHOTOS, REINHART_PHOTO, isBuiltinPhoto, makeFromJuly, makeJuneReport } from "../report/sampleJuly";
import { OVERRIDE_FIELDS, derive, validate } from "../report/calc";
import { generateTexts, resolveTexts } from "../report/insights";
import {
  ANALYST_METRICS, DECK_BACKGROUNDS, DECK_SECTIONS, MONTHS, PHOTO_CATEGORIES, SECTION_CATALOG, addDays, customId, emptyReport, fileToDataUrl,
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
  const replaceInput = useRef(null);
  const replaceAt = useRef(0);
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
  // Ganti satu foto dengan file baru; foto asli diingat supaya bisa dikembalikan.
  const replace = async (file) => {
    const index = replaceAt.current;
    const old = images[index];
    if (!file || !old) return;
    try {
      const photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        src: await fileToDataUrl(file), caption: "",
        date: toIso(new Date(file.lastModified || Date.now())), category: old.category || category,
      };
      await putPhoto(photo);
      const original = old.original || { src: old.src, caption: old.caption, date: old.date, category: old.category, photoId: old.photoId };
      onChange(images.map((item, i) => (i === index ? { ...toEntry(photo), caption: old.caption, original } : item)));
      reloadPhotos?.();
      setMessage("Photo replaced. Use Restore original to bring back the provided photo.");
    } catch { setMessage("That file is not an image."); }
  };
  const restore = (index) => {
    onChange(images.map((item, i) => (i === index && item.original ? { ...item.original } : item)));
    setMessage("Original photo restored.");
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <span className="text-[12px] font-medium text-white/75">Photos ({images.length}/{max}) · optional</span>
        <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto">
          <button type="button" onClick={suggest} disabled={full} className={PILL + " h-8 px-2.5"}><Sparkles size={12} />Suggest latest</button>
          <button type="button" onClick={() => setPicker((value) => !value)} className={PILL + " h-8 px-2.5"}><Images size={12} />Library</button>
          <button type="button" onClick={() => input.current?.click()} disabled={full} className={PILL + " h-8 px-2.5"}><ImagePlus size={12} />Upload</button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(event) => { upload(event.target.files); event.target.value = ""; }} />
        <input ref={replaceInput} type="file" accept="image/*" hidden onChange={(event) => { replace(event.target.files[0]); event.target.value = ""; }} />
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
        <ul className="mt-3 space-y-3">
          {images.map((image, index) => (
            <li key={index} className={`p-3 ${INNER}`}>
              <div className="flex gap-3">
                <img src={image.src} alt="" className="h-[72px] w-24 shrink-0 rounded-lg object-cover sm:h-20 sm:w-28" />
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-white/60">Caption</span>
                    <input value={image.caption} placeholder="Caption (optional)" onChange={(event) => onChange(setIn(images, [index, "caption"], event.target.value))} className={FIELD + " h-9"} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-white/60">Photo date</span>
                    <input type="date" aria-label="Photo date" value={image.date || ""} onChange={(event) => onChange(setIn(images, [index, "date"], event.target.value))} className={FIELD + " h-9 px-2.5 sm:max-w-[190px]"} />
                  </label>
                </div>
              </div>
              {(isBuiltinPhoto(image.photoId) && !image.original) || image.original || (image.date && !inPeriod(report, image.date)) ? (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-medium">
                  {isBuiltinPhoto(image.photoId) && !image.original && <span className="rounded-full border border-white/15 px-2 py-0.5 text-white/60">Provided photo</span>}
                  {image.original && <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-emerald-300">Replaced</span>}
                  {image.date && !inPeriod(report, image.date) && <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-amber-300">Outside period</span>}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { replaceAt.current = index; replaceInput.current?.click(); }} className={PILL + " h-9 flex-1 px-3 sm:flex-none"}><Replace size={14} />Replace</button>
                {image.original && <button type="button" onClick={() => restore(index)} className={PILL + " h-9 flex-1 px-3 sm:flex-none"}><RotateCcw size={14} />Restore original</button>}
                <span className="ml-auto flex gap-2">
                  <button type="button" aria-label="Move up" title="Move up" onClick={() => move(index, -1)} disabled={index === 0} className={PILL + " h-9 w-9 px-0"}><ArrowUp size={16} className="shrink-0" /></button>
                  <button type="button" aria-label="Move down" title="Move down" onClick={() => move(index, 1)} disabled={index === images.length - 1} className={PILL + " h-9 w-9 px-0"}><ArrowDown size={16} className="shrink-0" /></button>
                  <button type="button" aria-label="Remove photo from report" title="Remove from report" onClick={() => onChange(images.filter((_, i) => i !== index))} className={PILL + " h-9 w-9 px-0"}><Trash2 size={16} className="shrink-0" /></button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Akordeon: di dalam satu langkah hanya satu bagian yang terbuka, supaya halaman tidak panjang
const AccordionContext = createContext(null);

function Section({ id, title, hint, nested = false, enabled, onToggle, children, defaultOpen = false }) {
  const accordion = useContext(AccordionContext);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const shared = Boolean(accordion && id && !nested);
  const open = shared ? accordion.openId === id : localOpen;
  const toggleOpen = () => (shared ? accordion.setOpenId(open ? null : id) : setLocalOpen((value) => !value));
  return (
    <div className={nested ? "overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.03]" : `overflow-hidden ${INNER}`}>
      <div className="flex items-center gap-2 px-3 py-3">
        <button type="button" onClick={toggleOpen} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
          <ChevronDown size={16} className={`mt-0.5 shrink-0 text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-white">{title}</span>
            {hint && <span className="mt-0.5 block text-[11px] font-normal leading-snug text-white/50">{hint}</span>}
          </span>
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
          <div className="flex justify-end border-t border-white/[0.08] pt-2.5">
            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== index))} className={PILL + " h-8 px-3"}><Trash2 size={15} />Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, blank()])} className={PILL}><Plus size={13} />{addLabel}</button>
    </div>
  );
}

// ------------------------------------------------------------------ Isi tambahan slide laporan mingguan
const TABLES = {
  topYoutube: ["Top YouTube content", "Add content", [["title", "Title"], ["type", "Type"], ["views", "Views"], ["likes", "Likes"], ["subs", "Subs"]]],
  liveSessions: ["Live sessions", "Add session", [["name", "Session"], ["views", "Views"], ["wow", "Change vs last week"], ["likes", "Likes"]]],
  topIgFb: ["Instagram / Facebook top content", "Add content", [["title", "Title"], ["views", "Views"], ["likes", "Likes"]]],
  topTiktok: ["TikTok top content", "Add content", [["title", "Title"], ["account", "Account"], ["views", "Views"], ["likes", "Likes"]]],
  channelTable: ["Channel performance", "Add channel", [["channel", "Channel"], ["spend", "Spend"], ["leads", "Leads"], ["regs", "Registrations"], ["ftd", "FTD"], ["deposit", "Deposit"]]],
  campaigns: ["Top campaigns", "Add campaign", [["campaign", "Campaign name"], ["channel", "Channel"], ["spend", "Spend"], ["leads", "Leads"], ["reg", "Registrations"], ["ftd", "FTD"], ["cpl", "CPL"], ["cpa", "CPA"], ["deposit", "Deposit"]]],
  trends: ["Weekly trends (last 5 weeks)", "Add week", [["week", "Week"], ["spend", "Spend"], ["leads", "Leads"], ["reg", "Registrations"], ["ftd", "FTD"], ["deposit", "Deposit"], ["nmi", "NMI"]]],
};
const EXAMPLES = {
  title: "Video or post title", type: "Video Edukasi", views: "1.234", likes: "56", subs: "-", name: "Live Market Eropa (Senin)", wow: "43%",
  account: "People or Official", channel: "Meta Ads", spend: "Rp 39.443.932", leads: "792", regs: "61", reg: "61", ftd: "5",
  deposit: "Rp 54.000.000", campaign: "Leads_Signal_0711", cpl: "Rp 99.612", cpa: "Rp 13,3 M", week: "6 - 12 November",
};
const PROD_TILES = [["marketReview", "Market review"], ["shorts", "Video shorts"], ["live", "Live streaming"], ["webinar", "Webinar"], ["reels", "Konten reels"], ["feeds", "Konten feeds"], ["ads", "Ads video"]];

// Teks tetap 3 baris (tema konten, fokus strategi, rekomendasi, action plan)
function Lines({ label, values = [], count = 3, onChange, hint }) {
  const list = Array.from({ length: count }, (_, index) => values[index] || "");
  return (
    <div className="space-y-2">
      <span className={LABEL}>{label}</span>
      {hint && <p className="-mt-1 text-[11px] text-white/45">{hint}</p>}
      {list.map((value, index) => (
        <input key={index} value={value} placeholder={`${label} ${index + 1}`} aria-label={`${label} ${index + 1}`}
          onChange={(event) => onChange(list.map((item, i) => (i === index ? event.target.value : item)))} className={FIELD} />
      ))}
    </div>
  );
}

// Bagian-bagian isi slide mingguan. Dikembalikan per bagian laporan supaya tampil di samping formulir yang terkait.
function deckSections({ report, set, photos, reloadPhotos }) {
  const deck = report.deck;
  const put = (key, value) => set(["deck", key], value);
  const img = (category) => ({ category, report, photos, reloadPhotos });
  const table = (key) => {
    const [label, addLabel, fields] = TABLES[key];
    return (
      <div key={key} className="space-y-2">
        <span className={LABEL}>{label}</span>
        <PasteRows fields={fields} onRows={(rows) => put(key, rows)} />
        <Repeater items={deck[key]} onChange={(value) => put(key, value)} addLabel={addLabel}
          blank={() => Object.fromEntries(fields.map(([field]) => [field, ""]))}
          render={(item, edit) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fields.map(([field, fieldLabel], index) => (
                <Field key={field} label={fieldLabel} value={item[field]} placeholder={`e.g. ${EXAMPLES[field] || ""}`}
                  className={index === 0 ? "sm:col-span-2" : ""} onChange={(value) => edit(field, value)} />
              ))}
            </div>
          )} />
      </div>
    );
  };
  const divider = (key, who) => (
    <div className="space-y-2">
      <span className={LABEL}>{who} divider slide</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Person in charge (PIC)" value={deck.dividers?.[key]?.pic} placeholder="e.g. Amabel Eugenia" onChange={(value) => set(["deck", "dividers", key], { ...deck.dividers?.[key], pic: value })} />
        <Field label="Team members" value={deck.dividers?.[key]?.team} placeholder="Separate names with commas" onChange={(value) => set(["deck", "dividers", key], { ...deck.dividers?.[key], team: value })} />
      </div>
    </div>
  );
  return {
    execSummary: (
      <Section id="deck-exec" title="Summary slide: headline" hint="The bold line under the KPI row and on the thank-you slide.">
        <Field label="Summary headline" value={deck.headline} placeholder="e.g. ACQUISITION IS GETTING STRONGER" onChange={(value) => put("headline", value)} />
      </Section>
    ),
    social: (
      <Section id="deck-social" title="Social slides: texts and themes" hint="Cards and the bottom band of the Social Media Performance slide, plus the section divider.">
        {divider("social", "Content and community")}
        <span className={LABEL}>Four cards (one under each KPI)</span>
        <Repeater items={deck.highlights} onChange={(value) => put("highlights", value)} addLabel="Add card" blank={() => ({ title: "", text: "" })}
          render={(item, edit) => (<><Field label="Card title" value={item.title} placeholder="e.g. DISTRIBUSI KONTEN SEMAKIN MELUAS" onChange={(value) => edit("title", value)} /><Area label="Card text" rows={2} value={item.text} onChange={(value) => edit("text", value)} /></>)} />
        <Field label="Top content headline" value={deck.topHeadline} onChange={(value) => put("topHeadline", value)} />
        <Area label="Next focus" rows={2} value={deck.nextFocus} onChange={(value) => put("nextFocus", value)} />
        <Lines label="Top content theme" hint="Up to 3 short names." values={deck.themes} onChange={(value) => put("themes", value)} />
        <Lines label="Next strategy" hint="Up to 3 short actions." values={deck.nextStrategy} onChange={(value) => put("nextStrategy", value)} />
      </Section>
    ),
    production: (
      <Section id="deck-production" title="Production slides: counts and top content" hint="Content counts, top YouTube, Instagram, TikTok, live sessions, webinar and new content.">
        {divider("production", "Creative production")}
        <span className={LABEL}>Content produced this week (counts)</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROD_TILES.map(([key, label]) => (
            <Field key={key} type="number" label={label} value={deck.prodTiles?.[key]} onChange={(value) => set(["deck", "prodTiles", key], value)} />
          ))}
        </div>
        {["topYoutube", "liveSessions", "topIgFb", "topTiktok"].map(table)}
        <span className={LABEL}>Webinar</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Status" value={deck.webinar?.status} placeholder="e.g. OFF (adanya Training)" onChange={(value) => set(["deck", "webinar", "status"], value)} />
          <Field label="Result" value={deck.webinar?.result} placeholder="e.g. 25 participants" onChange={(value) => set(["deck", "webinar", "result"], value)} />
        </div>
        <span className={LABEL}>New content (shown with a photo and link)</span>
        <Repeater items={deck.newContent} onChange={(value) => put("newContent", value)} addLabel="Add new content" blank={() => ({ title: "", url: "", image: null })}
          render={(item, edit) => (
            <>
              <Field label="Title" value={item.title} onChange={(value) => edit("title", value)} />
              <Field label="Link" value={item.url} placeholder="https://" onChange={(value) => edit("url", value)} />
              <ImageManager max={1} images={item.image ? [item.image] : []} onChange={(images) => edit("image", images[0] || null)} {...img("production")} />
            </>
          )} />
      </Section>
    ),
    campaign: (
      <Section id="deck-campaign" title="Campaign slides: channels, campaigns, trends" hint="Channel table, top campaigns and the last 5 weeks of spend and results.">
        {divider("campaign", "Performance marketing")}
        {["channelTable", "campaigns", "trends"].map(table)}
      </Section>
    ),
    analyst: (
      <Section id="deck-analyst" title="Analyst slides: recommendations" hint="Recommendation and action plan lists, plus the section divider.">
        {divider("analyst", "Market research")}
        <Lines label="Recommendation" hint="Up to 3 lines." values={deck.recommendations} onChange={(value) => put("recommendations", value)} />
        <Lines label="Action plan" hint="Up to 3 lines." values={deck.analystActions} onChange={(value) => put("analystActions", value)} />
      </Section>
    ),
    backgrounds: (
      <Section id="deck-bg" title="Slide background photos" hint="The soft photo behind each group of slides. Optional; replace only if you want to.">
        {DECK_BACKGROUNDS.map(([key, label]) => (
          <div key={key}>
            <span className={LABEL}>{label}</span>
            <ImageManager max={1} images={deck.backgrounds?.[key] ? [deck.backgrounds[key]] : []}
              onChange={(images) => set(["deck", "backgrounds", key], images[0] || null)} {...img("general")} />
          </div>
        ))}
      </Section>
    ),
  };
}

// Pilihan warna laporan bulanan: merah atau hijau
const THEMES = [["red", "Red", "#a61e22", "#5c0c16"], ["green", "Green", "#0b6b63", "#031d1a"]];
function ThemePicker({ value = "red", onChange }) {
  return (
    <div role="radiogroup" aria-label="Report color" className="grid grid-cols-2 gap-2">
      {THEMES.map(([key, label, c1, c2]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} onClick={() => onChange(key)}
          className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${value === key ? "border-white/60 bg-white/[0.10]" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
          <span className="h-9 w-12 shrink-0 rounded-lg border border-white/20" style={{ background: `linear-gradient(135deg, ${c1} 55%, ${c2} 55%)` }} />
          <span className="text-[13px] font-semibold text-white">{label}</span>
          {value === key && <CheckCircle2 size={16} className="ml-auto shrink-0 text-emerald-400" />}
        </button>
      ))}
    </div>
  );
}

// Isian khusus template bulanan HIJAU (KOL, podcast, item iklan, tabel kanal dan kampanye). Kosong = bagian itu tidak berisi data.
// DATA DUMMY untuk menguji tampilan template Hijau. Semua teks diberi tanda DUMMY dan bukan data laporan aktual.
const GREEN_DUMMY = {
  kol: [{ name: "DUMMY KOL A", activity: "DUMMY activity", collab: "DUMMY collab" }, { name: "DUMMY KOL B", activity: "DUMMY activity", collab: "DUMMY collab" }],
  podcast: { summary: "DUMMY podcast production summary", notes: "DUMMY publication notes", episodes: ["DUMMY episode 1", "DUMMY episode 2", "DUMMY episode 3"] },
  adsItems: ["DUMMY ads 1", "DUMMY ads 2", "DUMMY ads 3", "DUMMY ads 4", "DUMMY ads 5", "DUMMY ads 6"],
  channelTable: [
    { channel: "Meta Ads", spend: "Rp 100.000.000", leads: "1000", regs: "300", ftd: "30", deposit: "Rp 150.000.000" },
    { channel: "Google Ads", spend: "Rp 50.000.000", leads: "200", regs: "40", ftd: "4", deposit: "Rp 20.000.000" },
    { channel: "Organic", spend: "Rp 0", leads: "300", regs: "100", ftd: "10", deposit: "Rp 60.000.000" },
  ],
  campaigns: [1, 2, 3, 4, 5].map((n) => ({ campaign: "DUMMY campaign " + n, channel: "Meta Ads", spend: "Rp " + n * 10 + ".000.000", leads: String(n * 100), reg: String(n * 20), ftd: String(n * 2), cpl: "Rp 10.000", cpa: "Rp 500.000", deposit: "Rp " + n * 12 + ".000.000" })),
  trends: [
    { week: "DUMMY P1", spend: "Rp 120.000.000", leads: "1200", reg: "300", ftd: "30", deposit: "Rp 180.000.000", nmi: "Rp 60.000.000" },
    { week: "DUMMY P2", spend: "Rp 160.000.000", leads: "2400", reg: "520", ftd: "55", deposit: "Rp 260.000.000", nmi: "Rp 100.000.000" },
    { week: "DUMMY P3", spend: "Rp 90.000.000", leads: "1800", reg: "400", ftd: "42", deposit: "Rp 110.000.000", nmi: "Rp 20.000.000" },
    { week: "DUMMY P4", spend: "Rp 230.000.000", leads: "3658", reg: "869", ftd: "88", deposit: "Rp 290.000.000", nmi: "Rp 60.000.000" },
  ],
  captions: { highlight: "DUMMY highlight caption", channel: "DUMMY channel breakdown insight", cost: "DUMMY cost metrics insight", campaigns: "DUMMY campaign breakdown insight" },
};

// Teks tetap template Hijau yang bisa diganti (kartu nama tim, tile jenis konten, penanda tangan). Kosong/tidak diubah = teks asli template.
const GREEN_LABELS = greenSpec.fields.filter((f) => f.default !== undefined);
const CARD_PARTS = ["Title / name", "Subtitle / role", "Line 1", "Line 2"];
function LabelFields({ deck, set, pages, codes = /^CARD_/, title }) {
  const list = GREEN_LABELS.filter((f) => pages.includes(f.page) && codes.test(f.code));
  if (!list.length) return null;
  const groups = [];
  for (const f of list) {
    const m = f.code.match(/^CARD_(d+)_(d+)_L(d)$/);
    const key = m ? m[1] + "-" + m[2] : f.code;
    let group = groups.find((g) => g.key === key);
    if (!group) groups.push((group = { key, fields: [] }));
    group.fields.push({ f, label: m ? CARD_PARTS[m[3]] : f.default });
  }
  const put = (code, value) => set(["deck", "labels", code], value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>{title}</span>
        <button type="button" onClick={() => { const next = { ...(deck.labels || {}) }; list.forEach((f) => delete next[f.code]); set(["deck", "labels"], next); }} className={PILL + " h-8 px-3"}>Restore template text</button>
      </div>
      {groups.map((group, index) => (
        <div key={group.key} className="rounded-xl border border-white/10 p-2.5">
          <p className="mb-1.5 text-[11px] font-semibold text-white/55">Card {index + 1}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.fields.map(({ f, label }) => <Field key={f.code} label={label} value={deck.labels?.[f.code] ?? f.default} onChange={(value) => put(f.code, value)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tempel baris dari spreadsheet (Excel/Google Sheets): satu baris = satu baris tabel, kolom dipisah tab atau titik koma, urutan sama dengan isian di bawahnya.
function PasteRows({ fields, onRows }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const apply = () => {
    const rows = text.split(/\r?\n/).map((line) => line.split(/\t|;/).map((cell) => cell.trim())).filter((cells) => cells.some(Boolean))
      .map((cells) => Object.fromEntries(fields.map(([field], index) => [field, cells[index] || ""])));
    if (rows.length) onRows(rows);
    setText("");
    setOpen(false);
  };
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={PILL + " h-8 px-3"}>Paste rows from spreadsheet</button>;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-2.5">
      <p className="text-[11px] text-white/55">Columns, in order: {fields.map(([, name]) => name).join(" | ")}. Separate columns with a tab (copy from Excel / Google Sheets) or a semicolon. This replaces the rows below.</p>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[12px] text-white" />
      <div className="flex gap-2"><button type="button" onClick={apply} className={PILL + " h-8 px-3"}>Fill table</button><button type="button" onClick={() => setOpen(false)} className={PILL + " h-8 px-3"}>Cancel</button></div>
    </div>
  );
}

function greenSections({ report, set }) {
  const deck = report.deck;
  const put = (key, value) => set(["deck", key], value);
  const note = (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-amber-200/80">Green template: these fields are not in the July report, so they stay empty until you fill them. Text placement and colors are read from the template PDF; font sizes that the PDF does not state are estimated.</p>
      {JSON.stringify(deck).includes("DUMMY") && <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] font-semibold text-amber-200">This report still contains DUMMY test data. Press "Clear Green details" or overwrite it before sending the report.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => set(["deck"], { ...deck, ...GREEN_DUMMY })} className={PILL + " h-8 px-3"}>Fill with DUMMY data (layout test)</button>
        <button type="button" onClick={() => set(["deck"], { ...deck, kol: [], podcast: { summary: "", notes: "", episodes: [] }, adsItems: [], channelTable: [], campaigns: [], trends: [], captions: { highlight: "", channel: "", cost: "", campaigns: "" } })} className={PILL + " h-8 px-3"}>Clear Green details</button>
      </div>
    </div>
  );
  const table = (key) => {
    const [label, addLabel, fields] = TABLES[key];
    return (
      <div key={key} className="space-y-2">
        <span className={LABEL}>{label}</span>
        <Repeater items={deck[key]} onChange={(value) => put(key, value)} addLabel={addLabel}
          blank={() => Object.fromEntries(fields.map(([field]) => [field, ""]))}
          render={(item, edit) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fields.map(([field, fieldLabel], index) => (
                <Field key={field} label={fieldLabel} value={item[field]} placeholder={`e.g. ${EXAMPLES[field] || ""}`} className={index === 0 ? "sm:col-span-2" : ""} onChange={(value) => edit(field, value)} />
              ))}
            </div>
          )} />
      </div>
    );
  };
  return {
    social: (
      <Section id="green-kol" title="Green template: KOL collaboration and name cards" hint="The KOL table (2 rows) and the team name cards on the Social Media Overview page.">
        {note}
        <Repeater items={deck.kol} onChange={(value) => put("kol", value)} addLabel="Add KOL" blank={() => ({ name: "", activity: "", collab: "" })}
          render={(item, edit) => (<><Field label="Name" value={item.name} onChange={(value) => edit("name", value)} /><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Field label="Activity" value={item.activity} onChange={(value) => edit("activity", value)} /><Field label="Collaboration" value={item.collab} onChange={(value) => edit("collab", value)} /></div></>)} />
        <LabelFields deck={deck} set={set} pages={[4]} title="Team name cards (page 6)" />
      </Section>
    ),
    production: (
      <Section id="green-production" title="Green template: podcast, ads items, highlight caption" hint="Podcast summary and episodes, the 6 ads item titles, and the content highlight caption.">
        {note}
        <Area label="Podcast production summary" rows={2} value={deck.podcast?.summary} onChange={(value) => set(["deck", "podcast", "summary"], value)} />
        <Area label="Podcast publication notes" rows={2} value={deck.podcast?.notes} onChange={(value) => set(["deck", "podcast", "notes"], value)} />
        <Lines label="Podcast episode title" hint="Three episodes." values={deck.podcast?.episodes} onChange={(value) => set(["deck", "podcast", "episodes"], value)} />
        <Lines label="Ads item title" hint="Six items, in reading order." count={6} values={deck.adsItems} onChange={(value) => put("adsItems", value)} />
        <Field label="Content highlight caption" value={deck.captions?.highlight} onChange={(value) => set(["deck", "captions", "highlight"], value)} />
        <LabelFields deck={deck} set={set} pages={[8]} title="Team name cards and content-type tiles (page 14)" />
      </Section>
    ),
    campaign: (
      <Section id="green-campaign" title="Green template: trend, channel and campaign tables" hint="ROAS trend (4 periods), channel breakdown, up to 11 campaigns, and their captions.">
        {note}
        {table("trends")}
        {table("channelTable")}
        {table("campaigns")}
        <Area label="Channel breakdown insight" rows={2} value={deck.captions?.channel} onChange={(value) => set(["deck", "captions", "channel"], value)} />
        <Area label="Cost metrics insight" rows={2} value={deck.captions?.cost} onChange={(value) => set(["deck", "captions", "cost"], value)} />
        <Area label="Campaign breakdown insight" rows={2} value={deck.captions?.campaigns} onChange={(value) => set(["deck", "captions", "campaigns"], value)} />
        <p className="text-[11px] text-white/55">Campaign rows 9 to 11 keep the template names (Live Market, Atribusi lanjutan, Organik (5 sumber)) until you add campaigns 9 to 11 above.</p>
      </Section>
    ),
    analyst: (
      <Section id="green-analyst" title="Green template: analyst name cards" hint="The three analyst name cards on the Analyst Performance page.">
        <LabelFields deck={deck} set={set} pages={[12]} title="Analyst name cards (page 22)" />
      </Section>
    ),
    outro: (
      <Section id="green-outro" title="Green template: signature company" hint="The company line under the signature. The name and title come from Basics (author).">
        <Field label="Company line" value={deck.labels?.SIGNER_COMPANY ?? GREEN_LABELS.find((f) => f.code === "SIGNER_COMPANY")?.default ?? ""} onChange={(value) => set(["deck", "labels", "SIGNER_COMPANY"], value)} />
      </Section>
    ),
  };
}

// ------------------------------------------------------------------ Langkah pengisian
const STEPS = [
  ["basics", "Basics", "Who the report is by", "Start here. Check the author and cover. Titles are optional: leave a title empty to keep the default."],
  ["numbers", "Numbers", "This period's results", "Type the results and targets. ROAS, CPL, CPA and growth versus the previous period are calculated for you."],
  ["content", "Content", "Texts and details per page", "Open one section at a time. Texts follow your numbers: words like {leads} or {leadsTrend} are replaced with the current figures. Edit freely, or press Use auto text to go back."],
  ["layout", "Layout", "Pages and photos", "Optional. Choose which pages appear and in what order, and swap background photos. Nothing here is required."],
];
const ISSUE_STEP = { Cover: "basics", KPI: "numbers", Comparison: "numbers" };
const SECTION_HINTS = {
  execSummary: "The summary text and strategic notes.",
  updates: "Department news, one block per update.",
  activities: "What was done this week.",
  social: "Numbers, insights and next plan per platform.",
  production: "Content made and published, with photos.",
  campaign: "Channel ratings and the campaign texts.",
  analyst: "Analyst results against their targets.",
  programs: "Programs and their progress.",
  evaluation: "Evaluation of this week and the plan for next week.",
  actionPlan: "Actions with owner and target.",
  outro: "The closing message.",
};

// Bab laporan: tiap bab mengumpulkan semua isian yang dipakai halaman/slide di bab itu
const part = (kind, id, title, hint) => ({ kind, id, title, hint });
const WEEKLY_CHAPTERS = [
  { id: "ch-intro", title: "Summary", hint: "Slide 2: the weekly KPI row and the summary text.",
    contains: ["KPI row (leads, registration, FTD, rate, deposit): numbers come from the Numbers step", "Summary headline and summary text (bottom band)"],
    parts: [part("form", "execSummary", "Summary text and strategic notes"), part("deck", "execSummary", "Summary headline")] },
  { id: "ch-01", title: "01 · Content and Community", hint: "Divider, Social Media Performance, Overview, TikTok, Platform Performance.",
    contains: ["Divider slide: person in charge and team", "Social Media Performance: 4 totals, 4 highlight cards, top content theme, next strategy", "Social Media Overview: one table row per platform", "TikTok and Platform Performance: views, engagement, new followers, insights, next plan", "Team photo and name cards"],
    parts: [part("form", "social", "Platforms: numbers, insights, next plan, team photo"), part("deck", "social", "Slide texts: highlight cards, themes, PIC and team")] },
  { id: "ch-02", title: "02 · Creative Production", hint: "Divider, Creative Production, Content Production and Publication.",
    contains: ["Divider slide: person in charge and team", "Content counts (market review, shorts, live, webinar, reels, feeds, ads)", "Top YouTube content and live sessions", "Top Instagram/Facebook and TikTok content, webinar, new content with photo and link"],
    parts: [part("form", "production", "Production totals, texts, photos, team photo"), part("deck", "production", "Slide tables: counts, top content, new content")] },
  { id: "ch-03", title: "03 · Performance Marketing", hint: "Divider, Campaign Performance, Channel and Campaign Analysis, Weekly Trends.",
    contains: ["Divider slide: person in charge", "Campaign Performance: KPI cards, cost metric table (this week vs last week), weekly highlight text", "Channel Performance and top campaigns tables", "Weekly Trends: last 5 weeks"],
    parts: [part("form", "campaign", "Ads totals, channel notes, campaign texts, team photo"), part("deck", "campaign", "Slide tables: channels, top campaigns, weekly trends")] },
  { id: "ch-04", title: "04 · Market Research and Trading Intelligence", hint: "Divider, KPI Analyst, Recommendation and Action Plan.",
    contains: ["Divider slide: person in charge and team", "KPI Analyst table: targets and results per analyst", "Highlight, recommendation and action plan lists", "Team photo and name cards"],
    parts: [part("form", "analyst", "Analyst results, targets, texts, team photo"), part("deck", "analyst", "Slide lists: recommendation and action plan")] },
  { id: "ch-end", title: "Closing", hint: "Evaluation, next week focus and the thank-you slide.",
    contains: ["Evaluation and next week texts", "Thank-you message (bottom band of the last slide)"],
    parts: [part("form", "evaluation", "Evaluation and next week"), part("form", "outro", "Thank-you message")] },
];
const MONTHLY_CHAPTERS = [
  { id: "ch-01", title: "01 · Introduction", hint: "Table of Content, Executive Summary, Monthly KPI Scorecard.",
    contains: [
      "Table of Content: made automatically from the pages you turn on",
      "Executive Summary: 8 KPI tiles (leads, registration, FTD, deposit, ROAS, TikTok followers, total views, signal trading) and the summary text",
      "Monthly KPI Scorecard: chart and table of target, result and status, plus Strategic Notes",
      "Department updates: optional extra pages, for example a new studio",
    ],
    parts: [part("form", "execSummary", "Executive Summary and Strategic Notes"), part("form", "updates", "Department updates")] },
  { id: "ch-02", title: "02 · Community & Content", hint: "Social Media Performance, then one page per platform.",
    contains: [
      "Social Media Performance: total impression, engagement, followers, engagement rate, awareness ads report, team photo and name cards",
      "One page per platform (YouTube, TikTok Official, TikTok People, Instagram, Facebook, Threads, X): account, followers, views, posts, content breakdown, insights, next plan, account photos",
    ],
    parts: [part("extra", "social-overview", "Social Media Performance page"), part("platforms"), part("deck", "social", "Green template: KOL collaboration")] },
  { id: "ch-03", title: "03 · Creative Production", hint: "Content Production and Publication.",
    contains: [
      "Content produced and published by type (live streaming, video, design, webinar)",
      "YouTube and Instagram/Facebook posts, views and followers",
      "Insights, next plan, Content Highlights photos, team photo and name cards",
    ],
    parts: [part("form", "production", "Content Production and Publication page"), part("deck", "production", "Green template: podcast and ads")] },
  { id: "ch-04", title: "04 · Performance Marketing", hint: "Campaign Performance.",
    contains: [
      "Total spend, leads, registration, FTD and total deposit with growth",
      "Conversion funnel and key metrics (CPM, CPC, CTR, CPL, CPR, CPA, revenue per FTD): calculated from your numbers",
      "Return on ads spend and its insight",
      "Channel breakdown (rating and note per channel), insights, next plan, team photo",
    ],
    parts: [part("form", "campaign", "Campaign Performance page"), part("deck", "campaign", "Green template: tables")] },
  { id: "ch-05", title: "05 · Market Research & Trading Intelligence", hint: "Analyst Performance.",
    contains: [
      "Key Performance Indicator table: target, each analyst, total and status",
      "Totals: signal trading, private coaching, market analysis, JavaFx article",
      "Insight and recommendation texts, team photo and name cards",
    ],
    parts: [part("form", "analyst", "Analyst Performance page"), part("deck", "analyst", "Green template: analyst name cards")] },
  { id: "ch-06", title: "06 · Progress & Planning", hint: "Programs, Action Plan and Outro.",
    contains: [
      "Programs (for example Ads Video, Telesales Reward & Training, Social Media Promoter): status, next plan, notes and photos, one page each",
      "Action Plan: actions with owner and target",
      "Outro: the closing message signed by the author",
    ],
    parts: [part("form", "programs", "Programs"), part("form", "evaluation", "Evaluation"), part("form", "actionPlan", "Action Plan page"), part("form", "outro", "Outro page"), part("deck", "outro", "Green template: signature company")] },
];

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
  const [step, setStep] = useState("basics");
  const [openId, setOpenId] = useState("cover");
  const formTop = useRef(null);
  const stepIndex = STEPS.findIndex(([key]) => key === step);
  const FIRST_OPEN = { basics: "cover", numbers: "kpi", content: weekly ? "ch-intro" : "ch-01", layout: "layout" };
  const goStep = (key) => {
    setStep(key);
    setOpenId(FIRST_OPEN[key]);
    setTimeout(() => formTop.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 30);
  };

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
  const sources = useMemo(() => sourceSummary(report), [report]);
  const tag = (key, part) => {
    if (!sources.available) return "";
    const source = fieldSource(report, `kpi.${key}.${part}`, ["kpi", key, part]);
    return source === "dashboard" ? " · dashboard" : source === "manual" ? " · edited" : "";
  };
  // Laporan yang belum pernah disinkronkan: isi otomatis yang masih kosong dari dashboard (isian yang sudah ada tidak disentuh)
  useEffect(() => {
    if (report.dashboard) return;
    const result = syncFromDashboard(report);
    if (result.applied || result.available === 0) onChange(result.report);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id]);
  const syncNow = (force) => {
    if (force && !window.confirm("Replace every field that has dashboard data with the dashboard value? Numbers you edited by hand in those fields will be lost.")) return;
    const result = syncFromDashboard(report, { force });
    onChange(result.report);
    setNotice(result.available ? `Dashboard: ${result.applied} fields filled${result.kept ? `, ${result.kept} kept because you edited them` : ""}.` : "The dashboard has no data for this period, so nothing was filled.");
  };
  const pair = (key, label, targetLabel = "Target") => (
    <div className="grid grid-cols-2 gap-2">
      <Field type="number" label={`${label} (actual)${tag(key, "actual")}`} value={k[key].actual} onChange={(value) => set(["kpi", key, "actual"], value)} />
      <Field type="number" label={`${label} (${targetLabel.toLowerCase()})${tag(key, "target")}`} value={k[key].target} onChange={(value) => set(["kpi", key, "target"], value)} />
    </div>
  );
  const toggle = (key) => (value) => set(["sections", key], value);
  const on = report.sections;
  const has = (id) => report.order.includes(id);
  const img = (category) => ({ category, report, photos, reloadPhotos });
  // Foto tim dan kartu nama untuk halaman Social, Production, Campaign, Analyst
  const teamEditor = (key, category) => {
    const team = report.team?.[key] || { image: null, members: [] };
    const setTeam = (next) => set(["team", key], { ...team, ...next });
    return (
      <div className="space-y-3 border-t border-white/[0.08] pt-3">
        <span className={LABEL}>Team photo and name cards</span>
        <ImageManager max={1} images={team.image ? [team.image] : []} hint="Optional. Replace the photo only if you want to: use a transparent PNG cut-out for the best result. The name cards and lines of the template stay on top of it."
          onChange={(images) => setTeam({ image: images[0] || null })} {...img(category)} />
        <Repeater items={team.members} onChange={(value) => setTeam({ members: value })} addLabel="Add person"
          blank={() => ({ name: "", role: "", tasks: "" })}
          render={(item, editMember) => (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name" value={item.name} onChange={(value) => editMember("name", value)} />
                <Field label="Role" value={item.role} onChange={(value) => editMember("role", value)} />
              </div>
              <Field label="Tasks" value={item.tasks} placeholder="Separate with ·" onChange={(value) => editMember("tasks", value)} />
            </>
          )} />
      </div>
    );
  };

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

  const deckParts = weekly ? deckSections({ report, set, photos, reloadPhotos }) : report.meta.theme === "green" ? greenSections({ report, set }) : {};

  // ---- Social: satu blok per platform (dipakai juga oleh bab "Community and Content" laporan bulanan)
  const overviewNote = <Area label="Overview note" value={report.text.socialNote} auto={auto.socialNote} onChange={(value) => set(["text", "socialNote"], value)} />;
  const platformSection = (platform, index, nested) => {
    const edit = (field) => (value) => set(["platforms", index, field], value);
    return (
      <Section key={platform.key} nested={nested} title={nested ? `${platform.name}${platform.handle ? ` - ${platform.handle}` : ""}` : platform.name}
        hint={nested ? "Account, followers, views, posts, insights, next plan and account photos." : undefined}>
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
        <ImageManager max={platform.key === "youtube" ? 6 : ["facebook", "x"].includes(platform.key) ? 3 : 2} images={platform.images} onChange={edit("images")} hint={platform.key === "youtube" ? "Photo 1 = account screenshot. Photos 2 to 6 = the five video thumbnails, from left to right." : "Photo 1 = account screenshot. Photo 2 = the content thumbnails strip."} {...img(platform.key)} />
      </Section>
    );
  };
  const extras = {
    "social-overview": (
      <Section key="social-overview" nested title="Social Media Performance page" hint="Totals and awareness ads report on the overview page, plus the team photo.">
        {overviewNote}
        <p className="text-[11px] leading-relaxed text-white/50">Total impression, engagement, followers and engagement rate are added up from the platforms below. The awareness ads report uses each platform's ad cost, new followers, views and engagement.</p>
        {teamEditor("social", "cover")}
      </Section>
    ),
  };

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
        {overviewNote}
        {report.platforms.map((platform, index) => platformSection(platform, index, false))}
        {teamEditor("social", "cover")}
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
        <span className={LABEL}>Content by type (shown on the Content Production page)</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[["live", "Live streaming"], ["marketReview", "Long-form video"], ["ads", "Ads video"], ["webinar", "Webinar"], ["feeds", "Konten feeds"], ["reels", "Konten reels / shorts"]].map(([key, label]) => (
            <Field key={key} type="number" label={label} value={report.deck.prodTiles?.[key]} onChange={(value) => set(["deck", "prodTiles", key], value)} />
          ))}
        </div>
        <Area label="Insights" value={report.production.insights} onChange={(value) => set(["production", "insights"], value)} />
        <Area label="Next plan" value={report.production.nextPlan} onChange={(value) => set(["production", "nextPlan"], value)} />
        <ImageManager max={6} images={report.production.images} onChange={(value) => set(["production", "images"], value)} hint="Content highlights." {...img("production")} />
        {teamEditor("production", "production")}
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
        {teamEditor("campaign", "campaign")}
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
        {teamEditor("analyst", "analyst")}
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

  // ---- Bab-bab langkah Content: semua isian satu bab dikumpulkan di satu tempat
  const placed = new Set();
  const nest = (element, overrides) => cloneElement(element, { nested: true, id: undefined, ...overrides });
  const chapterNodes = (weekly ? WEEKLY_CHAPTERS : MONTHLY_CHAPTERS).map((chapter) => {
    const parts = chapter.parts.flatMap((p) => {
      if (p.kind === "extra" || p.kind === "platforms") {
        if (!order.includes("social")) return [];
        placed.add("social");
        const list = p.kind === "extra"
          ? [extras[p.id]]
          : report.platforms.map((platform, index) => <Fragment key={platform.key}>{platformSection(platform, index, true)}</Fragment>);
        return list.map((element, index) => (p.kind === "extra" ? <Fragment key={p.id}>{nest(element, { title: p.title })}</Fragment> : <Fragment key={`pl-${index}`}>{element}</Fragment>));
      }
      if (!order.includes(p.id)) return [];
      const element = p.kind === "form" ? forms[p.id] : deckParts[p.id];
      if (!element) return [];
      if (p.kind === "form") placed.add(p.id);
      return [<Fragment key={`${chapter.id}-${p.kind}-${p.id}`}>{nest(element, { title: p.title || element.props.title, hint: element.props.hint || SECTION_HINTS[p.id] })}</Fragment>];
    });
    if (!parts.length) return null;
    return (
      <Section key={chapter.id} id={chapter.id} title={chapter.title} hint={chapter.hint}>
        <div className="rounded-xl border border-dashed border-white/15 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">This part contains</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-white/65">
            {chapter.contains.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
        {parts}
      </Section>
    );
  });
  const leftover = order.filter((id) => (isCustom(id) ? true : forms[id] && !placed.has(id)));
  if (leftover.length) {
    chapterNodes.push(
      <Section key="ch-other" id="ch-other" title="Other pages" hint="Pages you added or that do not belong to a chapter above.">
        {leftover.map((id) => (isCustom(id)
          ? report.custom.filter((section) => section.id === id).map((section) => <Fragment key={id}>{nest(customForm(section), { hint: "Your own page." })}</Fragment>)
          : <Fragment key={id}>{nest(forms[id], { hint: SECTION_HINTS[id] })}</Fragment>))}
      </Section>
    );
  }

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

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* ------------------------- Form ------------------------- */}
        <div ref={formTop} className={`scroll-mt-[76px] space-y-3 ${tab === "edit" ? "" : "hidden xl:block"}`}>
          <AccordionContext.Provider value={{ openId, setOpenId }}>
          <nav role="tablist" aria-label="Report steps" className="sticky top-[68px] z-20 grid grid-cols-4 gap-1 rounded-2xl border border-white/[0.10] bg-[#0b0708]/90 p-1.5 shadow-lg backdrop-blur-md">
            {STEPS.map(([key, label], index) => {
              const missing = issues.filter((issue) => (ISSUE_STEP[issue.section] || "content") === key).length;
              return (
                <button key={key} role="tab" aria-selected={step === key} type="button" onClick={() => goStep(key)}
                  className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[12px] font-medium transition sm:flex-row sm:justify-center sm:gap-2 ${step === key ? "bg-[#C42428] text-white" : "text-white/65 hover:bg-white/[0.06]"}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${step === key ? "bg-white/25" : "bg-white/10"}`}>{index + 1}</span>
                  <span className="truncate">{label}</span>
                  {missing > 0 && step !== key && <span title={`${missing} missing`} className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
                </button>
              );
            })}
          </nav>
          <div className={`p-3 ${INNER}`}>
            <p className="text-[13px] font-semibold text-white">Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex][2]}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/60">{STEPS[stepIndex][3]}</p>
          </div>

          {step === "basics" && (<div className="space-y-3">
          {!weekly && (
            <div className={`p-3 ${INNER}`}>
              <span className={LABEL}>Report color</span>
              <ThemePicker value={report.meta.theme} onChange={(value) => set(["meta", "theme"], value)} />
            </div>
          )}
          <Section id="cover" title="Cover & author" hint="Department, who signs the report, and the cover photo.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Department" value={report.meta.department} onChange={(value) => set(["meta", "department"], value)} />
              <Field label="Company" value={report.meta.company} onChange={(value) => set(["meta", "company"], value)} />
              <Field label="Author" value={report.meta.author} onChange={(value) => set(["meta", "author"], value)} />
              <Field label="Author title" value={report.meta.authorTitle} onChange={(value) => set(["meta", "authorTitle"], value)} />
              {weekly && <Field label="Report designer" value={report.deck.designer} placeholder="Shown on the cover" onChange={(value) => set(["deck", "designer"], value)} />}
            </div>
            <div>
              <span className={LABEL}>Author photo (from team photos)</span>
              <GlassSelect label="Author photo" value={report.meta.authorPhoto || ""} placeholder="No photo"
                onChange={(value) => set(["meta", "authorPhoto"], value || null)}
                options={[{ value: "", label: "No photo" }, { value: REINHART_PHOTO, label: "Reinhart (report portrait)" }, ...TEAM.map((person) => ({ value: person.photo, label: person.name }))]} />
            </div>
            <ImageManager max={1} images={report.meta.coverImage ? [{ src: report.meta.coverImage, caption: "", category: "cover", original: report.meta.coverOriginal ? { src: report.meta.coverOriginal, caption: "", category: "cover" } : undefined }] : []}
              hint="Optional cover visual."
              onChange={(images) => set(["meta"], { ...report.meta, coverImage: images[0]?.src || null, coverOriginal: images[0]?.original?.src || null })} {...img("cover")} />
          </Section>

          <Section id="titles" title="Titles & subtitles" hint="Optional. Leave empty to keep the default wording.">
            <p className="text-[11px] text-white/45">Leave a field empty to keep the default title. Use \n for a line break.</p>
            {TITLE_FIELDS.filter(([, , , only]) => !only || only === report.type).map(([key, label, placeholder]) => (
              <Field key={key} label={label} value={report.labels[key]} placeholder={placeholder || "Default"}
                onChange={(value) => set(["labels", key], value.replace(/\\n/g, "\n"))} />
            ))}
          </Section>

          </div>)}

          {step === "numbers" && (<div className="space-y-3">
          {overridden.length > 0 && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-3">
              <p className="text-[12px] font-semibold text-amber-200">{overridden.length} totals are fixed to the values of the source report</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/65">They do not change when you edit the platform numbers. Press the button to calculate them from your numbers instead, or edit each one under Displayed values.</p>
              <button type="button" onClick={() => set(["overrides"], {})} className={PILL + " mt-2"}><RotateCcw size={13} />Calculate from my numbers</button>
            </div>
          )}
          <Section id="datasource" title="Data source" hint={weekly ? "This week's numbers can come from the dashboard." : "This month's numbers can come from the dashboard."}>
            <p className="text-[12px] leading-relaxed text-white/70">
              {sources.available
                ? `Dashboard has ${sources.available} values for ${labelOf(report)}: ${sources.dashboard} still from the dashboard, ${sources.manual.length} edited by you, ${sources.empty} empty.${sources.syncedAt ? ` Last synced ${new Date(sources.syncedAt).toLocaleString()}.` : " Not synced yet."}`
                : `The dashboard has no data for ${labelOf(report)}. Type the numbers below; nothing is made up.`}
            </p>
            <p className="text-[11px] leading-relaxed text-white/45">Dashboard figures are demo values (the dashboard has no real monthly history yet). Your edits are kept when you sync again; Reset replaces them.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!sources.available} onClick={() => syncNow(false)} className={PILL + " h-9 px-3 disabled:opacity-40"}><RefreshCw size={13} />Sync from Dashboard</button>
              <button type="button" disabled={!sources.available} onClick={() => syncNow(true)} className={PILL + " h-9 px-3 disabled:opacity-40"}><RotateCcw size={13} />Reset to Dashboard Data</button>
            </div>
            {sources.manual.length > 0 && <p className="text-[11px] text-amber-200/80">Edited by you: {sources.manual.map((row) => row.label).join(", ")}.</p>}
          </Section>
          <Section id="kpi" title={`Marketing KPI (${weekly ? "this week" : "this month"})`} hint="Type the actual result and the target for each number.">
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

          <Section id="displayed" title={`Displayed values${overridden.length ? ` · ${overridden.length} edited` : ""}`} hint="Advanced. Only needed to show a different number than the calculated one.">
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

          </div>)}

          {step === "layout" && (<div className="space-y-3">
          {deckParts.backgrounds}
          <Section id="layout" title="Pages & layout" hint="Show or hide pages, change their order, add your own page.">
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
                      <button type="button" aria-label="Move section up" disabled={index === 0} onClick={() => moveSection(index, -1)} className={PILL + " h-9 w-9 px-0"}><ArrowUp size={16} className="shrink-0" /></button>
                      <button type="button" aria-label="Move section down" disabled={index === order.length - 1} onClick={() => moveSection(index, 1)} className={PILL + " h-9 w-9 px-0"}><ArrowDown size={16} className="shrink-0" /></button>
                      <button type="button" aria-label="Remove section" onClick={() => removeSection(id)} className={PILL + " h-9 w-9 px-0"}><Trash2 size={16} className="shrink-0" /></button>
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

          </div>)}

          {step === "content" && (<div className="space-y-3">{chapterNodes}</div>)}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" onClick={() => goStep(STEPS[stepIndex - 1][0])} disabled={stepIndex === 0} className={PILL + " h-10 px-4"}><ArrowLeft size={14} />Back</button>
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" onClick={() => goStep(STEPS[stepIndex + 1][0])} className={PILL_PRIMARY + " h-10 px-4"}>Next: {STEPS[stepIndex + 1][1]}<ArrowRight size={14} /></button>
            ) : (
              <button type="button" onClick={() => { setTab("preview"); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30); }} className={PILL_PRIMARY + " h-10 px-4 xl:hidden"}>Preview report<ArrowRight size={14} /></button>
            )}
          </div>
          </AccordionContext.Provider>
        </div>

        {/* ------------------------- Preview ------------------------- */}
        <div className={`min-w-0 ${tab === "preview" ? "" : "hidden xl:block"}`}>
          <div ref={previewRef} className="rp-preview" style={{ "--rp-zoom": zoom }}>
            <ReportDocument sheets={sheets} theme={report.meta.theme} />
          </div>
        </div>
      </div>

      {printing && createPortal(<div className="rp-print-root"><ReportDocument sheets={sheets} theme={report.meta.theme} /></div>, document.body)}
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
                {photo.builtin ? (
                  <p className="truncate text-[11px] text-white/50" title={photo.caption}>Provided · {PHOTO_CATEGORIES.find(([value]) => value === photo.category)?.[1]}</p>
                ) : (
                  <>
                    <select value={photo.category} onChange={(event) => setCat(photo, event.target.value)} aria-label="Photo category" className="h-7 w-full rounded-md border border-white/10 bg-black/40 px-1 text-[11px] text-white [color-scheme:dark]">
                      {PHOTO_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="button" onClick={async () => { await removePhoto(photo.id); reloadPhotos(); }} className={PILL + " h-7 w-full px-2"}><Trash2 size={14} />Delete</button>
                  </>
                )}
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
  const [fromJuly, setFromJuly] = useState(true);
  const [fromWeek, setFromWeek] = useState(true);
  const [theme, setTheme] = useState("red");
  const importInput = useRef(null);
  const saveTimer = useRef(null);

  const reloadPhotos = () => listPhotos().then((list) => setPhotos([...list, ...BUILTIN_PHOTOS, ...WEEK_PHOTOS])).catch(() => setPhotos([...BUILTIN_PHOTOS, ...WEEK_PHOTOS]));
  useEffect(() => {
    listReports().then(setReports).catch(() => { setReports([]); setError("Could not open report storage in this browser."); });
    reloadPhotos();
  }, []);

  const active = reports?.find((report) => report.id === activeId) || null;
  const previous = useMemo(() => (active ? findPrevious(active, reports) || dashboardPrevious(active) : null), [active, reports]);

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
    const useSample = weekly ? fromWeek : fromJuly;
    const report = useSample ? (weekly ? makeWeekFrom(key, end) : makeFromJuly(key)) : emptyReport(type, key, weekly ? end : undefined);
    if (!weekly) report.meta = { ...report.meta, theme };
    // Laporan kosong langsung diisi dari data dashboard periodenya (bila ada); laporan contoh dibiarkan, bisa disinkronkan manual
    const base = useSample ? report : syncFromDashboard(report).report;
    const added = [base];
    // Laporan contoh dibandingkan dengan periode sebelumnya: sediakan pembanding (hanya angka KPI) bila belum ada
    if (useSample && !weekly && key === "2026-07" && !reports.some((item) => item.id === "monthly-2026-06")) added.push(makeJuneReport());
    if (useSample && weekly && key === WEEK_START && !reports.some((item) => item.id === "weekly-2026-10-30")) added.push(makePreviousWeekReport());
    for (const item of added) await putReport(item);
    setReports((current) => sortReports([...added, ...current]));
    return setActiveId(base.id);
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
        {type === "weekly" && (
          <label className="mt-3 flex items-start gap-2 text-[12px] leading-snug text-white/70">
            <input type="checkbox" checked={fromWeek} onChange={(event) => setFromWeek(event.target.checked)} className="mt-0.5 accent-[#B91C1C]" />
            <span>Start from the 6–12 November 2026 weekly report: its data, texts and photos are filled in. Edit any figure or text, and replace any photo only if you want to.</span>
          </label>
        )}
        {type === "monthly" && (
          <div className="mt-3 max-w-[420px]">
            <span className={LABEL}>Report color</span>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>
        )}
        {type === "monthly" && (
          <label className="mt-3 flex items-start gap-2 text-[12px] leading-snug text-white/70">
            <input type="checkbox" checked={fromJuly} onChange={(event) => setFromJuly(event.target.checked)} className="mt-0.5 accent-[#B91C1C]" />
            <span>Start from the July 2026 report: its data, texts and photos are filled in. Edit any figure or text, and replace any photo only if you want to.</span>
          </label>
        )}
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
                <button type="button" aria-label={`Delete ${typeLabel(report)} ${labelOf(report)}`} onClick={() => remove(report)} className={PILL + " h-9 w-9 px-0"}><Trash2 size={16} className="shrink-0" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Library photos={photos} reloadPhotos={reloadPhotos} />
    </div>
  );
}
