
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  FileUp,
  Plus,
} from "lucide-react";

// Desain token sama dengan halaman lain (Overview, Inventory, Promotors, dst.)
const GLASS =
  "rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-white/[0.02] backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_44px_-14px_rgba(162,30,30,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.28)]";
const PILL =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[12px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.09] active:scale-[0.97]";
const PILL_PRIMARY =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-white px-3.5 text-[12px] font-semibold text-[#120809] shadow-[0_6px_16px_-6px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:brightness-110 active:scale-[0.97]";
const FIELD =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/35 hover:border-white/20 focus:border-[#B82323]/60 [color-scheme:dark]";

const people = [
  "Reinhart",
  "Jason",
  "Agung",
  "Anabele",
];

const kpis = ["Operational", "Marketing", "Finance"];

const initialForm = {
  sku: "",
  kpi_1: "",
  person_1: "",
  person_2: "",
  kpi_2: "",
  person_3: "",
};

function FormField({ label, required, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-[12px] font-medium text-white/85">
        {label} {required && <span className="text-[#C42B2B]">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required
        className={`${FIELD} appearance-none pr-9`}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option} value={option} className="bg-[#141414]">
            {option}
          </option>
        ))}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/55"
      />
    </div>
  );
}

export default function InventoryCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const sku = form.sku.trim();

    if (!sku) {
      setError("SKU is required.");
      return;
    }

    const savedItems = JSON.parse(
      localStorage.getItem("jgf-inventory-new-items") || "[]"
    );

    const existingItems = JSON.parse(
      localStorage.getItem("jgf-inventory-merchandise") ||
      "null"
    );

    const allItems = [
      ...savedItems,
      ...(existingItems || []),
    ];

    const duplicate = allItems.some(
      (item) => item.name.toLowerCase() === sku.toLowerCase()
    );

    if (duplicate) {
      setError("This SKU is already registered. Please use a different SKU.");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: sku,
      sku,
      category: form.kpi_1,
      on_hand: 0,
      minimum: 0,
      unit_cost: 0,
      status: "normal",
      assignments: [
        {
          person: form.person_1,
          kpi: form.kpi_1,
        },
        {
          person: form.person_2,
          kpi: form.kpi_2,
        },
        {
          person: form.person_3,
          kpi: form.kpi_1,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...savedItems, newItem];

    localStorage.setItem(
      "jgf-inventory-new-items",
      JSON.stringify(updatedItems)
    );

    navigate("/inventory");
  };

  return (
    <div className="ic-root relative isolate -mx-4 -mt-4 min-h-screen w-[calc(100%+2rem)] min-w-0 overflow-x-hidden pb-14 pt-6 text-[#f6efef] md:-mx-7 md:-mt-7 md:w-[calc(100%+3.5rem)] [font-family:Plus_Jakarta_Sans,Inter,system-ui,sans-serif]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");
        .ic-root :focus-visible { outline: 2px solid #B82323; outline-offset: 2px; }
        .ic-root button, .ic-root a { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { .ic-root * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* BACKGROUND GLOW (sama dengan Overview & MarketingPerformance) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 min-h-screen w-screen bg-[linear-gradient(180deg,#0a0a0a_0%,#070707_60%,#040404_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-none px-3 pb-6 sm:px-4 md:px-4 lg:px-5">
        {/* TOP ROW */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/65 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to inventory
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                alert("Board Dossier is not connected to the backend yet.")
              }
              className={PILL}
            >
              <Calculator size={13} />
              Board Dossier
            </button>

            <button
              type="button"
              onClick={() =>
                alert("Export is not available on the Add New Item page yet.")
              }
              className={PILL_PRIMARY}
            >
              <FileUp size={13} />
              Export As
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* TITLE */}
        <div className="mb-5">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white md:text-[24px]">
            Add new item
          </h1>

          <p className="mt-1.5 text-xs text-white/55">
            Enter item details.
          </p>

        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className={`rounded-2xl p-4 sm:p-5 md:p-6 ${GLASS}`}>
          {/* ROW 1 */}
          <div className="mb-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField label="SKU" required>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                placeholder="Enter SKU code"
                autoComplete="off"
                required
                className={FIELD}
              />
            </FormField>

            <FormField label="KPI" required>
              <SelectField
                value={form.kpi_1}
                onChange={(e) => updateField("kpi_1", e.target.value)}
                options={kpis}
                placeholder="Choose a KPI"
              />
            </FormField>
          </div>

          {/* ROW 2 */}
          <div className="mb-5">
            <FormField label="Person" required>
              <SelectField
                value={form.person_1}
                onChange={(e) => updateField("person_1", e.target.value)}
                options={people}
                placeholder="Choose somebody"
              />
            </FormField>
          </div>

          {/* ROW 3 */}
          <div className="mb-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField label="Person" required>
              <SelectField
                value={form.person_2}
                onChange={(e) => updateField("person_2", e.target.value)}
                options={people}
                placeholder="Choose somebody"
              />
            </FormField>

            <FormField label="KPI" required>
              <SelectField
                value={form.kpi_2}
                onChange={(e) => updateField("kpi_2", e.target.value)}
                options={kpis}
                placeholder="Choose a KPI"
              />
            </FormField>
          </div>

          {/* ROW 4 */}
          <div className="mb-6">
            <FormField label="Person" required>
              <SelectField
                value={form.person_3}
                onChange={(e) => updateField("person_3", e.target.value)}
                options={people}
                placeholder="Choose somebody"
              />
            </FormField>
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-[#B82323]/30 bg-[#A21E1E]/15 px-3.5 py-2.5 text-[12px] text-[#E04848]">
              {error}
            </p>
          )}

          {/* FORM ACTIONS */}
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-white/[0.08] pt-5">
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className={PILL + " h-10 px-4"}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={PILL_PRIMARY + " h-10 px-4"}
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
