import type {
  Achievement,
  Activity,
  AcademicLevel,
  Facility,
  FaqItem,
  Feature,
  SchoolEvent,
  Statistic,
  Testimonial,
  TimelineEvent,
} from "@/types";

export const statistics: Statistic[] = [
  { id: "years", label: "Years of Excellence", value: 29, suffix: "+", icon: "Award" },
  { id: "teachers", label: "Qualified Teachers", value: 48, suffix: "+", icon: "GraduationCap" },
  { id: "students", label: "Happy Students", value: 1240, suffix: "+", icon: "Users" },
  { id: "classrooms", label: "Smart Classrooms", value: 32, icon: "School" },
];

export const features: Feature[] = [
  {
    id: "teachers",
    title: "Experienced Teachers",
    description:
      "A dedicated faculty of trained, government-certified educators who mentor every child personally.",
    icon: "UserCheck",
  },
  {
    id: "quality",
    title: "Quality Education",
    description:
      "A rigorous Bengali medium curriculum aligned with the West Bengal Board, focused on real understanding.",
    icon: "BookOpen",
  },
  {
    id: "safe",
    title: "Safe Campus",
    description:
      "CCTV-monitored premises, trained guards and a caring staff so parents can be worry-free every day.",
    icon: "ShieldCheck",
  },
  {
    id: "affordable",
    title: "Affordable Education",
    description:
      "Transparent, modest fees with scholarships and fee waivers for meritorious and needy students.",
    icon: "HandCoins",
  },
  {
    id: "digital",
    title: "Digital Learning",
    description:
      "Smart boards, a computer lab and digital study material bring modern tools to every classroom.",
    icon: "Laptop",
  },
  {
    id: "coed",
    title: "Co-Education",
    description:
      "A respectful, inclusive environment where girls and boys learn, lead and grow together.",
    icon: "Users2",
  },
];

export const academicLevels: AcademicLevel[] = [
  {
    id: "lkg",
    name: "LKG",
    classes: "Lower Kindergarten",
    ageGroup: "Age 3 – 4 years",
    description: "Play-based learning, Bengali & English phonics, rhymes, colours and motor skills.",
    icon: "Baby",
  },
  {
    id: "ukg",
    name: "UKG",
    classes: "Upper Kindergarten",
    ageGroup: "Age 4 – 5 years",
    description: "Pre-reading, number sense, storytelling and joyful classroom routines.",
    icon: "Blocks",
  },
  {
    id: "primary",
    name: "Primary",
    classes: "Class I – IV",
    ageGroup: "Age 5 – 10 years",
    description: "Strong foundation in Bengali, English, Mathematics, EVS and creative arts.",
    icon: "Pencil",
  },
  {
    id: "upper-primary",
    name: "Upper Primary",
    classes: "Class V – VIII",
    ageGroup: "Age 10 – 14 years",
    description: "Subject specialisation, project work, laboratory exposure and life skills.",
    icon: "BookMarked",
  },
  {
    id: "secondary",
    name: "Secondary",
    classes: "Class IX – X",
    ageGroup: "Age 14 – 16 years",
    description: "Focused Madhyamik preparation with doubt clinics, test series and career guidance.",
    icon: "GraduationCap",
  },
];

export const activities: Activity[] = [
  { id: "sports", name: "Sports", description: "Athletics, football, kabaddi and yoga throughout the year.", icon: "Trophy" },
  { id: "drawing", name: "Drawing", description: "Weekly art classes and inter-house painting competitions.", icon: "Palette" },
  { id: "music", name: "Music", description: "Rabindra Sangeet, folk songs and instrument training.", icon: "Music" },
  { id: "cultural", name: "Cultural Programs", description: "Recitation, drama and festival celebrations.", icon: "Drama" },
  { id: "science", name: "Science Exhibition", description: "Student-built working models judged by experts.", icon: "FlaskConical" },
  { id: "annual", name: "Annual Function", description: "A grand day of performance for the whole school family.", icon: "PartyPopper" },
];

export const facilities: Facility[] = [
  { id: "classrooms", title: "Modern Classrooms", description: "Airy, well-lit rooms with ergonomic furniture and a maximum of 30 students per section.", icon: "School" },
  { id: "library", title: "Library", description: "Over 8,000 Bengali and English titles, reference sections and a quiet reading hall.", icon: "Library" },
  { id: "computer-lab", title: "Computer Lab", description: "40 networked systems with broadband access and structured IT curriculum from Class III.", icon: "Monitor" },
  { id: "science-lab", title: "Science Lab", description: "Separate Physics, Chemistry and Biology benches for hands-on experiments.", icon: "FlaskConical" },
  { id: "playground", title: "Playground", description: "A large open field for football, athletics and morning assembly.", icon: "Volleyball" },
  { id: "water", title: "Pure Drinking Water", description: "RO-purified, chilled drinking water stations on every floor.", icon: "Droplets" },
  { id: "transport", title: "Transport Facility", description: "Buses covering Keshiary and surrounding regional routes.", icon: "Bus" },
  { id: "smart", title: "Smart Classroom", description: "Interactive digital boards with curated audio-visual lessons for every subject.", icon: "MonitorPlay" },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Sudipta Bhattacharya",
    role: "Parent, Class VI",
    initials: "SB",
    message:
      "The teachers know my daughter as a person, not a roll number. Her confidence in Bengali and Mathematics has grown remarkably in two years.",
  },
  {
    id: "t2",
    name: "Moumita Das",
    role: "Parent, Class IX",
    initials: "MD",
    message:
      "Regular parent-teacher meetings and honest feedback keep us involved. The Madhyamik preparation support is genuinely excellent.",
  },
  {
    id: "t3",
    name: "Arindam Ghosh",
    role: "Alumnus, Batch of 2012",
    initials: "AG",
    message:
      "Everything I value — discipline, curiosity, respect for my mother tongue — I learnt on this campus. It shaped my entire career.",
  },
  {
    id: "t4",
    name: "Rekha Mondal",
    role: "Parent, LKG",
    initials: "RM",
    message:
      "My son actually asks to go to school. The kindergarten wing is safe, colourful and full of warmth.",
  },
];

export const timeline: TimelineEvent[] = [
  { id: "1996", year: "1996", title: "Foundation", description: "Started with 62 students in three rented rooms with a simple promise: quality education in Bengali." },
  { id: "2002", year: "2002", title: "Own Campus", description: "Moved to the present campus in Aurangabad, Keshiary with a purpose-built academic block." },
  { id: "2008", year: "2008", title: "Secondary Recognition", description: "Received recognition up to Class X and sent our first Madhyamik batch." },
  { id: "2014", year: "2014", title: "Science & Computer Labs", description: "Dedicated laboratories and a 40-seat computer lab were inaugurated." },
  { id: "2019", year: "2019", title: "Smart Classrooms", description: "Digital boards installed across all senior classrooms." },
  { id: "2024", year: "2024", title: "New Library Wing", description: "A three-storey library and activity wing opened for students and parents." },
];

export const achievements: Achievement[] = [
  { id: "a1", title: "100% Madhyamik Pass Rate", description: "Nine consecutive years of full success, with 38 students above 90% in 2025.", icon: "Medal" },
  { id: "a2", title: "District Science Champions", description: "First place at the Paschim Medinipur science exhibition, three years running.", icon: "FlaskConical" },
  { id: "a3", title: "State Recitation Award", description: "Our students won gold at the state-level Bengali recitation contest.", icon: "Mic" },
  { id: "a4", title: "Inter-School Football Cup", description: "Under-14 team lifted the district inter-school football trophy in 2025.", icon: "Trophy" },
];

export const upcomingEvents: SchoolEvent[] = [
  { id: "e1", title: "Annual Sports Meet", date: "12 September 2026", location: "School Playground", description: "Track events, march-past and prize distribution for all sections." },
  { id: "e2", title: "Science Exhibition", date: "04 October 2026", location: "Science Block", description: "Working models by Class V–X students, open to parents." },
  { id: "e3", title: "Saraswati Puja", date: "23 January 2027", location: "School Prangan", description: "Traditional celebration followed by cultural programme and prasad." },
  { id: "e4", title: "Annual Function", date: "21 February 2027", location: "School Auditorium", description: "Dance, drama and Rabindra Sangeet performances by every class." },
];

export const faqs: FaqItem[] = [
  { id: "f1", question: "What is the medium of instruction?", answer: "All subjects are taught in Bengali, with English and Hindi taught as separate language subjects from the primary level onwards." },
  { id: "f2", question: "When does the admission process begin?", answer: "Forms for the next academic session are issued from the first week of December, and admissions close by the last week of January." },
  { id: "f3", question: "Is transport available for my locality?", answer: "School buses run on fixed routes across Keshiary and nearby surrounding regions. Contact the office to check your stop." },
  { id: "f4", question: "What is the student-teacher ratio?", answer: "We maintain an average of one teacher for every 26 students, and never more than 30 students per section." },
  { id: "f5", question: "Do you offer fee concessions?", answer: "Yes. Merit scholarships and need-based fee waivers are available; applications are reviewed by the school committee each year." },
  { id: "f6", question: "Are extra classes provided for Class X?", answer: "Yes, doubt-clearing sessions and a full Madhyamik test series are conducted free of cost for all Class IX and X students." },
];
