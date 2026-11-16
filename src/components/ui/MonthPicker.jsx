import { MONTH_OPTIONS } from "./monthOptions";

// Pemilih bulan berbentuk tombol (menggantikan dropdown) agar konsisten di semua halaman.
export default function MonthPicker({ value, onChange, options = MONTH_OPTIONS }) {
  const ordered = [...options].reverse(); // Jan → Dec

  return (
    <div role="group" aria-label="Month" className="col-span-full grid w-full basis-full grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-12">
      {ordered.map((month) => {
        const [name, year] = month.split(" ");
        const active = month === value;

        return (
          <button
            key={month}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(month)}
            className={`h-8 whitespace-nowrap rounded-lg border px-2 text-[12px] font-medium transition active:scale-[0.97] ${
              active
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white"
            }`}
          >
            {name.slice(0, 3)} {year}
          </button>
        );
      })}
    </div>
  );
}
