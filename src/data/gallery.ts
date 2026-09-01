import type { GalleryItem } from "@/types";
import campus from "@/assets/campus.jpg";
import classroom from "@/assets/classroom.jpg";
import library from "@/assets/library.jpg";
import sports from "@/assets/sports.jpg";
import annualDay from "@/assets/annual-day.jpg";
import computerLab from "@/assets/computer-lab.jpg";
import scienceLab from "@/assets/science-lab.jpg";
import heroStudents from "@/assets/hero-students.jpg";

export const galleryImages = {
  campus,
  classroom,
  library,
  sports,
  annualDay,
  computerLab,
  scienceLab,
  heroStudents,
};

export const galleryItems: GalleryItem[] = [
  { id: "g1", title: "Main academic building", category: "Campus", src: campus, aspect: "wide" },
  { id: "g2", title: "Morning assembly gathering", category: "Campus", src: heroStudents, aspect: "wide" },
  { id: "g3", title: "Class in progress", category: "Classroom", src: classroom, aspect: "square" },
  { id: "g4", title: "Reading hour at the library", category: "Classroom", src: library, aspect: "tall" },
  { id: "g5", title: "Inter-house athletics", category: "Sports", src: sports, aspect: "square" },
  { id: "g6", title: "Annual day performance", category: "Annual Day", src: annualDay, aspect: "wide" },
  { id: "g7", title: "Computer laboratory session", category: "Events", src: computerLab, aspect: "square" },
  { id: "g8", title: "Science exhibition experiments", category: "Events", src: scienceLab, aspect: "tall" },
  { id: "g9", title: "Campus greens", category: "Campus", src: campus, aspect: "square" },
  { id: "g10", title: "Cultural programme finale", category: "Annual Day", src: annualDay, aspect: "square" },
  { id: "g11", title: "Sports day sprint final", category: "Sports", src: sports, aspect: "wide" },
  { id: "g12", title: "Library reference wing", category: "Campus", src: library, aspect: "square" },
];

export const galleryCategories = [
  "All",
  "Campus",
  "Events",
  "Sports",
  "Annual Day",
  "Classroom",
] as const;

export type GalleryFilter = (typeof galleryCategories)[number];
