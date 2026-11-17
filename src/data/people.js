// Anggota tim + foto. Nama mengikuti nama file di src/assets/images.
import agungPhoto from "../assets/images/AGUNG.JPG";
import anabelePhoto from "../assets/images/ANABELE.JPG";
import bellaPhoto from "../assets/images/BELLA.JPG";
import charlenePhoto from "../assets/images/CHARLENE.JPG";
import jasonPhoto from "../assets/images/JASON.JPG";
import jodiePhoto from "../assets/images/JODIE.JPG";
import lidiaPhoto from "../assets/images/LIDIA.JPG";
import michaelPhoto from "../assets/images/MICHAEL.JPG";
import reinhartPhoto from "../assets/images/REINHART.jpeg";

export const TEAM = [
  // ratio = tinggi/lebar foto asli; fx, fy = titik tengah kepala (0-1 dari foto asli);
  // w = lebar foto di dalam lingkaran (1 = pas selebar lingkaran). Diukur per foto, foto asli tidak diubah.
  { name: "Agung", photo: agungPhoto, ratio: 1.5, fx: 0.5, fy: 0.385, w: 1.5 },
  { name: "Anabele", photo: anabelePhoto, ratio: 1.5, fx: 0.5, fy: 0.4, w: 1.1 },
  { name: "Bella", photo: bellaPhoto, ratio: 0.667, fx: 0.506, fy: 0.433, w: 2.4 },
  { name: "Charlene", photo: charlenePhoto, ratio: 1.5, fx: 0.51, fy: 0.367, w: 1.45 },
  { name: "Jason", photo: jasonPhoto, ratio: 0.667, fx: 0.487, fy: 0.265, w: 1.9 },
  { name: "Jodie", photo: jodiePhoto, ratio: 0.667, fx: 0.49, fy: 0.29, w: 3.0 },
  { name: "Lidia", photo: lidiaPhoto, ratio: 1.5, fx: 0.48, fy: 0.42, w: 1.3 },
  { name: "Michael", photo: michaelPhoto, ratio: 1.5, fx: 0.56, fy: 0.353, w: 1.25 },
  { name: "Reinhart", photo: reinhartPhoto, ratio: 0.951, fx: 0.47, fy: 0.23, w: 1.3 },
];

const PHOTOS = Object.fromEntries(TEAM.map((person) => [person.name.toLowerCase(), person.photo]));

// Foto berdasarkan nama depan (tidak peka huruf besar/kecil); undefined jika tidak ada fotonya
export const getPhoto = (name) => PHOTOS[String(name ?? "").trim().split(" ")[0].toLowerCase()];

export const getPerson = (name) =>
  TEAM.find((person) => person.name.toLowerCase() === String(name ?? "").trim().split(" ")[0].toLowerCase());

export const getInitials = (name) =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
