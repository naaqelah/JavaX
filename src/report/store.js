// Penyimpanan laporan bulanan. Memakai IndexedDB (bukan localStorage) karena laporan
// memuat foto dalam bentuk data URL yang bisa melebihi batas 5 MB localStorage.
// Data hanya ada di browser ini; pakai Export/Import JSON untuk memindahkannya.

const DB_NAME = "jgf-monthly-reports";
const STORE = "reports";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export const listReports = () =>
  run("readonly", (store) => store.getAll()).then((rows) =>
    (rows || []).sort((a, b) => (a.period < b.period ? 1 : -1))
  );
export const putReport = (report) =>
  run("readwrite", (store) => store.put({ ...report, updatedAt: new Date().toISOString() }));
export const removeReport = (id) => run("readwrite", (store) => store.delete(id));

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "2026-07" -> { year: 2026, month: 7 }
export const parsePeriod = (period) => {
  const [year, month] = String(period).split("-").map(Number);
  return { year, month };
};
export const periodLabel = (period) => {
  const { year, month } = parsePeriod(period);
  return `${MONTHS[month - 1]} ${year}`;
};
export const periodLabelId = (period) => {
  const { year, month } = parsePeriod(period);
  return `${MONTHS_ID[month - 1]} ${year}`;
};
export const previousPeriod = (period) => {
  const { year, month } = parsePeriod(period);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
};
export const reportFileName = (period) =>
  `Marketing_Monthly_Report_${periodLabel(period).replace(" ", "_")}`;

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

export const SECTIONS = [
  ["execSummary", "Executive Summary & KPI Scorecard"],
  ["updates", "Department Updates"],
  ["social", "Social Media"],
  ["production", "Content Production"],
  ["campaign", "Campaign Performance"],
  ["analyst", "Analyst Performance"],
  ["programs", "Progress & Planning"],
  ["actionPlan", "Action Plan"],
  ["outro", "Outro"],
];

const emptyPlatform = ([key, name]) => ({
  key, name, handle: "", followers: "", views: "", impressions: "", engagement: "", posts: "",
  postBreakdown: "", adCost: "", newFollowers: "", insights: "", nextPlan: "", images: [],
});

// Laporan kosong: semua angka kosong (bukan nol) supaya tidak tampil sebagai data.
export function emptyReport(period) {
  return {
    id: `report-${period}`,
    period,
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
    sections: Object.fromEntries(SECTIONS.map(([key]) => [key, true])),
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
    analystTargets: Object.fromEntries(ANALYST_METRICS.map(([key]) => [key, ""])),
    updates: [],
    programs: [],
    actionPlan: [],
    // Teks kosong = pakai narasi otomatis; teks terisi = hasil suntingan pengguna.
    text: {
      execSummary: "", strategicNotes: "", socialNote: "", campaignSummary: "",
      campaignInsights: "", campaignNextPlan: "", analystInsights: "", analystPlan: "", outro: "",
    },
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
