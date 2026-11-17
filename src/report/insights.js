// Narasi otomatis berbasis aturan. Hanya memakai angka yang benar-benar ada:
// tanpa data pembanding tidak ada kalimat pertumbuhan; tanpa angka tidak ada kalimat.
// Narasi ditulis dalam bahasa Indonesia mengikuti PDF acuan dan selalu bisa disunting.
import { fmtGrowth, fmtInt, fmtPct, fmtRp } from "./calc";
import { periodLabelId, previousPeriod } from "./store";

const join = (parts) => parts.filter(Boolean).join(" ");
const list = (items) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} dan ${items[items.length - 1]}`;
const trend = (value) => (value >= 0 ? "naik" : "turun");
const withGrowth = (text, value) => (value === null || value === undefined ? text : `${text} (${trend(value)} ${fmtGrowth(value)})`);

export function generateTexts(report, data) {
  const period = periodLabelId(report.period);
  const prevLabel = periodLabelId(previousPeriod(report.period));
  const g = data.growth;
  const met = data.kpiRows.filter((row) => row.status.tone === "good");
  const missed = data.kpiRows.filter((row) => row.status.tone === "warn");

  // ---------- Executive Summary ----------
  const acquisition = [
    data.leads !== null && withGrowth(`Total leads mencapai ${fmtInt(data.leads)}`, g.leads),
    data.registration !== null && withGrowth(`registrasi ${fmtInt(data.registration)}`, g.registration),
    data.ftd !== null && withGrowth(`FTD ${fmtInt(data.ftd)} akun`, g.ftd),
  ].filter(Boolean);
  const execSummary = join([
    acquisition.length ? `Sepanjang ${period}, ${list(acquisition)}.` : "",
    data.deposit !== null && data.spend !== null
      ? `Total deposit yang diperoleh sebesar ${fmtRp(data.deposit)} dari total belanja iklan ${fmtRp(data.spend)}${data.roas !== null ? `, menghasilkan ROAS ${fmtPct(data.roas)}` : ""}.`
      : data.deposit !== null ? `Total deposit yang diperoleh sebesar ${fmtRp(data.deposit)}.` : "",
    met.length || missed.length
      ? `Dari ${met.length + missed.length} KPI yang memiliki target, ${met.length} tercapai${missed.length ? ` dan ${missed.length} belum tercapai (${list(missed.map((row) => row.label))})` : ""}.`
      : "",
  ]);

  // ---------- Catatan strategis ----------
  const up = Object.entries({ leads: "leads", registration: "registrasi", ftd: "FTD" }).filter(([key]) => g[key] !== null && g[key] > 0).map(([, label]) => label);
  const down = Object.entries({ leads: "leads", registration: "registrasi", ftd: "FTD" }).filter(([key]) => g[key] !== null && g[key] < 0).map(([, label]) => label);
  const strategicNotes = join([
    up.length ? `Volume ${list(up)} tumbuh dibanding ${prevLabel}.` : "",
    down.length ? `Volume ${list(down)} menurun dibanding ${prevLabel} dan perlu dievaluasi.` : "",
    g.roas !== null ? `ROAS ${trend(g.roas)} ${fmtGrowth(g.roas)} dibanding bulan sebelumnya${g.roas < 0 ? ", sehingga efisiensi belanja iklan menjadi prioritas bulan berikutnya" : ""}.` : "",
    g.cpl !== null ? `Biaya per lead ${g.cpl <= 0 ? "membaik" : "meningkat"} (${fmtGrowth(g.cpl)}).` : "",
    missed.length ? `Prioritas perbaikan: ${list(missed.map((row) => row.label))}.` : met.length ? "Seluruh KPI bertarget tercapai pada periode ini." : "",
  ]);

  // ---------- Social media ----------
  const social = data.social;
  const topViews = [...social.filled].filter((p) => p.n.views !== null).sort((a, b) => b.n.views - a.n.views)[0];
  const topFollowers = [...social.filled].filter((p) => p.n.followers !== null).sort((a, b) => b.n.followers - a.n.followers)[0];
  const socialNote = join([
    social.impressions !== null ? withGrowth(`Total impression seluruh platform mencapai ${fmtInt(social.impressions)}`, social.growth.impressions) + "." : "",
    social.engagementRate !== null ? `Engagement rate rata-rata ${fmtPct(social.engagementRate, 1)}.` : "",
    topViews ? `${topViews.name} menjadi penyumbang views terbesar (${fmtInt(topViews.n.views)}).` : "",
    topFollowers && topFollowers !== topViews ? `Basis pengikut terbesar ada di ${topFollowers.name} (${fmtInt(topFollowers.n.followers)}).` : "",
  ]);

  // ---------- Campaign ----------
  const campaignSummary = join([
    acquisition.length ? `${list(acquisition)}.`.replace(/^./, (c) => c.toUpperCase()) : "",
    g.spend !== null ? `Belanja iklan ${trend(g.spend)} ${fmtGrowth(g.spend)} dibanding ${prevLabel}.` : "",
    data.roas !== null ? withGrowth(`ROAS berada di ${fmtPct(data.roas)}`, g.roas) + "." : "",
  ]);
  const channels = (report.channels || []).filter((channel) => channel.name);
  const best = [...channels].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
  const weak = [...channels].filter((channel) => Number(channel.rating || 0) > 0 && Number(channel.rating) <= 2);
  const campaignInsights = join([
    data.cpl !== null ? `Biaya per lead ${fmtRp(data.cpl)}${data.cpa !== null ? ` dan biaya per akuisisi ${fmtRp(data.cpa)}` : ""}.` : "",
    data.leadToReg !== null ? `Konversi leads ke registrasi ${fmtPct(data.leadToReg, 1)}${data.regToFtd !== null ? `, registrasi ke FTD ${fmtPct(data.regToFtd, 1)}` : ""}.` : "",
    best && Number(best.rating) > 0 ? `${best.name} menjadi kanal dengan penilaian tertinggi.` : "",
    weak.length ? `${list(weak.map((channel) => channel.name))} perlu dievaluasi.` : "",
  ]);
  const campaignNextPlan = join([
    best && Number(best.rating) > 0 ? `Tingkatkan skala anggaran pada ${best.name} secara bertahap.` : "",
    weak.length ? `Lakukan evaluasi dan restrukturisasi pada ${list(weak.map((channel) => channel.name))}.` : "",
    missed.some((row) => row.key === "cpa" || row.key === "cpl") ? "Optimalkan penargetan untuk menekan biaya akuisisi." : "",
  ]);

  // ---------- Analyst ----------
  const scored = data.analysts.scorecard.filter((row) => row.achievement !== null);
  const analystMet = scored.filter((row) => row.achievement >= 100);
  const analystMissed = scored.filter((row) => row.achievement < 100);
  const analystInsights = join([
    data.analysts.rows.length ? `${data.analysts.rows.length} analis tercatat pada periode ini.` : "",
    analystMet.length ? `Target tercapai pada ${list(analystMet.map((row) => row.label))}.` : "",
    analystMissed.length ? `Belum mencapai target pada ${list(analystMissed.map((row) => `${row.label} (${fmtPct(row.achievement)})`))}.` : "",
  ]);
  const analystPlan = analystMissed.length
    ? `Fokus bulan berikutnya: mengejar target ${list(analystMissed.map((row) => row.label))}.`
    : analystMet.length ? "Pertahankan produktivitas dan konsistensi pada seluruh kategori." : "";

  // ---------- Outro ----------
  const outro = join([
    met.length || missed.length ? `Periode ${period} ditutup dengan ${met.length} dari ${met.length + missed.length} KPI bertarget tercapai.` : "",
    missed.length ? `Fokus bulan berikutnya adalah ${list(missed.map((row) => row.label))}.` : "",
  ]);

  return { execSummary, strategicNotes, socialNote, campaignSummary, campaignInsights, campaignNextPlan, analystInsights, analystPlan, outro };
}

// Teks yang ditampilkan: suntingan pengguna bila ada, kalau tidak narasi otomatis.
export const resolveTexts = (report, data) => {
  const auto = generateTexts(report, data);
  return Object.fromEntries(Object.keys(auto).map((key) => [key, report.text?.[key]?.trim() ? report.text[key] : auto[key]]));
};
