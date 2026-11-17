// Penyimpanan laporan (mingguan dan bulanan) dan pustaka dokumentasi.
// Memakai IndexedDB (bukan localStorage) karena foto berbentuk data URL bisa melebihi batas 5 MB.
// Laporan = snapshot: semua suntingan (angka, teks, foto) tersimpan di laporan itu saja dan
// tidak pernah menulis balik ke data dashboard. Data hanya ada di browser ini;
// pakai Export/Import JSON untuk memindahkannya.

const DB_NAME = "jgf-monthly-reports";
const REPORTS = "reports";
const PHOTOS = "photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REPORTS)) db.createObjectStore(REPORTS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(storeName, mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = action(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export const listReports = () =>
  run(REPORTS, "readonly", (store) => store.getAll()).then((rows) =>
    (rows || []).map(migrate).sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1))
  );
export const putReport = (report) =>
  run(REPORTS, "readwrite", (store) => store.put({ ...report, updatedAt: new Date().toISOString() }));
export const removeReport = (id) => run(REPORTS, "readwrite", (store) => store.delete(id));

export const listPhotos = () =>
  run(PHOTOS, "readonly", (store) => store.getAll()).then((rows) =>
    (rows || []).sort((a, b) => (a.date < b.date ? 1 : -1))
  );
export const putPhoto = (photo) => run(PHOTOS, "readwrite", (store) => store.put(photo));
export const removePhoto = (id) => run(PHOTOS, "readwrite", (store) => store.delete(id));

// ---------------------------------------------------------------- Tanggal dan periode
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const pad = (value) => String(value).padStart(2, "0");
export const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
};
// Senin pada minggu yang memuat tanggal tersebut
export const mondayOf = (iso) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toIso(date);
};
const dateParts = (iso) => {
  const [year, month, day] = String(iso).split("-").map(Number);
  return { year, month, day };
};
export const fmtDate = (iso, names = MONTHS) => {
  if (!iso) return "";
  const { year, month, day } = dateParts(iso);
  return `${day} ${names[month - 1].slice(0, 3)} ${year}`;
};
const fmtRange = (start, end, names, full) => {
  const a = dateParts(start);
  const b = dateParts(end);
  const name = (m) => (full ? names[m - 1] : names[m - 1].slice(0, 3));
  if (a.year === b.year && a.month === b.month) return `${a.day}–${b.day} ${name(a.month)} ${a.year}`;
  if (a.year === b.year) return `${a.day} ${name(a.month)} – ${b.day} ${name(b.month)} ${a.year}`;
  return `${a.day} ${name(a.month)} ${a.year} – ${b.day} ${name(b.month)} ${b.year}`;
};

// "2026-07" -> { year: 2026, month: 7 }
export const parsePeriod = (period) => {
  const [year, month] = String(period).split("-").map(Number);
  return { year, month };
};
export const periodLabel = (period) => {
  const { year, month } = parsePeriod(period);
  return `${MONTHS[month - 1]} ${year}`;
};
export const previousPeriod = (period) => {
  const { year, month } = parsePeriod(period);
  return month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
};

export const isWeekly = (report) => report?.type === "weekly";
const sortKey = (report) => (isWeekly(report) ? report.range?.start : `${report.period}-01`) || "";
// Label periode untuk judul dan UI (Inggris) dan untuk narasi (Indonesia)
export const labelOf = (report) =>
  isWeekly(report) ? fmtRange(report.range.start, report.range.end, MONTHS, false) : periodLabel(report.period);
export const labelOfId = (report) =>
  isWeekly(report)
    ? fmtRange(report.range.start, report.range.end, MONTHS_ID, false)
    : `${MONTHS_ID[parsePeriod(report.period).month - 1]} ${parsePeriod(report.period).year}`;
export const typeLabel = (report) => (isWeekly(report) ? "Weekly Report" : "Monthly Report");
export const reportFileName = (report) =>
  isWeekly(report)
    ? `Marketing_Weekly_Report_${report.range.start}_to_${report.range.end}`
    : `Marketing_Monthly_Report_${periodLabel(report.period).replace(" ", "_")}`;
export const reportId = (type, key) => `${type}-${key}`;

// Apakah tanggal ISO (YYYY-MM-DD) termasuk periode laporan ini
export const inPeriod = (report, iso) => {
  const date = String(iso || "").slice(0, 10);
  if (!date) return false;
  return isWeekly(report)
    ? date >= report.range.start && date <= report.range.end
    : date.startsWith(report.period);
};
// Laporan pembanding: bulan sebelumnya atau minggu yang berakhir sehari sebelum minggu ini
export const findPrevious = (report, reports) =>
  reports.find((item) =>
    isWeekly(report)
      ? isWeekly(item) && item.range.end === addDays(report.range.start, -1)
      : !isWeekly(item) && item.period === previousPeriod(report.period)
  ) || null;

// ---------------------------------------------------------------- Struktur laporan
export const DEFAULT_PLATFORMS = [
  ["youtube", "YouTube"],
  ["tiktok-official", "TikTok Official"],
  ["tiktok-people", "TikTok People"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["threads", "Threads"],
  ["x", "X (Twitter)"],
];

export const ANALYST_METRICS = [
  ["signal", "Signal Trading"],
  ["coaching", "Private Coaching"],
  ["analysis", "Market Analysis"],
  ["article", "JavaFX Article"],
  ["video", "Education Video"],
  ["webinar", "Webinar"],
];

// Katalog bagian yang bisa dipakai. "types" = jenis laporan yang memakainya secara bawaan.
export const SECTION_CATALOG = {
  execSummary: { label: "Executive Summary & KPI Scorecard", gallery: false },
  updates: { label: "Department Updates", gallery: true },
  activities: { label: "Weekly Activities", gallery: false },
  social: { label: "Social Media", gallery: true },
  production: { label: "Content Production", gallery: true },
  campaign: { label: "Campaign Performance", gallery: false },
  analyst: { label: "Analyst Performance", gallery: false },
  programs: { label: "Progress & Planning", gallery: true },
  evaluation: { label: "Evaluation & Next Week Plan", gallery: false },
  actionPlan: { label: "Action Plan", gallery: false },
  outro: { label: "Outro", gallery: false },
};
export const DEFAULT_ORDER = {
  monthly: ["execSummary", "updates", "social", "production", "campaign", "analyst", "programs", "actionPlan", "outro"],
  weekly: ["execSummary", "activities", "programs", "campaign", "social", "production", "evaluation", "outro"],
};
export const customId = () => `custom:${Math.random().toString(36).slice(2, 8)}`;
export const isCustom = (id) => String(id).startsWith("custom:");

// Kategori dokumentasi (dipakai untuk menyaring foto yang relevan)
export const PHOTO_CATEGORIES = [
  ["general", "General"],
  ["cover", "Cover / team"],
  ["update", "Department update"],
  ["production", "Content production"],
  ["campaign", "Campaign / ads"],
  ["program", "Program / activity"],
  ["analyst", "Analyst"],
  ...DEFAULT_PLATFORMS,
];

const emptyPlatform = ([key, name]) => ({
  key, name, handle: "", followers: "", views: "", impressions: "", engagement: "", posts: "",
  postBreakdown: "", adCost: "", newFollowers: "", insights: "", nextPlan: "", images: [],
});

const emptyTexts = () => ({
  execSummary: "", strategicNotes: "", socialNote: "", campaignSummary: "", campaignInsights: "",
  campaignNextPlan: "", analystInsights: "", analystPlan: "", outro: "", evaluation: "", nextWeek: "",
});

// Laporan kosong: semua angka kosong (bukan nol) supaya tidak tampil sebagai data.
// type: "monthly" (key = "YYYY-MM") atau "weekly" (key = tanggal mulai, end = tanggal akhir).
export function emptyReport(type, key, end) {
  const weekly = type === "weekly";
  const order = [...DEFAULT_ORDER[type]];
  return {
    id: reportId(type, key),
    type,
    period: key,
    range: weekly ? { start: key, end: end || addDays(key, 6) } : null,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: {
      department: "Marketing Department",
      company: "JAVA",
      author: "",
      authorTitle: "",
      coverImage: null,
      authorPhoto: null,
    },
    order,
    sections: Object.fromEntries(order.map((id) => [id, true])),
    labels: {},      // judul/subjudul yang disunting pengguna
    overrides: {},   // angka turunan yang ditimpa pengguna (kosong = pakai hasil hitung otomatis)
    layout: {},      // pengaturan foto per bagian: { cols, h, dates, hide }
    custom: [],      // bagian bebas buatan pengguna
    kpi: {
      leads: { actual: "", target: "" },
      registration: { actual: "", target: "" },
      ftd: { actual: "", target: "" },
      deposit: { actual: "", target: "" },
      adSpend: { actual: "", target: "" },
      roasTarget: "",
      cplTarget: "",
      cpaTarget: "",
    },
    ads: { impressions: "", clicks: "" },
    channels: [],
    platforms: DEFAULT_PLATFORMS.map(emptyPlatform),
    production: {
      produced: "", published: "", video: "", design: "", live: "", webinar: "",
      insights: "", nextPlan: "", images: [],
    },
    analysts: [],
    analystTargets: Object.fromEntries(ANALYST_METRICS.map(([key2]) => [key2, ""])),
    updates: [],
    activities: [],
    programs: [],
    actionPlan: [],
    // Teks kosong = pakai narasi otomatis; teks terisi = hasil suntingan pengguna.
    text: emptyTexts(),
  };
}

// Melengkapi laporan lama (atau hasil impor) dengan field baru tanpa mengubah isinya
export function migrate(report) {
  const type = report.type === "weekly" ? "weekly" : "monthly";
  const base = emptyReport(type, report.period || "2000-01", report.range?.end);
  const order = Array.isArray(report.order)
    ? report.order
    : [...DEFAULT_ORDER[type]];
  return {
    ...base,
    ...report,
    type,
    order,
    meta: { ...base.meta, ...report.meta },
    sections: { ...Object.fromEntries(order.map((id) => [id, true])), ...report.sections },
    labels: report.labels || {},
    overrides: report.overrides || {},
    layout: report.layout || {},
    custom: report.custom || [],
    activities: report.activities || [],
    text: { ...emptyTexts(), ...report.text },
    production: { ...base.production, ...report.production },
    kpi: { ...base.kpi, ...report.kpi },
    ads: { ...base.ads, ...report.ads },
  };
}

// Kompres foto ke JPEG (sisi terpanjang maks. 1400 px) sebelum disimpan
export function fileToDataUrl(file, maxSide = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Not an image"));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
