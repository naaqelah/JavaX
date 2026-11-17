// Perhitungan KPI laporan. Nilai kosong = null (bukan 0); pembagian dengan nol/kosong = null.
import { ANALYST_METRICS } from "./store";

export const num = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const div = (a, b) => (a === null || b === null || b === 0 ? null : a / b);
const pct = (a, b) => {
  const ratio = div(a, b);
  return ratio === null ? null : ratio * 100;
};
// Growth = (sekarang - sebelumnya) / sebelumnya x 100; null bila tidak ada pembanding
export const growth = (current, previous) =>
  current === null || previous === null || previous === 0 ? null : ((current - previous) / previous) * 100;
const sum = (values) => {
  const filled = values.filter((value) => value !== null);
  return filled.length ? filled.reduce((total, value) => total + value, 0) : null;
};

// ---------- Format (gaya Indonesia: titik ribuan, koma desimal) ----------
export const fmtInt = (value) => (value === null ? "N/A" : Math.round(value).toLocaleString("id-ID"));
export const fmtRp = (value) => (value === null ? "N/A" : `Rp${Math.round(value).toLocaleString("id-ID")}`);
export const fmtPct = (value, digits = 0) =>
  value === null ? "N/A" : `${value.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
// 37.012 -> 37,0 K ; 8.193.062 -> 8,19 M (M = juta, mengikuti PDF acuan)
export const fmtShort = (value) => {
  if (value === null) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (abs >= 1e4) return `${(value / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 1 })} K`;
  return fmtInt(value);
};
export const fmtRpShort = (value) => (value === null ? "N/A" : `Rp${fmtShort(value)}`);
export const fmtGrowth = (value) =>
  value === null ? null : `${value >= 0 ? "+" : ""}${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;

function core(report) {
  const kpi = report?.kpi || {};
  const leads = num(kpi.leads?.actual);
  const registration = num(kpi.registration?.actual);
  const ftd = num(kpi.ftd?.actual);
  const deposit = num(kpi.deposit?.actual);
  const spend = num(kpi.adSpend?.actual);
  const impressions = num(report?.ads?.impressions);
  const clicks = num(report?.ads?.clicks);
  const cpm = div(spend, impressions);
  return {
    leads, registration, ftd, deposit, spend,
    roas: pct(deposit, spend),
    cpl: div(spend, leads),
    cpr: div(spend, registration),
    cpa: div(spend, ftd),
    revPerFtd: div(deposit, ftd),
    cpm: cpm === null ? null : cpm * 1000,
    cpc: div(spend, clicks),
    ctr: pct(clicks, impressions),
    leadToReg: pct(registration, leads),
    regToFtd: pct(ftd, registration),
    leadToFtd: pct(ftd, leads),
    budgetUse: pct(spend, num(kpi.adSpend?.target)),
  };
}

function social(report) {
  const platforms = (report?.platforms || []).map((platform) => ({
    ...platform,
    n: {
      followers: num(platform.followers), views: num(platform.views),
      impressions: num(platform.impressions), engagement: num(platform.engagement),
      posts: num(platform.posts), adCost: num(platform.adCost), newFollowers: num(platform.newFollowers),
    },
  }));
  const total = (field) => sum(platforms.map((platform) => platform.n[field]));
  const impressions = total("impressions");
  const engagement = total("engagement");
  return {
    platforms,
    // Platform dianggap terisi bila ada minimal satu angka
    filled: platforms.filter((platform) => Object.values(platform.n).some((value) => value !== null)),
    impressions, engagement,
    followers: total("followers"),
    views: total("views"),
    posts: total("posts"),
    // Engagement rate = total engagement / total impression x 100
    engagementRate: pct(engagement, impressions),
  };
}

function analysts(report) {
  const rows = report?.analysts || [];
  const totals = Object.fromEntries(
    ANALYST_METRICS.map(([key]) => [key, sum(rows.map((row) => num(row[key])))])
  );
  const scorecard = ANALYST_METRICS.map(([key, label]) => {
    const target = num(report?.analystTargets?.[key]);
    return { key, label, actual: totals[key], target, achievement: pct(totals[key], target) };
  });
  return { rows, totals, scorecard };
}

// Status KPI. Metrik biaya (CPL, CPA): lebih rendah dari target = tercapai.
export function kpiStatus(actual, target, { cost = false } = {}) {
  if (actual === null) return { label: "NO DATA", tone: "muted", achievement: null };
  if (target === null || target === 0) return { label: "NO TARGET", tone: "muted", achievement: null };
  const achievement = cost ? (target / actual) * 100 : (actual / target) * 100;
  const met = achievement >= 100;
  return {
    achievement,
    tone: met ? "good" : "warn",
    label: met ? `ACHIEVED (${Math.round(achievement)}%)` : `NOT ACHIEVED (${Math.round(achievement)}%)`,
  };
}

// Semua angka turunan untuk satu laporan, plus perbandingan dengan bulan sebelumnya (bila ada).
export function derive(report, previous) {
  const now = core(report);
  const before = previous ? core(previous) : null;
  const socialNow = social(report);
  const socialBefore = previous ? social(previous) : null;
  const delta = (key) => (before ? growth(now[key], before[key]) : null);
  const kpi = report?.kpi || {};
  const rows = [
    { key: "leads", label: "Total Leads", actual: now.leads, target: num(kpi.leads?.target), format: fmtInt },
    { key: "registration", label: "Registration", actual: now.registration, target: num(kpi.registration?.target), format: fmtInt },
    { key: "ftd", label: "FTD", actual: now.ftd, target: num(kpi.ftd?.target), format: fmtInt },
    { key: "roas", label: "ROAS", actual: now.roas, target: num(kpi.roasTarget), format: (value) => fmtPct(value) },
    { key: "deposit", label: "Total Deposit", actual: now.deposit, target: num(kpi.deposit?.target), format: fmtRpShort },
    { key: "cpl", label: "CPL", actual: now.cpl, target: num(kpi.cplTarget), format: fmtRp, cost: true },
    { key: "cpa", label: "CPA", actual: now.cpa, target: num(kpi.cpaTarget), format: fmtRp, cost: true },
  ].map((row) => ({ ...row, status: kpiStatus(row.actual, row.target, { cost: row.cost }) }));

  return {
    ...now,
    hasPrevious: Boolean(previous),
    growth: Object.fromEntries(
      ["leads", "registration", "ftd", "deposit", "spend", "roas", "cpl", "cpa"].map((key) => [key, delta(key)])
    ),
    previous: before,
    kpiRows: rows,
    social: {
      ...socialNow,
      growth: socialBefore
        ? {
            impressions: growth(socialNow.impressions, socialBefore.impressions),
            engagement: growth(socialNow.engagement, socialBefore.engagement),
            followers: growth(socialNow.followers, socialBefore.followers),
            // Selisih engagement rate dalam poin persentase
            engagementRate:
              socialNow.engagementRate === null || socialBefore.engagementRate === null
                ? null
                : socialNow.engagementRate - socialBefore.engagementRate,
          }
        : {},
    },
    analysts: analysts(report),
  };
}

// Pemeriksaan kelengkapan: daftar data yang belum diisi (bukan error, hanya penanda).
export function validate(report, data) {
  const issues = [];
  const need = (ok, section, message) => { if (!ok) issues.push({ section, message }); };
  const on = report.sections || {};
  need(report.meta.author, "Cover", "Author name is empty");
  if (on.execSummary || on.campaign) {
    need(data.leads !== null, "KPI", "Total Leads is empty");
    need(data.registration !== null, "KPI", "Registration is empty");
    need(data.ftd !== null, "KPI", "FTD is empty");
    need(data.deposit !== null, "KPI", "Total Deposit is empty");
    need(data.spend !== null, "KPI", "Ad Spend is empty");
    need(data.kpiRows.some((row) => row.target !== null), "KPI", "No KPI target is set");
    if (data.leads !== null && data.registration !== null)
      need(data.registration <= data.leads, "KPI", "Registration is higher than Leads");
    if (data.registration !== null && data.ftd !== null)
      need(data.ftd <= data.registration, "KPI", "FTD is higher than Registration");
  }
  if (on.campaign) {
    need(data.cpm !== null, "Campaign", "Ad impressions are empty (CPM, CTR unavailable)");
    need(data.cpc !== null, "Campaign", "Ad clicks are empty (CPC, CTR unavailable)");
  }
  if (on.social) {
    need(data.social.filled.length > 0, "Social Media", "No platform has data");
    data.social.filled.forEach((platform) =>
      need(platform.images.length > 0, "Social Media", `${platform.name}: no documentation image`)
    );
  }
  if (on.production) need(num(report.production.published) !== null, "Production", "Published content count is empty");
  if (on.analyst) need(data.analysts.rows.length > 0, "Analyst", "No analyst added");
  if (on.updates) need(report.updates.length > 0, "Updates", "No department update added");
  if (on.programs) need(report.programs.length > 0, "Progress", "No program added");
  if (on.actionPlan) need(report.actionPlan.length > 0, "Action Plan", "No action item added");
  need(data.hasPrevious, "Comparison", "No report for the previous month, so growth figures are hidden");
  return issues;
}
