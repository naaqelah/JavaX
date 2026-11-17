// Master template laporan bulanan (mengikuti PDF acuan Juli 2026).
// Sampul = A4 potret; halaman lain = spread dua halaman A4. Semua isi berasal dari data laporan;
// komponen tanpa data tidak ditampilkan. Sengaja memakai kelas CSS sendiri (rp-*), bukan kelas
// Tailwind, supaya tidak terpengaruh aturan tema terang/gelap dashboard dan aman saat dicetak.
import "./report.css";
import { fmtGrowth, fmtInt, fmtPct, fmtRp, fmtRpShort, fmtShort, num } from "./calc";
import { ANALYST_METRICS, MONTHS, fmtDate, isWeekly, labelOf, parsePeriod, typeLabel } from "./store";

// Judul yang bisa disunting pengguna (report.labels); kosong = judul bawaan
const L = (report, key, fallback) => report.labels?.[key]?.trim() || fallback;

const two = (value) => String(value).padStart(2, "0");

function Ribbon({ no, label }) {
  return (
    <div className="rp-ribbon">
      <span className="rp-ribbon-no">{no}</span>
      <span className="rp-ribbon-label">{label}</span>
    </div>
  );
}
const PageNo = ({ n, right }) => <div className={`rp-pageno ${right ? "rp-right" : ""}`}>{two(n)}</div>;
const Text = ({ children, className = "" }) =>
  children ? <p className={`rp-text ${className}`}>{children}</p> : null;
const Block = ({ title, children, dark }) =>
  children ? (
    <div className="rp-block">
      <h4 className={dark ? "rp-h4" : "rp-h4 rp-h4-red"}>{title}</h4>
      <Text className={dark ? "" : "rp-text-ink"}>{children}</Text>
    </div>
  ) : null;

function Growth({ value, suffix = "", invert = false }) {
  if (value === null || value === undefined) return null;
  const good = invert ? value <= 0 : value >= 0;
  return (
    <span className={`rp-growth ${good ? "rp-up" : "rp-down"}`}>
      {value >= 0 ? "▲" : "▼"} {fmtGrowth(Math.abs(value)).replace("+", "")}{suffix}
    </span>
  );
}
function Stat({ label, value, growth, note, invert }) {
  return (
    <div className="rp-stat">
      <b>{value}</b>
      <span>{label}</span>
      <Growth value={growth} invert={invert} />
      {note && <small>{note}</small>}
    </div>
  );
}
// layout: { cols, h (tinggi foto, px), dates (tampilkan tanggal), hide (sembunyikan semua foto) }
function Gallery({ images, cols = 4, max = 8, light, layout }) {
  if (layout?.hide) return null;
  const shown = (images || []).slice(0, max);
  if (!shown.length) return null;
  const columns = Math.max(1, Math.min(Number(layout?.cols) || cols, shown.length > 1 ? 6 : 1));
  return (
    <div className="rp-gallery" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, "--rp-img-h": layout?.h ? `${layout.h}px` : undefined }}>
      {shown.map((image, index) => (
        <figure key={index} className={light ? "rp-figure rp-figure-light" : "rp-figure"}>
          <img src={image.src} alt={image.caption || ""} />
          {image.caption && <figcaption>{image.caption}</figcaption>}
          {layout?.dates && image.date && <small className="rp-figdate">{fmtDate(image.date)}</small>}
        </figure>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Cover
function Cover({ report }) {
  const weekly = isWeekly(report);
  const [first, ...rest] = report.meta.department.split(" ");
  let year; let big;
  if (weekly) {
    const a = report.range.start.split("-").map(Number);
    const b = report.range.end.split("-").map(Number);
    year = a[0] === b[0] ? a[0] : `${a[0]} – ${b[0]}`;
    const name = (m) => MONTHS[m - 1].slice(0, 3).toUpperCase();
    big = a[1] === b[1] ? `${a[2]}–${b[2]} ${name(a[1])}` : `${a[2]} ${name(a[1])} – ${b[2]} ${name(b[1])}`;
  } else {
    const parts = parsePeriod(report.period);
    year = parts.year;
    big = MONTHS[parts.month - 1].toUpperCase();
  }
  const kind = weekly ? "WEEKLY" : "MONTHLY";
  return (
    <div className="rp-page rp-cover">
      <div className="rp-cover-bar rp-cover-bar-top" />
      <div className="rp-cover-bar rp-cover-bar-bottom">
        {report.meta.coverImage && <img src={report.meta.coverImage} alt="" />}
      </div>
      <div className="rp-cover-strip" />
      <div className="rp-cover-dept">
        <b>{first.toUpperCase()}</b>
        <span>{rest.join(" ").toUpperCase()}</span>
      </div>
      <div className="rp-cover-title">
        <small>{L(report, "coverYear", String(year))}</small>
        <b className={big.length > 9 ? "rp-cover-long" : ""}>{L(report, "coverMain", big)}</b>
        <span>{L(report, "coverKind", kind)}</span>
        <b>{L(report, "coverWord", "REPORT")}</b>
      </div>
      <div className="rp-cover-logo">{report.meta.company}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Title + TOC
function TitlePage({ report, no }) {
  return (
    <div className="rp-page rp-dark">
      {report.meta.authorPhoto && <img className="rp-title-photo" src={report.meta.authorPhoto} alt="" />}
      <div className="rp-title-box">
        <span className="rp-serif rp-title-small">{report.meta.department}&rsquo;s</span>
        <b className="rp-serif rp-title-big">{L(report, "titleMain", typeLabel(report))}</b>
        <small>{L(report, "subtitle", isWeekly(report)
          ? `Weekly Performance Recap & Next Week Plan, ${labelOf(report)}`
          : `Monthly Performance Recap & Strategic Plan, ${labelOf(report)}`)}</small>
        {report.meta.author && (
          <div className="rp-title-by">
            <em>BY</em>
            <b className="rp-serif">{report.meta.author}</b>
            <span>{report.meta.authorTitle}</span>
          </div>
        )}
      </div>
      <div className="rp-band" />
      <PageNo n={no} />
    </div>
  );
}
function TocPage({ entries, no }) {
  const groups = [];
  entries.forEach((entry) => {
    const last = groups[groups.length - 1];
    if (last && last.name === entry.group) last.items.push(entry);
    else groups.push({ name: entry.group, items: [entry] });
  });
  return (
    <div className="rp-page rp-dark">
      <div className="rp-toc-card">
        <span className="rp-serif rp-toc-small">Table of</span>
        <b className="rp-serif rp-toc-big">Content</b>
        {groups.map((group) => (
          <div key={group.name} className="rp-toc-group">
            <b>{group.name}</b>
            <i />
            <ul>
              {group.items.map((item) => (
                <li key={`${item.no}-${item.title}`}><span>{two(item.no)}</span>{item.title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rp-band" />
      <PageNo n={no} right />
    </div>
  );
}

// ---------------------------------------------------------------- Executive Summary
function ExecLeft({ report, data, texts, no }) {
  const tiles = [
    ["TOTAL LEADS", data.leads === null ? null : fmtInt(data.leads)],
    ["REGISTRATION", data.registration === null ? null : fmtInt(data.registration)],
    ["FIRST TIME DEPOSIT", data.ftd === null ? null : fmtInt(data.ftd)],
    ["TOTAL DEPOSIT", data.deposit === null ? null : fmtShort(data.deposit)],
    ["ROAS", data.roas === null ? null : fmtPct(data.roas)],
    ["TOTAL FOLLOWERS (ALL PLATFORM)", data.social.followers === null ? null : fmtShort(data.social.followers)],
    ["TOTAL VIEWS (ALL PLATFORM)", data.social.views === null ? null : fmtShort(data.social.views)],
    ["SIGNAL TRADING", data.analysts.totals.signal === null ? null : fmtInt(data.analysts.totals.signal)],
  ].filter(([, value]) => value !== null);
  return (
    <div className="rp-page rp-red">
      <Ribbon no="01" label="INTRODUCTION" />
      <h1 className="rp-serif rp-h1">{L(report, "execTitle", isWeekly(report) ? "Weekly\nSummary" : "Executive\nSummary")} <small>{labelOf(report).toUpperCase()}</small></h1>
      <div className="rp-tiles">
        {tiles.map(([label, value]) => (
          <div key={label} className="rp-tile"><b>{value}</b><span>{label}</span></div>
        ))}
      </div>
      <Text className="rp-exec-text">{texts.execSummary}</Text>
      <PageNo n={no} />
    </div>
  );
}
function ExecRight({ report, data, texts, no }) {
  const bars = data.kpiRows.filter((row) => !row.cost && row.status.achievement !== null);
  const top = Math.max(120, ...bars.map((row) => row.status.achievement)) * 1.1;
  return (
    <div className="rp-page rp-red">
      {bars.length > 0 && (
        <>
          <h3 className="rp-h3 rp-center">{L(report, "kpiChartTitle", `KEY MARKETING KPI ACHIEVEMENT – ${labelOf(report).toUpperCase()}`)}</h3>
          <div className="rp-bars">
            <div className="rp-bars-target" style={{ bottom: `${(100 / top) * 100}%` }}><span>Target 100%</span></div>
            {bars.map((row) => (
              <div key={row.key} className="rp-bar-col">
                <em>{Math.round(row.status.achievement)}%</em>
                <i style={{ height: `${(row.status.achievement / top) * 100}%` }} />
                <span>{row.label.replace("Total ", "")}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <table className="rp-table rp-kpi-table">
        <thead><tr><th>KPI</th><th>TARGET</th><th>RESULT</th><th>STATUS</th></tr></thead>
        <tbody>
          {data.kpiRows.map((row) => (
            <tr key={row.key}>
              <th>{row.label}</th>
              <td>{row.target === null ? "—" : `${row.cost ? "≤ " : "≥ "}${row.format(row.target)}`}</td>
              <td><b>{row.format(row.actual)}</b></td>
              <td className={`rp-status rp-${row.status.tone}`}>{row.status.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {texts.strategicNotes && (
        <div className="rp-block">
          <h3 className="rp-h3">{L(report, "strategicTitle", "STRATEGIC NOTES")}</h3>
          <Text>{texts.strategicNotes}</Text>
        </div>
      )}
      <PageNo n={no} right />
    </div>
  );
}

// ---------------------------------------------------------------- Department update (satu spread)
function UpdateSpread({ report, update, no, layout }) {
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="01" label="INTRODUCTION" />
      <h1 className="rp-serif rp-h1">{L(report, "updatePrefix", "Update:")}<br />{update.title}</h1>
      <div className="rp-update-cols">
        <div>
          <Block dark title="STATUS">{update.status}</Block>
          <Block dark title="INSIGHT">{update.insight}</Block>
        </div>
        <div><Block dark title="NEXT ACTION">{update.nextAction}</Block></div>
      </div>
      <Gallery images={update.images} cols={4} max={8} light layout={layout} />
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Social media
const DONUT_COLORS = ["#A61E22", "#D9473F", "#F0A59B", "#7A1018", "#C9C9C9", "#5E5E5E", "#E8D5D2"];
function Donut({ platforms, rate }) {
  const items = platforms.filter((platform) => platform.n.engagement);
  const total = items.reduce((sum, platform) => sum + platform.n.engagement, 0);
  if (!total) return null;
  let offset = 0;
  return (
    <div className="rp-donut">
      <svg viewBox="0 0 42 42">
        {items.map((platform, index) => {
          const share = (platform.n.engagement / total) * 100;
          const circle = (
            <circle key={platform.key} cx="21" cy="21" r="15.915" fill="none" strokeWidth="7"
              stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
              strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={25 - offset} />
          );
          offset += share;
          return circle;
        })}
      </svg>
      <div className="rp-donut-center">
        {rate === null ? <span>ENGAGEMENT SHARE</span> : <><b>{fmtPct(rate, 1)}</b><span>ENGAGEMENT RATE</span></>}
      </div>
      <ul>
        {items.map((platform, index) => (
          <li key={platform.key}><i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />{platform.name}</li>
        ))}
      </ul>
    </div>
  );
}
function SocialOverview({ report, data, texts, no }) {
  const social = data.social;
  const ads = social.filled.filter((platform) => platform.n.adCost !== null);
  const rateShift = social.growth.engagementRate;
  // Hanya angka yang tersedia yang ditampilkan
  const stats = [
    social.impressions !== null && { label: "TOTAL IMPRESSION", value: fmtInt(social.impressions), growth: social.growth.impressions },
    social.engagement !== null && { label: "TOTAL ENGAGEMENT", value: fmtInt(social.engagement), growth: social.growth.engagement },
    social.followers !== null && { label: "TOTAL FOLLOWERS", value: fmtInt(social.followers), growth: social.growth.followers },
    social.views !== null && { label: "TOTAL VIEWS", value: fmtInt(social.views) },
    social.engagementRate !== null && {
      label: "ENGAGEMENT RATE", value: fmtPct(social.engagementRate, 1),
      note: rateShift == null ? null : `${rateShift >= 0 ? "▲" : "▼"} ${Math.abs(rateShift).toLocaleString("id-ID", { maximumFractionDigits: 1 })} pt`,
    },
  ].filter(Boolean);
  return (
    <div className="rp-page rp-dark">
      <Ribbon no="02" label="COMMUNITY AND CONTENT" />
      <h1 className="rp-serif rp-h1">{L(report, "socialTitle", "Social Media\nOverview")}</h1>
      <Donut platforms={social.filled} rate={social.engagementRate} />
      <div className="rp-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
        {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
      </div>
      <Text>{texts.socialNote}</Text>
      {ads.length > 0 && (
        <div className="rp-ads">
          <h3 className="rp-h3">AWARENESS ADS REPORT</h3>
          <table className="rp-table">
            <thead><tr><th />{ads.map((platform) => <th key={platform.key}>{platform.name}<small>{platform.handle}</small></th>)}</tr></thead>
            <tbody>
              <tr><th>Ad Cost</th>{ads.map((platform) => <td key={platform.key}><b>{fmtRp(platform.n.adCost)}</b></td>)}</tr>
              <tr><th>New Followers</th>{ads.map((platform) => <td key={platform.key}><b>{fmtShort(platform.n.newFollowers)}</b></td>)}</tr>
              <tr><th>Views</th>{ads.map((platform) => <td key={platform.key}><b>{fmtShort(platform.n.views)}</b></td>)}</tr>
              <tr><th>Total Engagement</th>{ads.map((platform) => <td key={platform.key}><b>{fmtInt(platform.n.engagement)}</b></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <PageNo n={no} />
    </div>
  );
}
function PlatformPage({ platform, no, right, layout }) {
  const [header, ...others] = platform.images || [];
  return (
    <div className="rp-page rp-dark">
      {!right && <Ribbon no="02" label="COMMUNITY AND CONTENT" />}
      {right && <div className="rp-vband" />}
      <div className="rp-card rp-platform">
        {header && <img className="rp-platform-header" src={header.src} alt="" />}
        <div className="rp-platform-stats">
          <div><b className="rp-red-text">{platform.name.toUpperCase()}</b><span>{platform.handle}</span></div>
          {platform.n.followers !== null && <div><b>{fmtShort(platform.n.followers)}</b><span>FOLLOWERS</span></div>}
          {platform.n.views !== null && <div><b>{fmtShort(platform.n.views)}</b><span>VIEWS</span></div>}
          {platform.n.engagement !== null && <div><b>{fmtShort(platform.n.engagement)}</b><span>ENGAGEMENT</span></div>}
        </div>
        {platform.n.posts !== null && (
          <p className="rp-posts"><b>{fmtInt(platform.n.posts)}</b> Posts{platform.postBreakdown && <small>{platform.postBreakdown}</small>}</p>
        )}
        <Block title="INSIGHTS">{platform.insights}</Block>
        <Block title="NEXT PLAN">{platform.nextPlan}</Block>
        <Gallery images={others} cols={Math.min(3, Math.max(1, others.length))} max={3} layout={layout} />
      </div>
      <PageNo n={no} right={right} />
    </div>
  );
}
function FillerPage({ no, right }) {
  return <div className="rp-page rp-dark"><div className="rp-vband" /><PageNo n={no} right={right} /></div>;
}

// ---------------------------------------------------------------- Content production (spread)
function ProductionSpread({ report, data, no, layout }) {
  const production = report.production;
  const tiles = [
    ["CONTENT PRODUCED", production.produced], ["CONTENT PUBLISHED", production.published],
    ["VIDEO", production.video], ["DESIGN", production.design],
    ["LIVE STREAMING", production.live], ["WEBINAR", production.webinar],
  ].filter(([, value]) => num(value) !== null);
  const byPlatform = data.social.filled.filter((platform) => platform.n.posts);
  const max = Math.max(1, ...byPlatform.map((platform) => platform.n.posts));
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="03" label="CREATIVE PRODUCTION" />
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{L(report, "productionTitle", "Content Production\n& Publishing")}</h1>
        <div className="rp-tiles rp-tiles-3">
          {tiles.map(([label, value]) => <div key={label} className="rp-tile"><b>{fmtInt(num(value))}</b><span>{label}</span></div>)}
        </div>
        {byPlatform.length > 0 && (
          <div className="rp-hbars">
            <h3 className="rp-h3">PUBLISHED BY PLATFORM</h3>
            {byPlatform.map((platform) => (
              <div key={platform.key} className="rp-hbar">
                <span>{platform.name}</span>
                <i><b style={{ width: `${(platform.n.posts / max) * 100}%` }} /></i>
                <em>{fmtInt(platform.n.posts)}</em>
              </div>
            ))}
          </div>
        )}
        <Block dark title="INSIGHTS">{production.insights}</Block>
        <Block dark title="NEXT PLAN">{production.nextPlan}</Block>
      </div>
      {production.images.length > 0 && (
        <div className="rp-panel-red">
          <div className="rp-vtitle">CONTENT HIGHLIGHTS</div>
          <Gallery images={production.images} cols={2} max={6} light layout={layout} />
        </div>
      )}
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Campaign (spread)
function CampaignSpread({ report, data, texts, no }) {
  const g = data.growth;
  const channels = (report.channels || []).filter((channel) => channel.name);
  const stats = [
    data.spend !== null && { label: "TOTAL SPEND", value: fmtRpShort(data.spend), growth: g.spend, invert: true },
    data.leads !== null && { label: "LEADS", value: fmtInt(data.leads), growth: g.leads },
    data.registration !== null && { label: "REGISTRATION", value: fmtInt(data.registration), growth: g.registration },
    data.ftd !== null && { label: "FTD", value: fmtInt(data.ftd), growth: g.ftd },
    data.deposit !== null && { label: "TOTAL DEPOSIT", value: fmtRpShort(data.deposit), growth: g.deposit },
  ].filter(Boolean);
  const metrics = [
    ["CPM", data.cpm, fmtRp], ["CPC", data.cpc, fmtRp], ["CTR", data.ctr, (value) => fmtPct(value, 2)],
    ["CPL", data.cpl, fmtRp], ["CPR", data.cpr, fmtRp], ["CPA", data.cpa, fmtRp], ["Rev. / FTD", data.revPerFtd, fmtRp],
  ].filter(([, value]) => value !== null);
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="04" label="PERFORMANCE MARKETING" />
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{L(report, "campaignTitle", "Campaign\nPerformance")}</h1>
        <div className="rp-stats" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
        </div>
        <Text>{texts.campaignSummary}</Text>
        {data.roas !== null && (
          <div className="rp-roas"><b>{fmtPct(data.roas)}</b><span>RETURN ON ADS SPEND<Growth value={g.roas} /></span></div>
        )}
      </div>
      <div className="rp-half">
        <div className="rp-two">
          {data.leads !== null && (
            <div>
              <h3 className="rp-h3 rp-center">CONVERSION FUNNEL</h3>
              <div className="rp-funnel">
                <div className="rp-funnel-step rp-f1"><b>{fmtInt(data.leads)}</b><span>LEADS</span></div>
                {data.leadToReg !== null && <div className="rp-funnel-rate"><b>{fmtPct(data.leadToReg, 1)}</b><span>Leads to Registration</span></div>}
                {data.registration !== null && <div className="rp-funnel-step rp-f2"><b>{fmtInt(data.registration)}</b><span>REGISTRATION</span></div>}
                {data.regToFtd !== null && <div className="rp-funnel-rate"><b>{fmtPct(data.regToFtd, 1)}</b><span>Registration to FTD</span></div>}
                {data.ftd !== null && <div className="rp-funnel-step rp-f3"><b>{fmtInt(data.ftd)}</b><span>FTD</span></div>}
              </div>
            </div>
          )}
          {metrics.length > 0 && (
            <div>
              <h3 className="rp-h3 rp-center">KEY METRICS</h3>
              <table className="rp-table"><tbody>
                {metrics.map(([label, value, format]) => <tr key={label}><th>{label}</th><td><b>{format(value)}</b></td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>
        {channels.length > 0 && (
          <div className="rp-block">
            <h3 className="rp-h3">CHANNEL BREAKDOWN</h3>
            <table className="rp-table rp-channels"><tbody>
              {channels.map((channel, index) => (
                <tr key={index}>
                  <th>{channel.name}</th>
                  <td className="rp-stars">{"★".repeat(Number(channel.rating || 0))}{"☆".repeat(5 - Number(channel.rating || 0))}</td>
                  <td className="rp-note">{channel.note}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
        <Block dark title="INSIGHTS">{texts.campaignInsights}</Block>
        <Block dark title="NEXT PLAN">{texts.campaignNextPlan}</Block>
      </div>
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Analyst (spread)
function AnalystSpread({ report, data, texts, no }) {
  const { rows, totals, scorecard } = data.analysts;
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="05" label="MARKET RESEARCH & TRADING INTELLIGENCE" />
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{L(report, "analystTitle", "Analyst\nPerformance")}</h1>
        <table className="rp-table rp-analyst">
          <thead><tr><th>Analyst</th>{ANALYST_METRICS.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}><th>{row.name}</th>{ANALYST_METRICS.map(([key]) => <td key={key}>{num(row[key]) === null ? "—" : fmtInt(num(row[key]))}</td>)}</tr>
            ))}
            <tr className="rp-total"><th>Total</th>{ANALYST_METRICS.map(([key]) => <td key={key}><b>{totals[key] === null ? "—" : fmtInt(totals[key])}</b></td>)}</tr>
          </tbody>
        </table>
      </div>
      <div className="rp-half">
        <h3 className="rp-h3">ANALYST KPI SCORECARD</h3>
        <table className="rp-table rp-kpi-table">
          <thead><tr><th>KPI</th><th>TARGET</th><th>ACTUAL</th><th>STATUS</th></tr></thead>
          <tbody>
            {scorecard.map((row) => (
              <tr key={row.key}>
                <th>{row.label}</th>
                <td>{row.target === null ? "—" : fmtInt(row.target)}</td>
                <td><b>{row.actual === null ? "—" : fmtInt(row.actual)}</b></td>
                <td className={`rp-status rp-${row.achievement === null ? "muted" : row.achievement >= 100 ? "good" : "warn"}`}>
                  {row.achievement === null ? "NO TARGET" : `${row.achievement >= 100 ? "ACHIEVED" : "NOT ACHIEVED"} (${Math.round(row.achievement)}%)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Block dark title="INSIGHTS">{texts.analystInsights}</Block>
        <Block dark title="RECOMMENDATIONS">{texts.analystPlan}</Block>
      </div>
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Program (spread)
function ProgramSpread({ program, no, layout }) {
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="06" label="PROGRESS AND PLANNING" />
      <div className="rp-half rp-program-left">
        <div className="rp-card rp-program">
          <div className="rp-program-head"><b>{program.title.toUpperCase()}</b><span>{program.subtitle}</span></div>
          <div className="rp-program-body">
            <Block title="CURRENT STATUS">{program.status}</Block>
            <Block title="NEXT PLAN">{program.nextPlan}</Block>
            <Block title="NOTES">{program.notes}</Block>
          </div>
        </div>
      </div>
      {program.images.length > 0 && (
        <div className="rp-panel-red">
          <div className="rp-vtitle">HIGHLIGHTS</div>
          <Gallery images={program.images} cols={2} max={6} light layout={layout} />
        </div>
      )}
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Action plan + Outro
function ActionPlanPage({ report, no }) {
  return (
    <div className="rp-page rp-dark">
      <Ribbon no="06" label="PROGRESS AND PLANNING" />
      <h1 className="rp-serif rp-h1">{L(report, "actionTitle", "Action\nPlan")}</h1>
      <table className="rp-table rp-action">
        <thead><tr><th>PRIORITY</th><th>ACTION</th><th>OWNER</th><th>TARGET</th></tr></thead>
        <tbody>
          {report.actionPlan.map((item, index) => (
            <tr key={index}><th>{item.priority || index + 1}</th><td className="rp-note">{item.action}</td><td>{item.owner || "—"}</td><td>{item.target || "—"}</td></tr>
          ))}
        </tbody>
      </table>
      <PageNo n={no} />
    </div>
  );
}
function OutroPage({ report, texts, no, right }) {
  return (
    <div className="rp-page rp-red rp-outro">
      <b className="rp-serif rp-outro-title">{L(report, "outroTitle", "Thank You")}</b>
      <Text>{texts.outro}</Text>
      {report.meta.author && (
        <div className="rp-outro-by"><b className="rp-serif">{report.meta.author}</b><span>{report.meta.authorTitle}</span></div>
      )}
      <div className="rp-cover-logo">{report.meta.company}</div>
      <PageNo n={no} right={right} />
    </div>
  );
}

// ---------------------------------------------------------------- Weekly: aktivitas
function ActivitiesPage({ report, no }) {
  return (
    <div className="rp-page rp-dark">
      <Ribbon no="01" label="WEEKLY REPORT" />
      <h1 className="rp-serif rp-h1">{L(report, "activitiesTitle", "Weekly\nActivities")}</h1>
      <table className="rp-table rp-action">
        <thead><tr><th>DATE</th><th>ACTIVITY</th><th>STATUS</th><th>PIC</th></tr></thead>
        <tbody>
          {report.activities.filter((item) => item.activity).map((item, index) => (
            <tr key={index}>
              <th>{item.date ? fmtDate(item.date) : "—"}</th>
              <td className="rp-note">{item.activity}</td>
              <td>{item.status || "—"}</td>
              <td>{item.pic || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PageNo n={no} />
    </div>
  );
}

// ---------------------------------------------------------------- Weekly: evaluasi dan rencana minggu depan
function EvaluationSpread({ report, data, texts, no }) {
  const missed = data.kpiRows.filter((row) => row.status.tone === "warn");
  const plan = report.actionPlan.filter((item) => item.action);
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="05" label="EVALUATION & PLAN" />
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{L(report, "evaluationTitle", "Weekly\nEvaluation")}</h1>
        <Text>{texts.evaluation}</Text>
        {missed.length > 0 && (
          <div className="rp-block">
            <h3 className="rp-h3">NOT ACHIEVED</h3>
            <table className="rp-table rp-kpi-table"><tbody>
              {missed.map((row) => (
                <tr key={row.key}><th>{row.label}</th><td><b>{row.format(row.actual)}</b></td><td className="rp-status rp-warn">{row.status.label}</td></tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{L(report, "nextWeekTitle", "Next Week\nPlan")}</h1>
        <Text>{texts.nextWeek}</Text>
        {plan.length > 0 && (
          <table className="rp-table rp-action">
            <thead><tr><th>PRIORITY</th><th>ACTION</th><th>OWNER</th><th>TARGET</th></tr></thead>
            <tbody>
              {plan.map((item, index) => (
                <tr key={index}><th>{item.priority || index + 1}</th><td className="rp-note">{item.action}</td><td>{item.owner || "—"}</td><td>{item.target || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// ---------------------------------------------------------------- Bagian bebas buatan pengguna
function CustomPage({ section, no, layout }) {
  return (
    <div className="rp-page rp-dark">
      <Ribbon no="--" label={section.ribbon || "REPORT"} />
      <h1 className="rp-serif rp-h1">{section.title}</h1>
      <Text>{section.body}</Text>
      <Gallery images={section.images} cols={3} max={6} light layout={layout} />
      <PageNo n={no} />
    </div>
  );
}
function CustomSpread({ section, no, layout }) {
  return (
    <div className="rp-wide rp-dark">
      <Ribbon no="--" label={section.ribbon || "REPORT"} />
      <div className="rp-half">
        <h1 className="rp-serif rp-h1">{section.title}</h1>
        <Text>{section.body}</Text>
      </div>
      <div className="rp-panel-red">
        <Gallery images={section.images} cols={2} max={6} light layout={layout} />
      </div>
      <PageNo n={no} />
      <PageNo n={no + 1} right />
    </div>
  );
}

// Menyusun daftar halaman (setengah spread) dari urutan bagian (report.order), bagian yang tampil,
// dan data yang ada; lalu menghitung nomor halaman dan daftar isi.
export function buildSheets(report, data, texts) {
  const on = report.sections || {};
  const weekly = isWeekly(report);
  const items = []; // { span: 1 | 2, render(no, right), toc?: [group, title] }
  const add = (span, render, toc) => items.push({ span, render, toc });
  const align = () => {
    const used = items.reduce((total, item) => total + item.span, 0);
    if (used % 2) add(1, (no, right) => <FillerPage no={no} right={right} />);
  };
  const layoutOf = (id) => report.layout?.[id];

  const builders = {
    execSummary() {
      add(1, (no) => <ExecLeft report={report} data={data} texts={texts} no={no} />, ["Introduction", weekly ? "Weekly Summary" : "Executive Summary"]);
      add(1, (no) => <ExecRight report={report} data={data} texts={texts} no={no} />, ["Introduction", weekly ? "Weekly KPI Scorecard" : "Monthly KPI Scorecard"]);
    },
    updates() {
      report.updates.filter((update) => update.title).forEach((update) =>
        add(2, (no) => <UpdateSpread report={report} update={update} no={no} layout={layoutOf("updates")} />, ["Introduction", `Update: ${update.title}`]));
    },
    activities() {
      if (!report.activities.some((item) => item.activity)) return;
      add(1, (no) => <ActivitiesPage report={report} no={no} />, ["Introduction", "Weekly Activities"]);
    },
    social() {
      if (!data.social.filled.length) return;
      add(1, (no) => <SocialOverview report={report} data={data} texts={texts} no={no} />, ["Community & Content", "Social Media Performance"]);
      data.social.filled.forEach((platform) =>
        add(1, (no, right) => <PlatformPage platform={platform} no={no} right={right} layout={layoutOf("social")} />,
          ["Community & Content", `${platform.name}${platform.handle ? ` - ${platform.handle}` : ""}`]));
    },
    production() {
      if (num(report.production.published) === null && num(report.production.produced) === null) return;
      align();
      add(2, (no) => <ProductionSpread report={report} data={data} no={no} layout={layoutOf("production")} />, ["Creative Production", "Content Production & Publishing"]);
    },
    campaign() {
      if (data.spend === null) return;
      align();
      add(2, (no) => <CampaignSpread report={report} data={data} texts={texts} no={no} />, ["Performance Marketing", "Campaign Performance"]);
    },
    analyst() {
      if (!data.analysts.rows.length) return;
      align();
      add(2, (no) => <AnalystSpread report={report} data={data} texts={texts} no={no} />, ["Market Research & Trading Intelligence", "Analyst Performance"]);
    },
    programs() {
      report.programs.filter((program) => program.title).forEach((program) => {
        align();
        add(2, (no) => <ProgramSpread program={program} no={no} layout={layoutOf("programs")} />, ["Progress & Planning", program.title]);
      });
    },
    evaluation() {
      if (!texts.evaluation && !texts.nextWeek && !report.actionPlan.some((item) => item.action)) return;
      align();
      add(2, (no) => <EvaluationSpread report={report} data={data} texts={texts} no={no} />, ["Progress & Planning", "Evaluation & Next Week Plan"]);
    },
    actionPlan() {
      if (!report.actionPlan.some((item) => item.action)) return;
      align();
      add(1, (no) => <ActionPlanPage report={report} no={no} />, ["Progress & Planning", "Action Plan"]);
    },
    outro() {
      align();
      add(1, (no, right) => <OutroPage report={report} texts={texts} no={no} right={right} />, ["Progress & Planning", "Outro"]);
    },
  };

  (report.order || []).forEach((id) => {
    if (on[id] === false) return;
    if (id.startsWith("custom:")) {
      const section = (report.custom || []).find((item) => item.id === id);
      if (!section || !section.title) return;
      const layout = layoutOf(id);
      if (section.images?.length && !layout?.hide) {
        align();
        add(2, (no) => <CustomSpread section={section} no={no} layout={layout} />, [section.group || "Additional", section.title]);
      } else {
        add(1, (no) => <CustomPage section={section} no={no} layout={layout} />, [section.group || "Additional", section.title]);
      }
      return;
    }
    builders[id]?.();
  });
  align();

  // Nomor halaman: sampul = 1, halaman judul = 2, daftar isi = 3, isi mulai dari 4
  let no = 4;
  const numbered = items.map((item) => {
    const entry = { ...item, no };
    no += item.span;
    return entry;
  });
  const toc = [{ group: "Introduction", title: "Table of Content", no: 3 }, ...numbered.filter((item) => item.toc).map((item) => ({ group: item.toc[0], title: item.toc[1], no: item.no }))];

  const sheets = [
    { key: "cover", kind: "cover", node: <Cover report={report} /> },
    { key: "front", kind: "spread", node: <><TitlePage report={report} no={2} /><TocPage entries={toc} no={3} /></> },
  ];
  for (let index = 0; index < numbered.length; index += 1) {
    const item = numbered[index];
    if (item.span === 2) sheets.push({ key: `s${item.no}`, kind: "spread", node: item.render(item.no) });
    else {
      const next = numbered[index + 1];
      sheets.push({ key: `s${item.no}`, kind: "spread", node: <>{item.render(item.no, false)}{next ? next.render(next.no, true) : null}</> });
      index += 1;
    }
  }
  return { sheets, pageCount: no - 1 };
}

export default function ReportDocument({ sheets }) {
  return (
    <div className="rp-doc">
      {sheets.map((sheet) => (
        <div key={sheet.key} className={`rp-sheet rp-sheet-${sheet.kind}`}>{sheet.node}</div>
      ))}
    </div>
  );
}
