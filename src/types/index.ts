export interface NavItem {
  label: string;
  to: string;
}

export interface Statistic {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AcademicLevel {
  id: string;
  name: string;
  classes: string;
  ageGroup: string;
  description: string;
  icon: string;
}

export type NoticeCategory = "Examination" | "Admission" | "Event" | "Holiday" | "General";

export interface Notice {
  id: string;
  title: string;
  date: string;
  category: NoticeCategory;
  description: string;
  isNew?: boolean;
}

export type GalleryCategory = "Campus" | "Events" | "Sports" | "Annual Day" | "Classroom";

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  src: string;
  aspect: "tall" | "wide" | "square";
}

export interface Facility {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  initials: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}
