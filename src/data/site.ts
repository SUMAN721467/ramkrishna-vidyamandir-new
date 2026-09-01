import type { NavItem } from "@/types";

export const SCHOOL = {
  name: "Ramkrishna Vidyamandir",
  shortName: "RKVM",
  tagline: "A Bengali Medium Private Co-Educational School",
  motto: "বিদ্যাই পরম বল — Knowledge is the Ultimate Strength",
  established: 1996,
  address: "Vill - Aurangabad, P.O - Keshiary, Dist - Paschim Medinipur, West Bengal 721133",
  phone: "+91 97326 40068",
  altPhone: "",
  email: "ramkrishnavm2020@gmail.com",
  admissionEmail: "ramkrishnavm2020@gmail.com",
  officeHours: "Monday – Saturday, 9:00 AM – 4:00 PM",
} as const;

export const navigation: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Academics", to: "/academics" },
  { label: "Facilities", to: "/facilities" },
  { label: "Gallery", to: "/gallery" },
  { label: "Notices", to: "/notices" },
  { label: "Contact", to: "/contact" },
];

export const quickLinks: NavItem[] = [
  { label: "School Portal", to: "/portal/login" },
  { label: "Admissions", to: "/admissions" },
  { label: "Notice Board", to: "/notices" },
  { label: "Academics", to: "/academics" },
  { label: "Photo Gallery", to: "/gallery" },
  { label: "Contact Us", to: "/contact" },
];
