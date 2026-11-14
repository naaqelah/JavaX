
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Dropdown kustom bergaya kaca gelap. Pengganti <select> bawaan yang popup-nya
// tidak mengikuti tema (teks putih di atas latar putih).
// options: string[] atau { value, label }[]
export default function GlassSelect({ value, onChange, options, placeholder = "Select", label, className = "", icon = null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const current = items.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-left text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-white/20 hover:bg-white/[0.08] focus:border-[#B82323]/60 focus:outline-none"
      >
        {icon && <span className="shrink-0 text-white/55">{icon}</span>}
        <span className={`min-w-0 flex-1 truncate ${current ? "text-white" : "text-white/40"}`}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-white/55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1a0d10]/95 p-1 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.85),0_0_24px_-8px_rgba(162,30,30,0.35)] backdrop-blur-xl [scrollbar-width:thin]"
        >
          {items.map((item) => {
            const selected = item.value === value;

            return (
              <li key={item.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                    selected
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {item.label}
                  {selected && <Check size={13} className="text-[#C42B2B]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
