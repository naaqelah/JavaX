
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// Dropdown kustom bergaya kaca gelap. Pengganti <select> bawaan yang popup-nya
// tidak mengikuti tema (teks putih di atas latar putih).
// options: string[] atau { value, label }[]
export default function GlassSelect({ value, onChange, options, placeholder = "Select", label, className = "", icon = null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const [pos, setPos] = useState(null);

  const items = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const current = items.find((item) => item.value === value);

  // Daftar dirender lewat portal di <body> supaya tidak tertimpa kartu (stacking context) di bawahnya.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const flip = below < 160 && r.top > below;
      const room = Math.max(120, Math.min(240, (flip ? r.top : below) - 6));
      setPos({
        left: r.left,
        width: r.width,
        maxHeight: room,
        ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      const t = event.target;
      if (ref.current && !ref.current.contains(t) && !(listRef.current && listRef.current.contains(t))) setOpen(false);
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
        className="flex h-11 w-full items-center sm:h-10 justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-left text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-white/20 hover:bg-white/[0.08] focus:border-[#B82323]/60 focus:outline-none"
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

      {open && pos && createPortal(
        <ul
          ref={listRef}
          style={pos}
          role="listbox"
          aria-label={label}
          className="fixed z-[1000] overflow-y-auto rounded-xl border border-white/10 bg-[#1a0d10]/95 p-1 shadow-[0_18px_44px_-12px_rgba(0,0,0,0.85),0_0_24px_-8px_rgba(162,30,30,0.35)] backdrop-blur-xl [scrollbar-width:thin]"
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
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-[13px] sm:py-2 transition ${
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
        </ul>,
        document.body
      )}
    </div>
  );
}
