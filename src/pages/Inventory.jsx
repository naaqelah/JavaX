import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import GlassSelect from "../components/ui/GlassSelect";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Coins,
  FileText,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

// Desain token sama dengan halaman lain (Overview, Projects, ProjectDetail, dst.)
const GLASS =
  "rounded-[28px] border border-white/[0.18] bg-gradient-to-b from-white/[0.16] via-white/[0.06] to-white/[0.03] backdrop-blur-2xl backdrop-saturate-[200%] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.85),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.06)]";
const INNER = "rounded-2xl border border-white/[0.10] bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
const TILE =
  "rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 hover:border-white/20";
const PILL =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white px-3.5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 focus:border-[#B82323]/60 [color-scheme:dark]";
const LABEL = "mb-1.5 block text-[12px] font-medium text-white/85";

const initialMerchandise = [
  { name: "Light bulb", category: "Electrical", on_hand: 24, minimum: 5, unit_cost: 25000, status: "normal" },
  { name: "Cable", category: "Electrical", on_hand: 15, minimum: 5, unit_cost: 8000, status: "normal" },
  { name: "Switch", category: "Electrical", on_hand: 12, minimum: 3, unit_cost: 15000, status: "normal" },
  { name: "Fuse", category: "Electrical", on_hand: 30, minimum: 10, unit_cost: 5000, status: "normal" },
];

const initialEquipment = [
  { name: "Light bulb", category: "Electrical", on_hand: 24, unit_cost: 0, stock_value: 600000 },
  { name: "Cable", category: "Electrical", on_hand: 15, unit_cost: 0, stock_value: 120000 },
  { name: "Switch", category: "Electrical", on_hand: 12, unit_cost: 0, stock_value: 180000 },
  { name: "Fuse", category: "Electrical", on_hand: 30, unit_cost: 0, stock_value: 150000 },
];

const initialLogs = [
  {
    id: 1,
    type: "out",
    item: "Tumbler",
    item_type: "Merchandise",
    delta: -10,
    balance: 90,
    note: "Giveaway",
    by: "Reinhart",
    by_at: "2 Nov 2026, 20:54",
    date: "2 Nov 2026",
    time: "20:54",
  },
  {
    id: 2,
    type: "out",
    item: "Notebook",
    item_type: "Merchandise",
    delta: -10,
    balance: 90,
    note: "Giveaway",
    by: "Reinhart",
    by_at: "2 Nov 2026, 20:54",
    date: "1 Nov 2026",
    time: "16:30",
  },
  {
    id: 3,
    type: "out",
    item: "Notebook",
    item_type: "Merchandise",
    delta: -10,
    balance: 90,
    note: "Seminar Kit",
    by: "Andi Pratama",
    by_at: "1 Nov 2026, 14:15",
    date: "1 Nov 2026",
    time: "14:15",
  },
  {
    id: 4,
    type: "out",
    item: "Mug",
    item_type: "Merchandise",
    delta: -10,
    balance: 90,
    note: "Giveaway",
    by: "Reinhart",
    by_at: "2 Nov 2026, 20:54",
    date: "1 Oct 2026",
    time: "16:30",
  },
];

const formatRupiah = (value) =>
  "Rp " + Number(value || 0).toLocaleString("id-ID");

const MERCH_COLS =
  "grid-cols-[minmax(150px,1.4fr)_minmax(100px,1fr)_90px_90px_120px_130px_120px_110px]";
const EQUIP_COLS =
  "grid-cols-[minmax(150px,1.6fr)_minmax(100px,1fr)_90px_120px_140px_110px]";
const LOG_COLS =
  "grid-cols-[110px_minmax(150px,1.3fr)_130px_minmax(110px,1fr)_minmax(170px,1.6fr)_110px_36px]";

function SectionTitle({ children }) {
  return (
    <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-white">
      {children}
    </h2>
  );
}

function StockCard({ icon: Icon, label, value }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 p-3.5 ${TILE}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#A21E1E]/30 to-white/[0.04] text-white">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-white/55">{label}</p>
        <p className="truncate text-lg font-semibold leading-tight tracking-tight tabular-nums text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function StockStatus({ status }) {
  const isLow = status === "low";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${
        isLow
          ? "bg-[#A21E1E]/15 text-[#E04848] ring-[#B82323]/30"
          : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isLow ? "Low stock" : "Normal"}
    </span>
  );
}

function AdjustButton({ item, onAdjust }) {
  return (
    <button
      type="button"
      onClick={() => onAdjust(item)}
      className={`${PILL} max-md:h-9 max-md:w-full max-md:justify-center`}
    >
      <Pencil size={12} />
      Adjust
    </button>
  );
}

function MerchandiseSection({ items, onAdjust }) {
  return (
    <section className="mb-6">
      <SectionTitle>Merchandise</SectionTitle>

      <div className="overflow-x-auto rounded-2xl max-md:overflow-visible">
        <div className={`min-w-[900px] overflow-hidden rounded-2xl ${GLASS} backdrop-blur-none max-md:min-w-0 max-md:overflow-visible max-md:border-0 max-md:bg-none max-md:bg-transparent max-md:shadow-none max-md:backdrop-blur-none`}>
          <div className={`grid ${MERCH_COLS} items-center gap-2.5 border-b border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55 max-md:hidden`}>
            {[
              "Item",
              "Category",
              "On hand",
              "Minimum",
              "Unit cost",
              "Valuation",
              "Status",
              "Adjust",
            ].map((heading) => (
              <div key={heading} className={["Status", "Adjust"].includes(heading) ? "text-center" : ""}>
                {heading}
              </div>
            ))}
          </div>

          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`grid min-h-[52px] ${MERCH_COLS} items-center gap-2.5 border-b border-white/[0.06] px-4 py-2 text-[13px] text-white/90 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.035] max-md:mb-3 max-md:min-h-0 max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:rounded-2xl max-md:border max-md:border-white/[0.18] max-md:bg-gradient-to-b max-md:from-white/[0.14] max-md:to-white/[0.04] max-md:backdrop-blur-2xl max-md:backdrop-saturate-[200%] max-md:p-4 max-md:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.3)]`}
            >
              <div className="font-semibold text-white max-md:col-start-1 max-md:row-start-1 max-md:text-[15px]">{item.name}</div>
              <div className="text-white/55 max-md:col-span-2 max-md:-mt-1 max-md:text-[12px]">
                {item.category}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['On_hand']">
                {item.on_hand}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['Minimum']">
                {item.minimum}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['Unit_cost']">
                {formatRupiah(item.unit_cost)}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['Valuation']">
                {formatRupiah(item.on_hand * item.unit_cost)}
              </div>
              <div className="text-center max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end">
                <StockStatus status={item.status} />
              </div>
              <div className="text-center max-md:col-span-2 max-md:mt-1 max-md:border-t max-md:border-white/[0.07] max-md:pt-3">
                <AdjustButton item={item} onAdjust={onAdjust} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EquipmentSection({ items, onAdjust }) {
  return (
    <section className="mb-6">
      <SectionTitle>Equipment</SectionTitle>

      <div className="overflow-x-auto max-md:overflow-visible">
        <div className={`min-w-[760px] overflow-hidden ${GLASS} backdrop-blur-none max-md:min-w-0 max-md:overflow-visible max-md:border-0 max-md:bg-none max-md:bg-transparent max-md:shadow-none max-md:backdrop-blur-none`}>
          <div className={`grid ${EQUIP_COLS} items-center gap-2.5 border-b border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55 max-md:hidden`}>
            {["Item", "Category", "On hand", "Unit cost", "Stock value", "Adjust"].map((heading) => (
              <div key={heading} className={heading === "Adjust" ? "text-center" : ""}>
                {heading}
              </div>
            ))}
          </div>

          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`grid min-h-[52px] ${EQUIP_COLS} items-center gap-2.5 border-b border-white/[0.06] px-4 py-2 text-[13px] text-white/90 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.035] max-md:mb-3 max-md:min-h-0 max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:rounded-2xl max-md:border max-md:border-white/[0.18] max-md:bg-gradient-to-b max-md:from-white/[0.14] max-md:to-white/[0.04] max-md:backdrop-blur-2xl max-md:backdrop-saturate-[200%] max-md:p-4 max-md:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.3)]`}
            >
              <div className="font-semibold text-white max-md:col-span-2 max-md:text-[15px]">
                {item.name}
              </div>
              <div className="text-white/55 max-md:col-span-2 max-md:-mt-1 max-md:text-[12px]">
                {item.category}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['On_hand']">
                {item.on_hand}
              </div>
              <div className="tabular-nums max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['Unit_cost']">
                {formatRupiah(item.unit_cost)}
              </div>
              <div className="tabular-nums max-md:col-span-2 max-md:before:mb-1 max-md:before:block max-md:before:text-[10px] max-md:before:uppercase max-md:before:text-white/45 max-md:before:content-['Stock_value']">
                {formatRupiah(item.stock_value)}
              </div>
              <div className="text-center max-md:col-span-2 max-md:mt-1 max-md:border-t max-md:border-white/[0.07] max-md:pt-3">
                <AdjustButton item={item} onAdjust={onAdjust} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogType({ type }) {
  const isIn = type === "in";

  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10px] font-semibold tracking-wider ring-1 ${
        isIn
          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
          : "bg-[#A21E1E]/15 text-[#E04848] ring-[#B82323]/30"
      }`}
    >
      {isIn ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {type.toUpperCase()}
    </span>
  );
}

// Detail satu catatan log. Semua nilai berasal dari data log; stok sebelum = saldo - perubahan.
function LogDetailModal({ log, onClose }) {
  useEffect(() => {
    if (!log) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [log, onClose]);

  if (!log) return null;

  const isIn = log.type === "in";
  const before = log.balance - log.delta;
  const rows = [
    ["Note", log.note || "—"],
    ["Recorded by", log.by],
    ["Recorded at", log.by_at],
    ["Date", log.date],
    ["Time", log.time],
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Log detail ·  ${log.item}`}
        className={`max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-t-2xl bg-[#1a0d10]/95 p-5 shadow-2xl sm:rounded-2xl ${GLASS}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Log detail</p>
            <h2 className="mt-1 truncate text-[17px] font-semibold text-white">{log.item}</h2>
            <p className="mt-0.5 text-[12px] text-white/55">Type: {log.item_type}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <LogType type={log.type} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close log detail"
              className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-3 items-center gap-2 p-3 text-center ${INNER}`}>
          <div>
            <p className="text-[11px] text-white/50">Before</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white/80">{before}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/50">Change</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${isIn ? "text-emerald-300" : "text-[#E04848]"}`}>
              {log.delta > 0 ? "+" : ""}{log.delta}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/50">After</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{log.balance}</p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-white/[0.07] text-[13px]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-white/55">{label}</dt>
              <dd className="min-w-0 text-right font-medium text-white/90">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={PILL + " h-10 px-5"}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function LogSection({ logs }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesType = !filter || log.type === filter;
      const matchesItem = !itemFilter || log.item === itemFilter;
      const text = [
        log.item,
        log.item_type,
        log.note,
        log.by,
        log.date,
      ].join(" ").toLowerCase();

      return matchesType && matchesItem && text.includes(search.trim().toLowerCase());
    });
  }, [logs, search, filter, itemFilter]);

  return (
    <section className="mb-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 max-md:items-start">
        <SectionTitle>Log</SectionTitle>

        <div className="flex flex-wrap gap-2.5 max-md:grid max-md:w-full max-md:grid-cols-2">
          <div className="relative w-[280px] max-w-full max-md:col-span-2 max-md:w-full">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={FIELD + " pl-9"}
            />
          </div>

          <GlassSelect
            label="Filter type"
            placeholder="All types"
            value={filter}
            onChange={setFilter}
            className="w-[150px] max-md:w-full min-w-0"
            options={[
              { value: "", label: "All types" },
              { value: "in", label: "IN" },
              { value: "out", label: "OUT" },
            ]}
          />

          <GlassSelect
            label="Filter item"
            placeholder="All items"
            value={itemFilter}
            onChange={setItemFilter}
            className="w-[170px] max-md:w-full"
            options={[
              { value: "", label: "All items" },
              ...[...new Set(logs.map((log) => log.item))].map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl max-md:overflow-visible">
        <div className={`min-w-[900px] overflow-hidden rounded-2xl ${GLASS} max-md:min-w-0 max-md:overflow-visible max-md:border-0 max-md:bg-none max-md:bg-transparent max-md:shadow-none max-md:backdrop-blur-none`}>
          <div className={`grid ${LOG_COLS} items-center gap-2.5 border-b border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/55 max-md:hidden`}>
            {["Type", "Item", "Stock Change", "Note", "By", "Date", ""].map((heading, index) => (
              <div key={index}>{heading}</div>
            ))}
          </div>

          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`grid min-h-[64px] ${LOG_COLS} items-center gap-2.5 border-b border-white/[0.06] px-4 py-2 text-[13px] text-white/90 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.035] max-md:mb-3 max-md:min-h-0 max-md:grid-cols-[auto_1fr_auto] max-md:items-start max-md:gap-3 max-md:rounded-xl max-md:border max-md:border-white/[0.08] max-md:bg-black/40 max-md:p-3.5`}
            >
              <div className="max-md:col-start-1 max-md:row-start-1">
                <LogType type={log.type} />
              </div>

              <div className="min-w-0 text-[12px] text-white/55 max-md:col-start-2 max-md:row-start-1">
                <b className="block text-[13px] font-semibold text-white">
                  {log.item}
                </b>
                Type: {log.item_type}
              </div>

              <div className={`font-semibold tabular-nums max-md:col-span-3 max-md:row-start-2 max-md:text-[15px] ${log.delta > 0 ? "text-emerald-300" : "text-[#C42B2B]"}`}>
                {log.delta > 0 ? "+" : ""}{log.delta}
                <ArrowRight size={11} className="mx-1 inline opacity-70" />
                {log.balance}
              </div>

              <div className="text-[12px] max-md:col-span-3 max-md:row-start-3 max-md:text-[13px]">
                <span className="text-white/55 md:hidden">Note: </span>
                {log.note}
              </div>

              <div className="max-md:col-span-2 max-md:row-start-4">
                <span className="block text-[12px] text-white/85">{log.by}</span>
                <span className="block text-[11px] text-white/45">
                  {log.by_at}
                </span>
              </div>

              <div className="text-[11px] leading-snug text-white/55 max-md:col-start-3 max-md:row-start-4 max-md:text-right">
                {log.date}
                <br />
                {log.time}
              </div>

              <button
                type="button"
                title="View detail"
                aria-label={`View detail of ${log.item} log`}
                onClick={() => setSelectedLog(log)}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/[0.07] hover:text-white active:scale-[0.95] max-md:col-start-3 max-md:row-start-1 max-md:justify-self-end"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-6 text-center text-[12px] text-white/55">
              No log entries match.
            </div>
          )}
        </div>
      </div>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </section>
  );
}

function AdjustModal({ item, onClose, onSave }) {
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("in");
  const [note, setNote] = useState("");

  if (!item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = Number(quantity);
    if (!amount || amount <= 0) return;

    onSave(item, type, amount, note);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-[420px] rounded-2xl bg-[#1a0d10]/95 p-5 shadow-2xl ${GLASS}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-white">
              Adjust Stock
            </h2>
            <p className="mt-1 text-[12px] text-white/55">
              {item.name} · {item.category}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-0.5 text-lg text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <label className={LABEL}>
          Adjustment type
        </label>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {["in", "out"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-lg border py-2 text-[12px] font-semibold transition ${
                type === value
                  ? value === "in"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/30 bg-white/15 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25"
              }`}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>

        <label className={LABEL}>
          Quantity
        </label>
        <input
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          className={FIELD + " mb-4"}
        />

        <label className={LABEL}>
          Note
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for adjustment"
          className={FIELD}
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={PILL + " h-9 px-4"}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={PILL_PRIMARY}
          >
            Save Adjustment
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Inventory() {
  const navigate = useNavigate();

  const [merchandise, setMerchandise] = useState(() => {
    return JSON.parse(
      localStorage.getItem("jgf-inventory-merchandise") ||
      JSON.stringify(initialMerchandise)
    );
  });

  const [equipment] = useState(initialEquipment);

  const [logs, setLogs] = useState(() => {
    return JSON.parse(
      localStorage.getItem("jgf-inventory-logs") ||
      JSON.stringify(initialLogs)
    );
  });

  const [adjustItem, setAdjustItem] = useState(null);

  const [newItem, setNewItem] = useState(() => {
    return JSON.parse(
      localStorage.getItem("jgf-inventory-new-items") || "[]"
    );
  });

  const allMerchandise = [...merchandise, ...newItem];

  const totalItems = allMerchandise.length;
  const totalUnits = allMerchandise.reduce(
    (sum, item) => sum + Number(item.on_hand || 0),
    0
  );
  const totalValuation = allMerchandise.reduce(
    (sum, item) => sum + Number(item.on_hand || 0) * Number(item.unit_cost || 0),
    0
  );
  const lowStock = allMerchandise.filter(
    (item) => item.on_hand <= item.minimum
  ).length;

  const attention = lowStock;

  const handleAdjustment = (item, type, amount, note) => {
    const updatedMerchandise = merchandise.map((entry) => {
      if (entry.name !== item.name) return entry;

      const nextStock =
        type === "in"
          ? entry.on_hand + amount
          : Math.max(0, entry.on_hand - amount);

      return {
        ...entry,
        on_hand: nextStock,
        status: nextStock <= entry.minimum ? "low" : "normal",
      };
    });

    const updatedNewItems = newItem.map((entry) => {
      if (entry.name !== item.name) return entry;

      const nextStock =
        type === "in"
          ? entry.on_hand + amount
          : Math.max(0, entry.on_hand - amount);

      return {
        ...entry,
        on_hand: nextStock,
        status: nextStock <= entry.minimum ? "low" : "normal",
      };
    });

    const updatedLogs = [
      {
        id: Date.now(),
        type,
        item: item.name,
        item_type: "Merchandise",
        delta: type === "in" ? amount : -amount,
        balance:
          type === "in"
            ? item.on_hand + amount
            : Math.max(0, item.on_hand - amount),
        note: note || "Stock adjustment",
        by: "Reinhart",
        by_at: new Date().toLocaleString("en-GB"),
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...logs,
    ];

    setMerchandise(updatedMerchandise);
    setNewItem(updatedNewItems);
    setLogs(updatedLogs);

    localStorage.setItem(
      "jgf-inventory-merchandise",
      JSON.stringify(updatedMerchandise)
    );
    localStorage.setItem(
      "jgf-inventory-new-items",
      JSON.stringify(updatedNewItems)
    );
    localStorage.setItem(
      "jgf-inventory-logs",
      JSON.stringify(updatedLogs)
    );

    setAdjustItem(null);
  };

  return (
    <div className="iv-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .iv-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .iv-root button, .iv-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .iv-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* PAGE HEADER */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
            Inventory
          </h1>
          <p className="mt-1.5 text-xs text-white/55">
            Stock levels and reorder points
          </p>
        </div>

        {/* ATTENTION BANNER */}
        {attention > 0 && (
          <a
            href="#merchandise"
            className="mb-5 flex min-h-9 py-1.5 md:h-10 md:py-0 items-center gap-2.5 rounded-xl border border-[#B82323]/40 bg-gradient-to-b from-[#A21E1E] to-[#8F1A1A] px-3.5 text-[12px] font-medium text-white shadow-[0_6px_18px_-8px_rgba(162,30,30,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:brightness-110"
          >
            <AlertTriangle size={16} />
            {attention} item{attention > 1 ? "s" : ""} needs attention
            <ArrowRight size={16} className="ml-auto" />
          </a>
        )}

        {/* STOCK ON HAND */}
        <section className={`mb-6 rounded-2xl p-4 md:p-5 ${GLASS}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">
              Stock on hand
            </h2>

            <button
              type="button"
              onClick={() => navigate("/inventory/create")}
              className={PILL_PRIMARY + " h-9 px-3.5"}
            >
              <Plus size={14} />
              Add item
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[480px]:grid-cols-1">
            <StockCard
              icon={FileText}
              label="Items"
              value={totalItems}
            />
            <StockCard
              icon={Package}
              label="Units"
              value={totalUnits}
            />
            <StockCard
              icon={Coins}
              label="Valuation"
              value={formatRupiah(totalValuation)}
            />
            <StockCard
              icon={AlertTriangle}
              label="Low stock"
              value={lowStock}
            />
          </div>
        </section>

        {/* MERCHANDISE */}
        <div id="merchandise">
          <MerchandiseSection
            items={allMerchandise}
            onAdjust={setAdjustItem}
          />
        </div>

        {/* EQUIPMENT */}
        <EquipmentSection
          items={equipment}
          onAdjust={(item) =>
            alert(`Equipment adjustment for "${item.name}" is not available yet.`)
          }
        />

        {/* LOG */}
        <LogSection logs={logs} />

        {/* ADJUST MODAL */}
        <AdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSave={handleAdjustment}
        />
      </div>
    </div>
  );
}
