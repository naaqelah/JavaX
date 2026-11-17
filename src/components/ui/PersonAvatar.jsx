import { getInitials, getPerson } from "../../data/people";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Avatar bulat 1:1: foto anggota tim bila ada, kalau tidak huruf inisial.
// Tiap foto punya titik kepala dan skala sendiri (lihat data/people.js) sehingga wajah
// berada di tengah lingkaran dengan sedikit ruang di sekitar kepala dan bahu. Foto asli tidak diubah.
export default function PersonAvatar({ name, className = "h-7 w-7 text-[11px]" }) {
  const person = getPerson(name);

  if (person) {
    const { photo, ratio, fx, fy, w } = person;
    // Lebar minimal agar foto selalu menutup lingkaran (tanpa tepi kosong)
    const width = Math.max(w, 1, 1 / ratio);
    const height = width * ratio;
    const left = clamp(0.5 - fx * width, 1 - width, 0);
    const top = clamp(0.5 - fy * height, 1 - height, 0);

    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-[#1a1a1c] ring-1 ring-white/15 ${className}`}
      >
        <img
          src={photo}
          alt={person.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            width: `${width * 100}%`,
            height: `${height * 100}%`,
            left: `${left * 100}%`,
            top: `${top * 100}%`,
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-[#A21E1E]/40 to-white/[0.06] font-semibold text-white ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
