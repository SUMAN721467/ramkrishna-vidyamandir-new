import { supabase, isSupabaseConfigured } from './supabase';
import { formatDateDDMMYYYY, parseDateToISO, formatDateSlash } from './format';
import type {
  Profile,
  SchoolClass,
  Section,
  Student,
  AttendanceRecord,
  Notice,
  StudentMark,
  ScheduledExam,
  ClassTimetableEntry,
  DayOfWeek,
  UserRole,
  Subject,
  SubjectCategory,
} from '../types/portal';

// Initial Mock Seed Data for Instant Local Testing / Fallback
const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c0', name: 'Play' },
  { id: 'c1', name: 'LKG' },
  { id: 'c2', name: 'UKG' },
  { id: 'c3', name: 'Class 1' },
  { id: 'c4', name: 'Class 2' },
  { id: 'c5', name: 'Class 3' },
  { id: 'c6', name: 'Class 4' },
  { id: 'c7', name: 'Class 5' },
  { id: 'c8', name: 'Class 6' },
  { id: 'c9', name: 'Class 7' },
  { id: 'c10', name: 'Class 8' },
  { id: 'c11', name: 'Class 9' },
  { id: 'c12', name: 'Class 10' },
];

export const DUMMY_TIMETABLE_TEACHERS = new Set([
  'Subrata Sen',
  'Debashis Mukherjee',
  'Sourav Ganguly',
  'Anupam Roy',
  'Kallol Ghosh',
  'Priyanka Das',
  'Ranjan Banerjee',
]);

export function isDummyTimetableEntry(e: any): boolean {
  if (!e) return false;
  if (typeof e.id === 'string' && /^tt-(?:[1-9]|[12][0-9]|3[0-3])$/.test(e.id)) return true;
  if (e.teacher_name && DUMMY_TIMETABLE_TEACHERS.has(e.teacher_name)) return true;
  return false;
}

const INITIAL_TIMETABLES: ClassTimetableEntry[] = [];

const INITIAL_SECTIONS: Section[] = [
  { id: 's-a', class_id: 'all', name: 'Section A' },
  { id: 's-b', class_id: 'all', name: 'Section B' },
];

export function generateDefaultPassword(name: string, dob?: string): string {
  const firstName = name.trim().split(' ')[0] || 'User';
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  let year = '2011';
  if (dob && dob.trim()) {
    const trimmed = dob.trim();
    const fourDigitMatch = trimmed.match(/\b(19\d{2}|20\d{2})\b/);
    if (fourDigitMatch) {
      year = fourDigitMatch[1];
    } else {
      const parts = trimmed.split(/[-/]/);
      for (const p of parts) {
        if (p.length === 4 && !isNaN(Number(p))) {
          year = p;
          break;
        }
      }
    }
  }

  return `${capitalized}@${year}`;
}

export function generateTeacherDefaultPassword(name: string): string {
  if (!name || !name.trim()) return 'Teacher@1234';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const prefixes = /^(smt\.?|shri\.?|sri\.?|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)$/i;
  let word = parts[0];
  if (parts.length > 1 && prefixes.test(word)) {
    word = parts[1];
  }
  const clean = word.replace(/[^a-zA-Z0-9]/g, '');
  const capitalized = clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'Teacher';
  return `${capitalized}@1234`;
}

export function isSyntheticEmail(email?: string, phone?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (clean === 'na') {
    return true;
  }
  if (phone && clean === `${phone.replace(/\D/g, '')}@rkvmschool.in`.toLowerCase()) {
    return true;
  }
  return /^\d{7,}@rkvmschool\.in$/i.test(clean);
}

export function formatDisplayEmail(email?: string, phone?: string): string {
  if (!email || !email.trim()) return 'NA';
  const clean = email.trim();
  if (clean.toUpperCase() === 'NA') return 'NA';
  if (isSyntheticEmail(clean, phone)) return 'NA';
  return clean;
}

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'u-admin-1',
    email: 'rkvmschool.in@gmail.com',
    full_name: 'RKVM School Admin',
    role: 'admin',
    phone: '+91 97326 40068',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    portal_password: 'Rkvm@12345',
  },
];

const INITIAL_STUDENTS: Student[] = [];
const INITIAL_TEACHER_ASSIGNMENTS: any[] = [];
const INITIAL_PARENT_LINKS: any[] = [];

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n-1',
    title: 'Upcoming Unit Test & Parent-Teacher Meeting',
    content: 'The first term unit assessment for Classes 1 to 10 will commence from September 15. Parent-Teacher meeting for Class 5 will be held on Saturday at 10:00 AM.',
    target_role: 'all',
    created_by: 'u-admin-1',
    is_pinned: true,
    created_at: '2026-09-01T10:00:00Z',
    author_name: 'Headmaster',
  },
];

const INITIAL_SUBJECTS: Subject[] = [
  // Academic Subjects
  { id: 'sub-1', name: 'Bengali (বাংলা)', code: 'BEN', class_id: 'all', category: 'Academic', description: 'Bengali language, literature, reading, and grammar.' },
  { id: 'sub-2', name: 'English (ইংরেজি)', code: 'ENG', class_id: 'all', category: 'Academic', description: 'English grammar, vocabulary, reading comprehension, and writing.' },
  { id: 'sub-3', name: 'Mathematics (গণিত)', code: 'MATH', class_id: 'all', category: 'Academic', description: 'Arithmetic, numerical logic, geometry, and mental math.' },
  { id: 'sub-4', name: 'Environmental Studies / EVS (পরিবেশ শিক্ষা)', code: 'EVS', class_id: 'all', category: 'Academic', description: 'Environmental awareness, social living, and hygiene.' },
  { id: 'sub-5', name: 'Science (বিজ্ঞান)', code: 'SCI', class_id: 'all', category: 'Academic', description: 'General science, nature observation, physical and life sciences.' },
  { id: 'sub-6', name: 'General Knowledge / G.K. (সাধারণ জ্ঞান)', code: 'GK', class_id: 'all', category: 'Academic', description: 'General awareness, current events, heritage, and quiz.' },
  { id: 'sub-7', name: 'History (ইতিহাস)', code: 'HIST', class_id: 'all', category: 'Academic', description: 'Indian and world history, civilisation, and cultural heritage.' },
  { id: 'sub-8', name: 'Geography (ভূগোল)', code: 'GEO', class_id: 'all', category: 'Academic', description: 'Physical geography, environment, and world geography.' },
  { id: 'sub-9', name: 'Computer', code: 'COMP', class_id: 'all', category: 'Academic', description: 'Computer fundamentals, practical usage, and typing skills.' },
  { id: 'sub-10', name: 'Sanskrit (সংস্কৃত)', code: 'SANS', class_id: 'all', category: 'Academic', description: 'Classical Sanskrit language, grammar, shlokas, and pronunciation.' },

  // Co-curricular / Activity Subjects
  { id: 'sub-11', name: 'Drawing', code: 'DRAW', class_id: 'all', category: 'Co-curricular / Activity', description: 'Freehand sketching, colouring, crafts, and visual art.' },
  { id: 'sub-12', name: 'Physical Training / P.T.', code: 'PT', class_id: 'all', category: 'Co-curricular / Activity', description: 'Drill, physical exercise, athletics, yoga, and games.' },
  { id: 'sub-13', name: 'Music / Song', code: 'MUSIC', class_id: 'all', category: 'Co-curricular / Activity', description: 'Devotional songs, Rabindra Sangeet, prayer hymns, and choir.' },
  { id: 'sub-14', name: 'Rhymes', code: 'RHY', class_id: 'all', category: 'Co-curricular / Activity', description: 'Rhythmic recitation, phonics, and expressive action rhymes.' },
  { id: 'sub-15', name: 'Spoken English', code: 'SPOKEN', class_id: 'all', category: 'Co-curricular / Activity', description: 'Conversational fluency, phonetics, dialogue practice, and speech.' },
];

// Local Storage sync for demo/offline development mode ONLY
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('rkvm_portal_store');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.timetables && Array.isArray(parsed.timetables)) {
        const filtered = parsed.timetables.filter((t: any) => !isDummyTimetableEntry(t));
        if (filtered.length !== parsed.timetables.length) {
          parsed.timetables = filtered;
          localStorage.setItem('rkvm_portal_store', JSON.stringify(parsed));
        }
      }
    }
  } catch {}
}

class PortalStore {
  classes: SchoolClass[] = INITIAL_CLASSES;
  sections: Section[] = INITIAL_SECTIONS;
  profiles: Profile[] = INITIAL_PROFILES;
  students: Student[] = INITIAL_STUDENTS;
  teacherAssignments = INITIAL_TEACHER_ASSIGNMENTS;
  parentLinks = INITIAL_PARENT_LINKS;
  notices: Notice[] = INITIAL_NOTICES;
  attendance: AttendanceRecord[] = [];
  marks: StudentMark[] = [];
  exams: ScheduledExam[] = [];
  timetables: ClassTimetableEntry[] = [];
  subjects: Subject[] = INITIAL_SUBJECTS;

  constructor() {
    if (typeof window !== 'undefined' && !isSupabaseConfigured) {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.classes && parsed.classes.length > 0) {
            if (!parsed.classes.some((c: any) => c.name?.toLowerCase() === 'play')) {
              this.classes = [{ id: 'c0', name: 'Play' }, ...parsed.classes];
            } else {
              this.classes = parsed.classes;
            }
          } else {
            this.classes = INITIAL_CLASSES;
          }
          this.sections = INITIAL_SECTIONS;
          this.profiles = parsed.profiles && parsed.profiles.length > 0 ? parsed.profiles : INITIAL_PROFILES;
          this.students = parsed.students || [];
          this.teacherAssignments = parsed.teacherAssignments || INITIAL_TEACHER_ASSIGNMENTS;
          this.parentLinks = parsed.parentLinks || INITIAL_PARENT_LINKS;
          this.notices = parsed.notices && parsed.notices.length > 0 ? parsed.notices : INITIAL_NOTICES;
          this.attendance = parsed.attendance || [];
          this.marks = parsed.marks || [];
          this.exams = parsed.exams || [];
          this.timetables = parsed.timetables && Array.isArray(parsed.timetables)
            ? parsed.timetables.filter((t: any) => !isDummyTimetableEntry(t))
            : [];
          if (parsed.subjects && parsed.subjects.length > 0 && !parsed.subjects.some((s: any) => s.name === 'Bengali (1st Language)')) {
            this.subjects = parsed.subjects;
          } else {
            this.subjects = INITIAL_SUBJECTS;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  save() {
    // ONLY persist in localStorage when Supabase is NOT configured (Demo mode)
    if (typeof window !== 'undefined' && !isSupabaseConfigured) {
      localStorage.setItem(
        'rkvm_portal_store',
        JSON.stringify({
          classes: this.classes,
          sections: this.sections,
          profiles: this.profiles,
          students: this.students,
          teacherAssignments: this.teacherAssignments,
          parentLinks: this.parentLinks,
          notices: this.notices,
          attendance: this.attendance,
          marks: this.marks,
          exams: this.exams,
          timetables: this.timetables,
          subjects: this.subjects,
        })
      );
    }
  }
}

export const store = new PortalStore();

// ==========================================
// DATA API SERVICES
// ==========================================

const CLASS_SORT_ORDER: Record<string, number> = {
  play: 0,
  lkg: 1,
  ukg: 2,
  'class 1': 3,
  'class 2': 4,
  'class 3': 5,
  'class 4': 6,
  'class 5': 7,
  'class 6': 8,
  'class 7': 9,
  'class 8': 10,
  'class 9': 11,
  'class 10': 12,
};

export async function fetchClasses(): Promise<SchoolClass[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
      console.error('[Portal DB] Failed to fetch classes from Supabase:', error);
      throw new Error(`Failed to load classes: ${error.message}`);
    }
    let list: SchoolClass[] = data ? [...data] : [];

    // Guarantee 'Play' class exists even if Supabase was seeded prior to adding Play
    if (!list.some((c) => c.name?.trim().toLowerCase() === 'play')) {
      const playClass: SchoolClass = { id: 'c0', name: 'Play' };
      list.unshift(playClass);

      // Persist to Supabase in the background
      supabase
        .from('classes')
        .upsert([playClass], { onConflict: 'id' })
        .then(({ error: upsertErr }) => {
          if (upsertErr) {
            console.warn('[Portal DB] Auto-seed Play class to Supabase:', upsertErr.message);
          }
        });
    }

    return list.sort((a, b) => {
      const orderA = CLASS_SORT_ORDER[a.name.toLowerCase()] ?? 99;
      const orderB = CLASS_SORT_ORDER[b.name.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  }

  if (!store.classes.some((c) => c.name?.trim().toLowerCase() === 'play')) {
    store.classes = [{ id: 'c0', name: 'Play' }, ...store.classes];
    store.save();
  }
  return store.classes;
}

export async function addClass(className: string): Promise<SchoolClass> {
  const trimmed = className.trim();
  if (!trimmed) throw new Error('Class name is required');

  const safeId = 'c-' + Date.now().toString(36);
  const newCls: SchoolClass = {
    id: safeId,
    name: trimmed,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('classes').insert([newCls]).select().single();
    if (error) {
      console.error('[Portal DB] Failed to create class in Supabase:', error);
      throw new Error(`Failed to create class: ${error.message}`);
    }

    // Auto-create Section A and Section B for this class
    try {
      await supabase.from('sections').upsert([
        { id: `sec-${safeId}-a`, class_id: safeId, name: 'Section A' },
        { id: `sec-${safeId}-b`, class_id: safeId, name: 'Section B' },
      ], { onConflict: 'id' });
    } catch (e) {
      console.warn('[Portal DB] Notice: default sections auto-create:', e);
    }

    return data || newCls;
  }

  store.classes.push(newCls);
  store.sections.push(
    { id: `sec-${safeId}-a`, class_id: safeId, name: 'Section A' },
    { id: `sec-${safeId}-b`, class_id: safeId, name: 'Section B' }
  );
  store.save();
  return newCls;
}

export async function deleteClass(classId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) {
      console.error('[Portal DB] Failed to delete class in Supabase:', error);
      throw new Error(`Failed to delete class: ${error.message}`);
    }
    try {
      await supabase.from('sections').delete().eq('class_id', classId);
    } catch {}
    return true;
  }

  store.classes = store.classes.filter((c) => c.id !== classId);
  store.sections = store.sections.filter((s) => s.class_id !== classId);
  store.save();
  return true;
}

export async function fetchSections(classId?: string): Promise<Section[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('sections').select('*');
    if (classId) query = query.eq('class_id', classId);
    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch sections from Supabase:', error);
      throw new Error(`Failed to load sections: ${error.message}`);
    }
    return data || [];
  }
  if (classId) {
    return store.sections.filter((s) => s.class_id === classId);
  }
  return store.sections;
}

export async function fetchProfiles(role?: UserRole): Promise<Profile[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('profiles').select('*');
    if (role) query = query.eq('role', role);
    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch profiles from Supabase:', error);
      throw new Error(`Failed to load user profiles: ${error.message}`);
    }

    let profilesList: Profile[] = data ? [...data] : [];

    // If fetching teachers or all profiles, include any teachers from the teachers table
    if (!role || role === 'teacher') {
      try {
        const { data: tchData } = await supabase.from('teachers').select('*');
        if (tchData && tchData.length > 0) {
          const profMap = new Map(profilesList.map((p) => [p.id, p]));
          tchData.forEach((t: any) => {
            if (!profMap.has(t.id)) {
              profMap.set(t.id, { ...t, role: 'teacher' as UserRole });
            } else {
              // Merge latest teacher data
              profMap.set(t.id, { ...profMap.get(t.id)!, ...t, role: 'teacher' as UserRole });
            }
          });
          profilesList = Array.from(profMap.values());
        }
      } catch (e) {
        // Fall back gracefully if teachers table not queried
        console.warn('[Portal DB] teachers table query notice:', e);
      }
    }

    return profilesList;
  }
  if (role) {
    return store.profiles.filter((p) => p.role === role);
  }
  return store.profiles;
}

export async function syncProfilesToTeachersTable(teacherProfiles: Profile[]): Promise<void> {
  if (!isSupabaseConfigured || teacherProfiles.length === 0) return;
  try {
    const payload = teacherProfiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email && p.email !== 'NA' ? p.email : null,
      phone: p.phone || null,
      qualification: p.qualification || null,
      specialized_subject: p.specialized_subject || null,
      address: p.address || null,
      aadhar_number: p.aadhar_number || null,
      avatar_url: p.avatar_url || null,
      portal_password: p.portal_password,
      status: 'active',
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
    }));

    const { error } = await supabase.from('teachers').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback: try direct insert
      await supabase.from('teachers').insert(payload);
    }
  } catch (e) {
    console.warn('[Portal DB] syncProfilesToTeachersTable notice:', e);
  }
}

export async function fetchTeachers(): Promise<Profile[]> {
  if (isSupabaseConfigured) {
    const teacherMap = new Map<string, Profile>();

    // 1. Fetch from profiles table where role = 'teacher'
    try {
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher');
      if (!profErr && profData && Array.isArray(profData)) {
        profData.forEach((p: any) => {
          teacherMap.set(p.id, { ...p, role: 'teacher' as UserRole });
        });
      }
    } catch (e) {
      console.warn('[Portal DB] Querying profiles table for teachers warning:', e);
    }

    // 2. Fetch from teachers table
    try {
      const { data: tchData, error: tchErr } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tchErr && tchData && Array.isArray(tchData)) {
        tchData.forEach((t: any) => {
          const existing = teacherMap.get(t.id);
          teacherMap.set(t.id, {
            ...existing,
            ...t,
            role: 'teacher' as UserRole,
          });
        });
      }
    } catch (e) {
      console.warn('[Portal DB] Querying teachers table warning:', e);
    }

    // 3. Merge from local store and localStorage if any teachers are present
    store.profiles
      .filter((p) => p.role === 'teacher')
      .forEach((p) => {
        if (!teacherMap.has(p.id)) {
          teacherMap.set(p.id, p);
        }
      });

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rkvm_portal_store');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.profiles && Array.isArray(parsed.profiles)) {
            parsed.profiles
              .filter((p: any) => p.role === 'teacher')
              .forEach((p: any) => {
                if (!teacherMap.has(p.id)) {
                  teacherMap.set(p.id, p);
                }
              });
          }
        }
      } catch {}
    }

    const teacherProfiles = Array.from(teacherMap.values());
    if (teacherProfiles.length > 0) {
      return teacherProfiles;
    }
  }
  return store.profiles.filter((p) => p.role === 'teacher');
}

export async function fetchStudents(classId?: string, sectionId?: string): Promise<Student[]> {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('students')
      .select('*')
      .order('roll_number');

    if (classId) query = query.eq('class_id', classId);
    if (sectionId) query = query.eq('section_id', sectionId);

    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch students from Supabase:', error);
      throw new Error(`Failed to load students: ${error.message}`);
    }

    const [classes, sections] = await Promise.all([fetchClasses(), fetchSections()]);
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

    const enriched: Student[] = (data || []).map((st: any) => ({
      ...st,
      class_name: classMap.get(st.class_id) || st.class_name || 'Class',
      section_name: sectionMap.get(st.section_id) || st.section_name || 'Section',
    }));

    return enriched;
  }

  let result = store.students;
  if (classId) result = result.filter((s) => s.class_id === classId);
  if (sectionId) result = result.filter((s) => s.section_id === sectionId);
  return result;
}

export async function clearTeacherClasses(): Promise<void> {
  // teacher_classes table deleted as requested
  store.teacherAssignments = [];
  store.save();
}

export async function fetchTeacherClasses(_teacherId?: string) {
  const [classes, sections] = await Promise.all([fetchClasses(), fetchSections()]);
  const defaultSections: Section[] = [
    { id: 's-a', class_id: 'all', name: 'Section A' },
    { id: 's-b', class_id: 'all', name: 'Section B' },
  ];
  const activeSections = sections && sections.length > 0 ? sections : defaultSections;

  return classes.flatMap((cls) => {
    // Find sections specific to this class, or marked as 'all'
    const classSecs = activeSections.filter((s) => s.class_id === cls.id || s.class_id === 'all');
    const secsToUse = classSecs.length > 0 ? classSecs : defaultSections;
    return secsToUse.map((sec) => ({
      class_id: cls.id,
      section_id: sec.id,
      class_name: cls.name,
      section_name: sec.name,
    }));
  });
}

export async function fetchParentChildren(parentId: string): Promise<Student[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('parent_students')
      .select('*')
      .eq('parent_id', parentId);

    if (error) {
      console.error('[Portal DB] Failed to fetch parent student links from Supabase:', error);
      throw new Error(`Failed to load linked children: ${error.message}`);
    }

    const allStudents = await fetchStudents();

    if (data && data.length > 0) {
      const studentIds = data.map((item: any) => item.student_id);
      const matched = allStudents.filter((st) => studentIds.includes(st.id));
      if (matched.length > 0) return matched;
    }

    // Direct match: check if parentId is student ID or matching phone/email
    const directMatch = allStudents.filter(
      (st) =>
        st.id === parentId ||
        (st.phone && st.phone.replace(/\D/g, '') === parentId.replace(/\D/g, '')) ||
        (st.email && st.email.toLowerCase() === parentId.toLowerCase())
    );
    if (directMatch.length > 0) return directMatch;

    return allStudents;
  }

  const links = store.parentLinks.filter((pl) => pl.parent_id === parentId);
  const childIds = links.map((l) => l.student_id);
  if (childIds.length > 0) {
    return store.students.filter((st) => childIds.includes(st.id));
  }
  return store.students;
}

// Indian Timezone & Routine Helpers
export function getIndiaLocalDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function getIndiaDayOfWeek(date: Date = new Date()): DayOfWeek | 'Sunday' {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(date) as DayOfWeek | 'Sunday';
  } catch {
    const days: (DayOfWeek | 'Sunday')[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
}

export function matchTeacher(
  entry: ClassTimetableEntry,
  targetId?: string,
  targetName?: string
): boolean {
  if (!entry) return false;
  const eId = entry.teacher_id?.trim().toLowerCase();
  const eName = entry.teacher_name?.trim().toLowerCase();
  const tId = targetId?.trim().toLowerCase();
  const tName = targetName?.trim().toLowerCase();

  // 1. Direct ID match
  if (tId && eId && (eId === tId || eId.includes(tId) || tId.includes(eId))) return true;

  // 2. Direct Name match (case-insensitive & trimmed)
  if (tName && eName) {
    if (eName === tName) return true;
    const clean = (s: string) =>
      s
        .replace(/^(smt\.?|shri\.?|sri\.?|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+/i, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const cE = clean(eName);
    const cT = clean(tName);
    if (cE && cT) {
      if (cE === cT) return true;
      if (cE.includes(cT) || cT.includes(cE)) return true;
    }
  }

  return false;
}

export async function fetchTeacherTodayRoutine(
  teacherIdentifier: { id?: string; name?: string },
  dayOfWeek?: DayOfWeek | string
): Promise<ClassTimetableEntry[]> {
  const currentDay = (dayOfWeek || getIndiaDayOfWeek()) as string;
  if (currentDay === 'Sunday') return [];

  const allEntries = await fetchClassTimetables(undefined, currentDay);
  return allEntries
    .filter((e) => e.day_of_week === currentDay && matchTeacher(e, teacherIdentifier.id, teacherIdentifier.name))
    .sort((a, b) => (Number(a.period_number) || 0) - (Number(b.period_number) || 0));
}

export async function fetchTeacherWeeklyRoutine(
  teacherIdentifier: { id?: string; name?: string }
): Promise<ClassTimetableEntry[]> {
  const allEntries = await fetchClassTimetables();
  return allEntries
    .filter((e) => matchTeacher(e, teacherIdentifier.id, teacherIdentifier.name))
    .sort((a, b) => {
      const dA = DAY_ORDER[a.day_of_week] || 0;
      const dB = DAY_ORDER[b.day_of_week] || 0;
      if (dA !== dB) return dA - dB;
      return (Number(a.period_number) || 0) - (Number(b.period_number) || 0);
    });
}

export async function fetchTeacherAuthorizedPeriod1Classes(
  teacherIdentifier: { id?: string; name?: string },
  dayOfWeek?: DayOfWeek | string
): Promise<ClassTimetableEntry[]> {
  const routine = await fetchTeacherTodayRoutine(teacherIdentifier, dayOfWeek);
  return routine.filter((e) => Number(e.period_number) === 1);
}

export async function fetchAttendance(filters: {
  date?: string;
  startDate?: string;
  endDate?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  teacherId?: string;
  status?: AttendanceStatus | 'all';
  isLate?: boolean;
}): Promise<AttendanceRecord[]> {
  const attendanceMap = new Map<string, AttendanceRecord>();

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      const isoDate = filters.date ? parseDateToISO(filters.date) : undefined;
      const isoStart = filters.startDate ? parseDateToISO(filters.startDate) : undefined;
      const isoEnd = filters.endDate ? parseDateToISO(filters.endDate) : undefined;

      if (isoDate) query = query.eq('date', isoDate);
      if (isoStart) query = query.gte('date', isoStart);
      if (isoEnd) query = query.lte('date', isoEnd);
      if (filters.classId && filters.classId !== 'all') query = query.eq('class_id', filters.classId);
      if (filters.sectionId && filters.sectionId !== 'all') query = query.eq('section_id', filters.sectionId);
      if (filters.studentId) query = query.eq('student_id', filters.studentId);
      if (filters.teacherId && filters.teacherId !== 'all') query = query.eq('marked_by', filters.teacherId);
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        data.forEach((att: any) => {
          const key = `${att.student_id}_${att.date}`;
          attendanceMap.set(key, {
            ...att,
            is_late: att.status === 'present' ? Boolean(att.is_late) : false,
          });
        });
      } else if (error) {
        console.warn('[Portal DB] Querying attendance notice:', error.message);
      }
    } catch (e) {
      console.warn('[Portal DB] Exception querying attendance from Supabase:', e);
    }
  }

  // Merge from store.attendance
  store.attendance.forEach((att) => {
    const key = `${att.student_id}_${att.date}`;
    if (!attendanceMap.has(key)) {
      attendanceMap.set(key, {
        ...att,
        is_late: att.status === 'present' ? Boolean(att.is_late) : false,
      });
    } else {
      // Retain is_late from local store if remote doesn't have it yet
      const existing = attendanceMap.get(key)!;
      if (att.is_late && !existing.is_late && existing.status === 'present') {
        existing.is_late = true;
      }
      if (att.timetable_id && !existing.timetable_id) {
        existing.timetable_id = att.timetable_id;
      }
    }
  });

  // Merge from localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.attendance && Array.isArray(parsed.attendance)) {
          parsed.attendance.forEach((att: any) => {
            const key = `${att.student_id}_${att.date}`;
            if (!attendanceMap.has(key)) {
              attendanceMap.set(key, {
                ...att,
                is_late: att.status === 'present' ? Boolean(att.is_late) : false,
              });
            }
          });
        }
      }
    } catch {}
  }

  let result = Array.from(attendanceMap.values());
  const isoDate = filters.date ? parseDateToISO(filters.date) : undefined;
  const isoStart = filters.startDate ? parseDateToISO(filters.startDate) : undefined;
  const isoEnd = filters.endDate ? parseDateToISO(filters.endDate) : undefined;

  if (isoDate) result = result.filter((a) => a.date === isoDate || a.date === filters.date);
  if (isoStart) result = result.filter((a) => a.date >= isoStart);
  if (isoEnd) result = result.filter((a) => a.date <= isoEnd);
  if (filters.classId && filters.classId !== 'all') result = result.filter((a) => a.class_id === filters.classId);
  if (filters.sectionId && filters.sectionId !== 'all') result = result.filter((a) => a.section_id === filters.sectionId);
  if (filters.studentId) result = result.filter((a) => a.student_id === filters.studentId);
  if (filters.teacherId && filters.teacherId !== 'all') result = result.filter((a) => a.marked_by === filters.teacherId);
  if (filters.status && filters.status !== 'all') result = result.filter((a) => a.status === filters.status);
  if (filters.isLate !== undefined) result = result.filter((a) => Boolean(a.is_late) === filters.isLate);

  // Sort descending by date
  result.sort((a, b) => b.date.localeCompare(a.date));

  const [students, classes, sections, profiles] = await Promise.all([
    fetchStudents(),
    fetchClasses(),
    fetchSections(),
    fetchProfiles(),
  ]);
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const sectionMap = new Map(sections.map((s) => [s.id, s.name]));
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));

  return result.map((att: any) => {
    const st = studentMap.get(att.student_id) || store.students.find((s) => s.id === att.student_id);
    const clsName = classMap.get(att.class_id) || att.class_name || 'Class';
    const secName = sectionMap.get(att.section_id) || att.section_name || 'Section A';
    const teacherName = profileMap.get(att.marked_by) || att.marked_by_name || att.teacher_name || 'Teacher';

    return {
      ...att,
      student_name: st ? `${st.first_name} ${st.last_name}`.trim() : (att.student_name || 'Student'),
      roll_number: st ? st.roll_number : (att.roll_number || '01'),
      class_name: clsName,
      section_name: secName,
      marked_by_name: teacherName,
      teacher_name: teacherName,
      is_late: att.status === 'present' ? Boolean(att.is_late) : false,
    };
  });
}

export async function submitAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'created_at'>[]) {
  if (records.length === 0) return true;

  // Enforce strict business rule: Late can ONLY be true when status === 'present'
  const normalizedRecords = records.map((r) => ({
    ...r,
    status: r.status,
    is_late: r.status === 'present' ? Boolean(r.is_late) : false,
    timetable_id: r.timetable_id || null,
  }));

  // Update in-memory store and localStorage first to ensure local reliability
  normalizedRecords.forEach((newRec) => {
    const idx = store.attendance.findIndex(
      (a) => a.student_id === newRec.student_id && a.date === newRec.date
    );
    const fullRec: AttendanceRecord = {
      ...newRec,
      id: idx >= 0 ? store.attendance[idx].id : `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: idx >= 0 && store.attendance[idx].created_at ? store.attendance[idx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      store.attendance[idx] = fullRec;
    } else {
      store.attendance.push(fullRec);
    }
  });
  store.save();

  if (isSupabaseConfigured) {
    try {
      // First attempt: upsert with all columns including is_late and timetable_id
      const { error } = await supabase
        .from('attendance')
        .upsert(normalizedRecords, { onConflict: 'student_id,date' });

      if (error) {
        console.warn('[Portal DB] Full attendance upsert error, attempting fallback without new columns:', error.message);
        // Fallback: strip is_late and timetable_id if table schema doesn't have them yet
        const baseRecords = normalizedRecords.map(({ is_late, timetable_id, ...rest }: any) => rest);
        const { error: fallbackErr } = await supabase
          .from('attendance')
          .upsert(baseRecords, { onConflict: 'student_id,date' });

        if (fallbackErr) {
          console.warn('[Portal DB] Supabase attendance fallback error (preserved locally):', fallbackErr.message);
        }
      }
    } catch (err: any) {
      console.warn('[Portal DB] Exception saving attendance to Supabase (preserved locally):', err);
    }
  }

  return true;
}

export async function deleteAttendanceRecord(id: string) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) {
      console.error('[Portal DB] Failed to delete attendance record from Supabase:', error);
      throw new Error(`Failed to delete attendance: ${error.message}`);
    }
    return true;
  }
  store.attendance = store.attendance.filter((a) => a.id !== id);
  store.save();
  return true;
}

const VALID_STUDENT_COLUMNS = new Set([
  'id',
  'roll_number',
  'first_name',
  'last_name',
  'phone',
  'alt_phone',
  'email',
  'date_of_birth',
  'gender',
  'class_id',
  'section_id',
  'father_name',
  'father_occupation',
  'mother_name',
  'mother_occupation',
  'address',
  'aadhar_number',
  'portal_password',
  'avatar_url',
  'pending_avatar_url',
  'pending_avatar_status',
  'status',
  'created_at',
  'updated_at',
]);

const VALID_PROFILE_COLUMNS = new Set([
  'id',
  'email',
  'full_name',
  'role',
  'phone',
  'avatar_url',
  'pending_avatar_url',
  'pending_avatar_status',
  'portal_password',
  'address',
  'qualification',
  'specialized_subject',
  'aadhar_number',
  'created_at',
  'updated_at',
]);

const VALID_TEACHER_COLUMNS = new Set([
  'id',
  'full_name',
  'email',
  'phone',
  'qualification',
  'specialized_subject',
  'address',
  'aadhar_number',
  'avatar_url',
  'portal_password',
  'status',
  'created_at',
  'updated_at',
]);


function sanitizeStudentPayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_STUDENT_COLUMNS.has(key) && value !== undefined) {
      if (key === 'date_of_birth' && typeof value === 'string' && value.trim()) {
        sanitized[key] = parseDateToISO(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

function sanitizeProfilePayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_PROFILE_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function addStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
  const generatedEmail = studentData.phone
    ? `${studentData.phone.replace(/\D/g, '')}@rkvmschool.in`
    : (studentData.email || `${studentData.first_name.toLowerCase().replace(/\s+/g, '')}.st@rkvmschool.in`);
  const generatedPassword = studentData.portal_password || generateDefaultPassword(studentData.first_name, studentData.date_of_birth);
  const now = new Date().toISOString();

  // Generate clean sequential Student ID (e.g. Std-1, Std-2, Std-3)
  let newStudentId = (studentData as any).id;
  if (!newStudentId) {
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase.from('students').select('id');
        let nextNum = 1;
        if (existing && existing.length > 0) {
          const nums = existing
            .map((s) => {
              const match = String(s.id).match(/^(?:Std|std|st)-?(\d+)$/i);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n) && n > 0);
          nextNum = nums.length > 0 ? Math.max(...nums) + 1 : existing.length + 1;
        }
        newStudentId = `Std-${nextNum}`;
      } catch {
        newStudentId = `Std-${Date.now()}`;
      }
    } else {
      const nums = store.students
        .map((s) => {
          const match = String(s.id).match(/^(?:Std|std|st)-?(\d+)$/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : store.students.length + 1;
      newStudentId = `Std-${nextNum}`;
    }
  }

  const newStudent: Student = {
    ...studentData,
    id: newStudentId,
    email: generatedEmail,
    portal_password: generatedPassword,
    created_at: now,
    updated_at: now,
  };

  // Student Profile for portal authentication
  const studentProfile: Profile = {
    id: newStudent.id,
    email: generatedEmail,
    full_name: `${studentData.first_name} ${studentData.last_name}`.trim(),
    phone: studentData.phone,
    role: 'parent',
    portal_password: generatedPassword,
    avatar_url: studentData.avatar_url,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const dbPayload = sanitizeStudentPayload(newStudent);
    
    const { data, error } = await supabase.from('students').insert([dbPayload]).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to insert student in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to enroll student.'}`);
    }

    // Also sync the profile in Supabase profiles table for unified multi-device login
    try {
      const sanitizedProfile = sanitizeProfilePayload(studentProfile);
      await supabase.from('profiles').upsert([sanitizedProfile], { onConflict: 'id' });
    } catch (profErr) {
      console.warn('[Portal DB] Profile sync warning for student:', profErr);
    }
    
    const classes = await fetchClasses();
    const sections = await fetchSections();
    const cls = classes.find((c) => c.id === data.class_id);
    const sec = sections.find((s) => s.id === data.section_id);

    return { ...data, class_name: cls?.name, section_name: sec?.name };
  }

  // Offline / Demo fallback
  const cls = store.classes.find((c) => c.id === studentData.class_id);
  const sec = store.sections.find((s) => s.id === studentData.section_id);
  newStudent.class_name = cls?.name;
  newStudent.section_name = sec?.name;

  const pIdx = store.profiles.findIndex((p) => p.email.toLowerCase() === generatedEmail.toLowerCase() || p.id === newStudent.id);
  if (pIdx >= 0) store.profiles[pIdx] = studentProfile;
  else store.profiles.push(studentProfile);

  store.students.push(newStudent);
  store.save();
  return newStudent;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  if (isSupabaseConfigured) {
    const dbPayload = sanitizeStudentPayload({
      ...updates,
      updated_at: new Date().toISOString(),
    });
    
    const { data, error } = await supabase.from('students').update(dbPayload).eq('id', id).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to update student in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to update student.'}`);
    }

    // Also keep profiles table in Supabase in sync
    try {
      const profileUpdates: Partial<Profile> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.first_name || updates.last_name) {
        profileUpdates.full_name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
      }
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (updates.email !== undefined) profileUpdates.email = updates.email;
      if (updates.portal_password !== undefined) profileUpdates.portal_password = updates.portal_password;
      if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
      if (updates.pending_avatar_url !== undefined) profileUpdates.pending_avatar_url = updates.pending_avatar_url;
      if (updates.pending_avatar_status !== undefined) profileUpdates.pending_avatar_status = updates.pending_avatar_status;

      const sanitizedProfileUpdates = sanitizeProfilePayload(profileUpdates);
      if (Object.keys(sanitizedProfileUpdates).length > 1) {
        await supabase.from('profiles').update(sanitizedProfileUpdates).eq('id', id);
      }
    } catch (e) {
      console.warn('[Portal DB] Profile sync on student update warning:', e);
    }

    const classes = await fetchClasses();
    const sections = await fetchSections();
    const cls = classes.find((c) => c.id === data.class_id);
    const sec = sections.find((s) => s.id === data.section_id);
    return { ...data, class_name: cls?.name, section_name: sec?.name };
  }

  // Offline / Demo fallback
  const idx = store.students.findIndex((s) => s.id === id);
  if (idx >= 0) {
    store.students[idx] = { ...store.students[idx], ...updates };
    const cls = store.classes.find((c) => c.id === store.students[idx].class_id);
    const sec = store.sections.find((s) => s.id === store.students[idx].section_id);
    store.students[idx].class_name = cls?.name;
    store.students[idx].section_name = sec?.name;

    // Keep profile synced
    const pIdx = store.profiles.findIndex((p) => p.id === id || p.email.toLowerCase() === store.students[idx].email?.toLowerCase());
    if (pIdx >= 0) {
      if (updates.first_name || updates.last_name) {
        store.profiles[pIdx].full_name = `${store.students[idx].first_name} ${store.students[idx].last_name}`.trim();
      }
      if (updates.phone) store.profiles[pIdx].phone = updates.phone;
      if (updates.portal_password) store.profiles[pIdx].portal_password = updates.portal_password;
      if (updates.avatar_url !== undefined) store.profiles[pIdx].avatar_url = updates.avatar_url;
      if (updates.pending_avatar_url !== undefined) store.profiles[pIdx].pending_avatar_url = updates.pending_avatar_url;
      if (updates.pending_avatar_status !== undefined) store.profiles[pIdx].pending_avatar_status = updates.pending_avatar_status;
    }

    store.save();
    return store.students[idx];
  }
  throw new Error('Student not found');
}

export async function requestStudentPhotoChange(studentId: string, photoUrl: string): Promise<Student> {
  const updates: Partial<Student> = {
    pending_avatar_url: photoUrl,
    pending_avatar_status: 'pending',
  };
  return updateStudent(studentId, updates);
}

export async function approveStudentPhotoChange(studentId: string): Promise<Student> {
  const allStudents = await fetchStudents();
  const st = allStudents.find((s) => s.id === studentId);
  if (!st || !st.pending_avatar_url) throw new Error('No pending photo found for this student');

  const updates: any = {
    avatar_url: st.pending_avatar_url,
    pending_avatar_url: null,
    pending_avatar_status: 'approved',
  };
  return updateStudent(studentId, updates);
}

export async function rejectStudentPhotoChange(studentId: string): Promise<Student> {
  const updates: any = {
    pending_avatar_url: null,
    pending_avatar_status: 'rejected',
  };
  return updateStudent(studentId, updates);
}

export async function deleteStudent(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const results = await Promise.all([
      supabase.from('students').delete().eq('id', id),
      supabase.from('profiles').delete().eq('id', id),
      supabase.from('attendance').delete().eq('student_id', id),
      supabase.from('parent_students').delete().eq('student_id', id),
    ]);

    const failed = results.find((r) => r.error);
    if (failed && failed.error) {
      console.error('[Portal DB] Failed to delete student from Supabase:', failed.error);
      throw new Error(`Failed to remove student: ${failed.error.message}`);
    }
    return true;
  }

  // Offline / Demo fallback
  store.students = store.students.filter((s) => s.id !== id);
  store.profiles = store.profiles.filter((p) => p.id !== id);
  store.attendance = store.attendance.filter((a) => a.student_id !== id);
  store.save();
  return true;
}

export async function addProfile(profileData: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
  let generatedPassword = profileData.portal_password;
  if (!generatedPassword) {
    if (profileData.role === 'teacher') {
      generatedPassword = generateTeacherDefaultPassword(profileData.full_name);
    } else {
      generatedPassword = generateDefaultPassword(profileData.full_name, '2011');
    }
  }
  const now = new Date().toISOString();

  // Normalize phone digits
  const cleanPhone = (profileData.phone || '').replace(/\D/g, '');

  // Ensure unique, valid RFC email for database storage (avoid duplicate key violations on 'NA' or empty)
  let finalEmail = profileData.email?.trim();
  if (!finalEmail || finalEmail.toUpperCase() === 'NA') {
    if (cleanPhone) {
      finalEmail = `${cleanPhone}@rkvmschool.in`;
    } else {
      const slug = profileData.full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      finalEmail = `${slug || 'user'}.${Date.now()}@rkvmschool.in`;
    }
  }

  // Generate clean sequential Teacher ID (e.g. Tchr-1, Tchr-2) or clean role ID
  let newId = (profileData as any).id;
  if (!newId) {
    if (profileData.role === 'teacher') {
      if (isSupabaseConfigured) {
        try {
          const [profRes, tchRes] = await Promise.allSettled([
            supabase.from('profiles').select('id').eq('role', 'teacher'),
            supabase.from('teachers').select('id'),
          ]);
          const existingIds: string[] = [];
          if (profRes.status === 'fulfilled' && profRes.value.data && Array.isArray(profRes.value.data)) {
            profRes.value.data.forEach((p: any) => existingIds.push(p.id));
          }
          if (tchRes.status === 'fulfilled' && tchRes.value.data && Array.isArray(tchRes.value.data)) {
            tchRes.value.data.forEach((t: any) => existingIds.push(t.id));
          }
          store.profiles.filter((p) => p.role === 'teacher').forEach((p) => existingIds.push(p.id));

          let nextNum = 1;
          if (existingIds.length > 0) {
            const nums = existingIds
              .map((id) => {
                const match = String(id).match(/^(?:Tchr|tchr|t)-?(\d+)$/i);
                return match ? parseInt(match[1], 10) : 0;
              })
              .filter((n) => !isNaN(n) && n > 0);
            nextNum = nums.length > 0 ? Math.max(...nums) + 1 : existingIds.length + 1;
          }
          newId = `Tchr-${nextNum}`;
        } catch {
          newId = `Tchr-${Date.now()}`;
        }
      } else {
        const teachers = store.profiles.filter((p) => p.role === 'teacher');
        const nums = teachers
          .map((p) => {
            const match = String(p.id).match(/^(?:Tchr|tchr|t)-?(\d+)$/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => !isNaN(n) && n > 0);
        const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : teachers.length + 1;
        newId = `Tchr-${nextNum}`;
      }
    } else {
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      newId = `u-${profileData.role}-${Date.now()}-${uniqueSuffix}`;
    }
  }

  const newProf: Profile = {
    ...profileData,
    id: newId,
    email: finalEmail,
    portal_password: generatedPassword,
    created_at: now,
    updated_at: now,
  };

  // Always keep in local memory store for instant UI reactivity
  const existingIdx = store.profiles.findIndex((p) => p.id === newProf.id);
  if (existingIdx >= 0) {
    store.profiles[existingIdx] = newProf;
  } else {
    store.profiles.push(newProf);
  }
  store.save();

  if (isSupabaseConfigured) {
    let teacherSaved = false;
    let profileSaved = false;
    let returnedRecord: Profile = { ...newProf };
    const errorDetails: string[] = [];

    // Step 1: Insert into profiles table FIRST (core user profile)
    try {
      const sanitized = sanitizeProfilePayload(newProf);
      const { data: profData, error: profErr } = await supabase.from('profiles').insert([sanitized]).select().single();
      if (!profErr && profData) {
        profileSaved = true;
        returnedRecord = { ...returnedRecord, ...profData };
      } else {
        if (profErr) {
          console.warn('[Portal DB] Initial profiles insert error:', profErr.message);
          errorDetails.push(`profiles: ${profErr.message}`);
        }
        // Fallback A: Core profile fields only (id, email, full_name, role, phone, portal_password)
        const coreProfile = {
          id: newProf.id,
          email: finalEmail,
          full_name: newProf.full_name,
          role: newProf.role,
          phone: newProf.phone || null,
          portal_password: newProf.portal_password,
          created_at: now,
          updated_at: now,
        };
        const { data: coreData, error: coreErr } = await supabase.from('profiles').insert([coreProfile]).select().single();
        if (!coreErr && coreData) {
          profileSaved = true;
          returnedRecord = { ...returnedRecord, ...coreData };
        } else {
          if (coreErr) {
            console.warn('[Portal DB] Core profile insert error:', coreErr.message);
            errorDetails.push(`profiles_core: ${coreErr.message}`);
          }
          // Fallback B: Basic profile without portal_password column
          const basicProfile = {
            id: newProf.id,
            email: finalEmail,
            full_name: newProf.full_name,
            role: newProf.role,
            phone: newProf.phone || null,
            created_at: now,
            updated_at: now,
          };
          const { data: basicData, error: basicErr } = await supabase.from('profiles').insert([basicProfile]).select().single();
          if (!basicErr && basicData) {
            profileSaved = true;
            returnedRecord = { ...returnedRecord, ...basicData };
          } else if (basicErr) {
            errorDetails.push(`profiles_basic: ${basicErr.message}`);
          }
        }
      }
    } catch (err: any) {
      console.warn('[Portal DB] Exception during profiles table insert:', err);
      errorDetails.push(`profiles_exception: ${err?.message || err}`);
    }

    // Step 2: Insert into teachers table (if role is teacher)
    if (profileData.role === 'teacher') {
      try {
        const teacherPayload: Record<string, any> = {
          id: newProf.id,
          full_name: newProf.full_name,
          email: finalEmail,
          phone: newProf.phone || null,
          qualification: newProf.qualification || null,
          specialized_subject: newProf.specialized_subject || null,
          address: newProf.address || null,
          aadhar_number: newProf.aadhar_number || null,
          avatar_url: newProf.avatar_url || null,
          portal_password: newProf.portal_password,
          status: 'active',
          created_at: now,
          updated_at: now,
        };
        const { data: tchData, error: tchErr } = await supabase.from('teachers').insert([teacherPayload]).select().single();
        if (!tchErr) {
          teacherSaved = true;
          if (tchData) returnedRecord = { ...returnedRecord, ...tchData };
        } else {
          console.warn('[Portal DB] Full teachers insert error:', tchErr.message);
          errorDetails.push(`teachers: ${tchErr.message}`);
          // Fallback A: Core teacher payload (no optional columns)
          const coreTeacherPayload = {
            id: newProf.id,
            full_name: newProf.full_name,
            phone: newProf.phone || null,
            email: finalEmail,
            portal_password: newProf.portal_password,
            status: 'active',
            created_at: now,
            updated_at: now,
          };
          const { data: insData, error: insErr } = await supabase.from('teachers').insert([coreTeacherPayload]).select().single();
          if (!insErr) {
            teacherSaved = true;
            if (insData) returnedRecord = { ...returnedRecord, ...insData };
          } else {
            console.warn('[Portal DB] Core teachers insert error:', insErr.message);
            errorDetails.push(`teachers_core: ${insErr.message}`);
            // Fallback B: Basic teacher payload without portal_password or status
            const basicTeacherPayload = {
              id: newProf.id,
              full_name: newProf.full_name,
              phone: newProf.phone || null,
              email: finalEmail,
              created_at: now,
              updated_at: now,
            };
            const { data: basicTchData, error: basicTchErr } = await supabase.from('teachers').insert([basicTeacherPayload]).select().single();
            if (!basicTchErr) {
              teacherSaved = true;
              if (basicTchData) returnedRecord = { ...returnedRecord, ...basicTchData };
            } else if (basicTchErr) {
              errorDetails.push(`teachers_basic: ${basicTchErr.message}`);
            }
          }
        }
      } catch (tchErr: any) {
        console.warn('[Portal DB] Exception during teachers table insert:', tchErr);
        errorDetails.push(`teachers_exception: ${tchErr?.message || tchErr}`);
      }
    }

    // Always persist to localStorage as hybrid fallback so data is never lost across reloads
    if (typeof window !== 'undefined') {
      try {
        const savedStore = localStorage.getItem('rkvm_portal_store');
        const parsed = savedStore ? JSON.parse(savedStore) : {};
        const pList = parsed.profiles || [];
        const existingIdx = pList.findIndex((p: any) => p.id === newProf.id);
        if (existingIdx >= 0) {
          pList[existingIdx] = returnedRecord;
        } else {
          pList.push(returnedRecord);
        }
        parsed.profiles = pList;
        localStorage.setItem('rkvm_portal_store', JSON.stringify(parsed));
      } catch (storageErr) {
        console.warn('[Portal DB] LocalStorage backup notice:', storageErr);
      }
    }

    if (!teacherSaved && !profileSaved) {
      const distinctErrors = Array.from(new Set(errorDetails)).join('; ');
      console.error('[Portal DB] Failed to save teacher to Supabase:', distinctErrors);

      const isRecursionError = distinctErrors.toLowerCase().includes('stack depth limit exceeded');
      if (isRecursionError) {
        console.warn(
          '[Portal DB] Notice: Supabase database has circular trigger recursion (trg_sync_teacher_to_profile <-> trg_sync_profile_to_teacher). Teacher account saved locally.'
        );
        return returnedRecord;
      }

      throw new Error(`Database error: ${distinctErrors || 'Failed to save teacher to Supabase.'}`);
    }

    return returnedRecord;
  }

  return newProf;
}

export async function deleteProfile(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await Promise.allSettled([
      supabase.from('profiles').delete().eq('id', id),
      supabase.from('teachers').delete().eq('id', id),
    ]);
    return true;
  }

  const pIdx = store.profiles.findIndex((p) => p.id === id);
  if (pIdx >= 0) {
    store.profiles.splice(pIdx, 1);
    store.save();
  }
  return true;
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const sanitized: Record<string, any> = { updated_at: now };
    for (const [k, v] of Object.entries(updates)) {
      if (VALID_PROFILE_COLUMNS.has(k) && v !== undefined) {
        if (k === 'email' && (v === 'NA' || !v || String(v).trim().toUpperCase() === 'NA')) {
          const phone = updates.phone || store.profiles.find((p) => p.id === id)?.phone;
          const cleanPhone = (phone || '').replace(/\D/g, '');
          sanitized[k] = cleanPhone ? `${cleanPhone}@rkvmschool.in` : `${id.toLowerCase()}@rkvmschool.in`;
        } else {
          sanitized[k] = v;
        }
      }
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('[Portal DB] Full update error in Supabase, trying fallback core columns:', error);
      const fallbackSanitized: Record<string, any> = { updated_at: now };
      ['full_name', 'email', 'phone', 'avatar_url', 'portal_password'].forEach((col) => {
        if (sanitized[col] !== undefined) {
          fallbackSanitized[col] = sanitized[col];
        }
      });
      await supabase.from('profiles').update(fallbackSanitized).eq('id', id);
    }

    // Also sync to teachers table
    try {
      const teacherUpdates: Record<string, any> = { updated_at: now };
      for (const [k, v] of Object.entries(updates)) {
        if (VALID_TEACHER_COLUMNS.has(k) && v !== undefined) {
          teacherUpdates[k] = v;
        }
      }
      if (Object.keys(teacherUpdates).length > 1) {
        await supabase.from('teachers').update(teacherUpdates).eq('id', id);
      }
    } catch (e) {
      console.warn('[Portal DB] Syncing update to teachers table warning:', e);
    }

    const pIdx = store.profiles.findIndex((p) => p.id === id);
    if (pIdx >= 0) {
      store.profiles[pIdx] = { ...store.profiles[pIdx], ...updates, updated_at: now };
      store.save();
    }
    return data || { ...store.profiles.find((p) => p.id === id)!, ...updates, id };
  }

  // Offline / Demo fallback
  const pIdx = store.profiles.findIndex((p) => p.id === id);
  if (pIdx >= 0) {
    store.profiles[pIdx] = { ...store.profiles[pIdx], ...updates, updated_at: now };
    store.save();
    return store.profiles[pIdx];
  }
  throw new Error('Profile not found');
}

export async function updateUserPassword(targetId: string, newPassword: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    const results = await Promise.allSettled([
      supabase.from('students').update({ portal_password: newPassword, updated_at: now }).eq('id', targetId),
      supabase.from('profiles').update({ portal_password: newPassword, updated_at: now }).eq('id', targetId),
      supabase.from('teachers').update({ portal_password: newPassword, updated_at: now }).eq('id', targetId),
    ]);

    const hasSuccess = results.some((r) => r.status === 'fulfilled');
    if (!hasSuccess) {
      throw new Error('Failed to update password in database.');
    }
    return true;
  }

  let updated = false;
  const pIdx = store.profiles.findIndex((p) => p.id === targetId || p.email.toLowerCase() === targetId.toLowerCase());
  if (pIdx >= 0) {
    store.profiles[pIdx].portal_password = newPassword;
    updated = true;
  }

  const sIdx = store.students.findIndex((s) => s.id === targetId || s.email?.toLowerCase() === targetId.toLowerCase());
  if (sIdx >= 0) {
    store.students[sIdx].portal_password = newPassword;
    updated = true;
  }

  if (updated) {
    store.save();
  }
  return updated;
}

export async function linkParentToStudent(parentId: string, studentId: string, relationship = 'Parent/Guardian') {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('parent_students').insert([{ parent_id: parentId, student_id: studentId, relationship }]);
    if (error) {
      console.error('[Portal DB] Failed to link parent to student in Supabase:', error);
      throw new Error(`Failed to link parent to student: ${error.message}`);
    }
    return;
  }

  const exists = store.parentLinks.some((l) => l.parent_id === parentId && l.student_id === studentId);
  if (!exists) {
    store.parentLinks.push({
      id: `pl-${Date.now()}`,
      parent_id: parentId,
      student_id: studentId,
      relationship,
    });
    store.save();
  }
}

export async function assignTeacherToClass(_teacherId?: string, _classId?: string, _sectionId?: string): Promise<void> {
  // Not needed: Teachers have access to all classes across the school
  return;
}

export async function fetchNotices(role?: UserRole): Promise<Notice[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Portal DB] Failed to fetch notices from Supabase:', error);
      throw new Error(`Failed to load notices: ${error.message}`);
    }

    const profiles = await fetchProfiles();
    const profMap = new Map(profiles.map((p) => [p.id, p.full_name]));

    let list: Notice[] = (data || []).map((n: any) => ({
      ...n,
      author_name: profMap.get(n.created_by) || n.author_name || 'Admin',
    }));

    if (role && role !== 'admin') {
      list = list.filter((n: any) => n.target_role === 'all' || n.target_role === role);
    }

    return list;
  }

  if (role && role !== 'admin') {
    return store.notices.filter((n) => n.target_role === 'all' || n.target_role === role);
  }
  return store.notices;
}

export async function addNotice(noticeData: Omit<Notice, 'id' | 'created_at'>): Promise<Notice> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('notices').insert([noticeData]).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to add notice to Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to create notice.'}`);
    }
    return data;
  }

  const newNotice: Notice = {
    ...noticeData,
    id: `n-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  store.notices.unshift(newNotice);
  store.save();
  return newNotice;
}

export async function deleteNotice(id: string) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      console.error('[Portal DB] Failed to delete notice from Supabase:', error);
      throw new Error(`Failed to delete notice: ${error.message}`);
    }
    return;
  }
  store.notices = store.notices.filter((n) => n.id !== id);
  store.save();
}

// ==========================================
// EXCEL EXPORT SERVICE
// ==========================================

export async function exportAttendanceToExcel(records: AttendanceRecord[], filenamePrefix = 'RKVM_Attendance_Report') {
  const xlsxPkgName = 'xlsx';
  let XLSX: any = null;

  try {
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ xlsxPkgName).catch(() => null);
    if (mod) XLSX = mod.default || mod;
  } catch {
    // Fallback
  }

  if (XLSX && XLSX.utils) {
    const formattedData = records.map((rec) => ({
      'Date': formatDateDDMMYYYY(rec.date),
      'Class': rec.class_name || 'N/A',
      'Section': rec.section_name || 'N/A',
      'Roll Number': rec.roll_number || 'N/A',
      'Student Name': rec.student_name || 'N/A',
      'Status': rec.status.toUpperCase(),
      'Late (Yes/No)': rec.is_late && rec.status === 'present' ? 'Yes' : 'No',
      'Marked By (Teacher)': rec.marked_by_name || rec.teacher_name || 'Teacher/Admin',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const colWidths = [
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 24 },
      { wch: 12 },
      { wch: 14 },
      { wch: 24 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    XLSX.writeFile(workbook, `${filenamePrefix}_${formatDateDDMMYYYY(new Date())}.xlsx`);
    return;
  }

  // Native UTF-8 BOM CSV Export (Excel Compatible)
  const headers = ['Date', 'Class', 'Section', 'Roll Number', 'Student Name', 'Status', 'Late (Yes/No)', 'Marked By (Teacher)'];
  const rows = records.map((rec) => [
    formatDateDDMMYYYY(rec.date),
    `"${(rec.class_name || '').replace(/"/g, '""')}"`,
    `"${(rec.section_name || '').replace(/"/g, '""')}"`,
    `"${(rec.roll_number || '').replace(/"/g, '""')}"`,
    `"${(rec.student_name || '').replace(/"/g, '""')}"`,
    rec.status.toUpperCase(),
    rec.is_late && rec.status === 'present' ? 'Yes' : 'No',
    `"${(rec.marked_by_name || rec.teacher_name || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${formatDateDDMMYYYY(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// STUDENT MARKS & ACADEMIC SERVICES
// ==========================================

const VALID_STUDENT_MARK_COLUMNS = new Set([
  'id',
  'student_id',
  'class_id',
  'section_id',
  'exam_name',
  'subject',
  'full_marks',
  'marks_obtained',
  'grade',
  'remarks',
  'teacher_id',
  'created_at',
  'updated_at',
]);

function sanitizeStudentMarkPayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_STUDENT_MARK_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function calculateGrade(marksObtained: number, fullMarks = 100): string {
  if (fullMarks <= 0) return 'N/A';
  const percentage = (marksObtained / fullMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
}

export async function fetchStudentMarks(filters: {
  studentId?: string;
  classId?: string;
  sectionId?: string;
  examName?: string;
} = {}): Promise<StudentMark[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('student_marks').select('*').order('created_at', { ascending: false });
    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.classId) query = query.eq('class_id', filters.classId);
    if (filters.sectionId) query = query.eq('section_id', filters.sectionId);
    if (filters.examName) query = query.eq('exam_name', filters.examName);

    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch marks from Supabase:', error);
      // If table doesn't exist yet, return empty list gracefully
      return [];
    }

    const [students, classes, sections] = await Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchSections(),
    ]);
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

    return (data || []).map((m: any) => {
      const st = studentMap.get(m.student_id);
      return {
        ...m,
        student_name: st ? `${st.first_name} ${st.last_name}`.trim() : (m.student_name || 'Student'),
        roll_number: st ? st.roll_number : (m.roll_number || '01'),
        class_name: classMap.get(m.class_id) || m.class_name || 'Class',
        section_name: sectionMap.get(m.section_id) || m.section_name || 'Section',
      };
    });
  }

  let result = [...store.marks];
  if (filters.studentId) result = result.filter((m) => m.student_id === filters.studentId);
  if (filters.classId) result = result.filter((m) => m.class_id === filters.classId);
  if (filters.sectionId) result = result.filter((m) => m.section_id === filters.sectionId);
  if (filters.examName) result = result.filter((m) => m.exam_name === filters.examName);
  return result;
}

export async function submitStudentMarksBatch(marks: Omit<StudentMark, 'id' | 'created_at'>[]) {
  const now = new Date().toISOString();
  const recordsWithId = marks.map((m) => ({
    ...m,
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    grade: m.grade || calculateGrade(Number(m.marks_obtained), Number(m.full_marks || 100)),
    created_at: now,
    updated_at: now,
  }));

  if (isSupabaseConfigured) {
    const sanitized = recordsWithId.map((m) => sanitizeStudentMarkPayload(m));
    const { error } = await supabase.from('student_marks').insert(sanitized);
    if (error) {
      console.error('[Portal DB] Failed to submit marks to Supabase:', error);
      throw new Error(error.message || 'Database error: Failed to save student marks.');
    }
    return true;
  }

  // Demo fallback
  recordsWithId.forEach((rec) => {
    store.marks.push(rec as any);
  });
  store.save();
  return true;
}

export async function deleteStudentMark(id: string) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('student_marks').delete().eq('id', id);
    if (error) {
      console.error('[Portal DB] Failed to delete mark from Supabase:', error);
      throw new Error(`Failed to delete mark: ${error.message}`);
    }
    return true;
  }
  store.marks = store.marks.filter((m) => m.id !== id);
  store.save();
  return true;
}

// ==========================================
// SCHEDULED EXAMS & TIMETABLE SERVICES
// ==========================================

const VALID_SCHEDULED_EXAM_COLUMNS = new Set([
  'id',
  'exam_name',
  'class_id',
  'subject',
  'date',
  'time',
  'duration',
  'full_marks',
  'room_number',
  'instructions',
  'created_by',
  'created_by_name',
  'updated_by_name',
  'created_at',
  'updated_at',
]);

function sanitizeScheduledExamPayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_SCHEDULED_EXAM_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function fetchScheduledExams(classId?: string): Promise<ScheduledExam[]> {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('scheduled_exams')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (classId && classId !== 'all') {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch scheduled exams from Supabase:', error);
      return [];
    }

    const classes = await fetchClasses();
    const classMap = new Map(classes.map((c) => [c.id, c.name]));

    return (data || []).map((exam: any) => ({
      ...exam,
      class_name: classMap.get(exam.class_id) || exam.class_name || 'Class',
    }));
  }

  // Demo fallback
  let list = [...store.exams];
  if (classId && classId !== 'all') {
    list = list.filter((e) => e.class_id === classId);
  }
  const classes = store.classes;
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  return list
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((e) => ({
      ...e,
      class_name: classMap.get(e.class_id) || e.class_name || 'Class',
    }));
}

export async function addScheduledExam(
  examData: Omit<ScheduledExam, 'id' | 'created_at' | 'updated_at'>
): Promise<ScheduledExam> {
  const now = new Date().toISOString();
  const newExam: ScheduledExam = {
    ...examData,
    id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const sanitized = sanitizeScheduledExamPayload(newExam);
    const { data, error } = await supabase.from('scheduled_exams').insert([sanitized]).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to schedule exam in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to schedule exam.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: cls?.name || 'Class' };
  }

  const cls = store.classes.find((c) => c.id === examData.class_id);
  newExam.class_name = cls?.name || 'Class';
  store.exams.push(newExam);
  store.save();
  return newExam;
}

export async function updateScheduledExam(
  id: string,
  updates: Partial<ScheduledExam>
): Promise<ScheduledExam> {
  const now = new Date().toISOString();
  const fullUpdates = {
    ...updates,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const sanitized = sanitizeScheduledExamPayload(fullUpdates);
    const { data, error } = await supabase
      .from('scheduled_exams')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[Portal DB] Failed to update scheduled exam in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to update exam.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: cls?.name || 'Class' };
  }

  const idx = store.exams.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store.exams[idx] = { ...store.exams[idx], ...fullUpdates };
    const cls = store.classes.find((c) => c.id === store.exams[idx].class_id);
    store.exams[idx].class_name = cls?.name || 'Class';
    store.save();
    return store.exams[idx];
  }
  throw new Error('Scheduled exam not found');
}

export async function deleteScheduledExam(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('scheduled_exams').delete().eq('id', id);
    if (error) {
      console.error('[Portal DB] Failed to delete scheduled exam from Supabase:', error);
      throw new Error(`Failed to delete scheduled exam: ${error.message}`);
    }
    return true;
  }
  store.exams = store.exams.filter((e) => e.id !== id);
  store.save();
  return true;
}

// ==========================================
// CLASS TIMETABLE & DAILY ROUTINE SERVICES
// ==========================================

const VALID_CLASS_TIMETABLE_COLUMNS = new Set([
  'id',
  'class_id',
  'day_of_week',
  'period_number',
  'start_time',
  'end_time',
  'time_slot',
  'subject',
  'teacher_name',
  'teacher_id',
  'room_number',
  'created_at',
  'updated_at',
]);

function sanitizeClassTimetablePayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_CLASS_TIMETABLE_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const DAY_ORDER: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export async function fetchClassTimetable(
  classId?: string,
  dayOfWeek?: string
): Promise<ClassTimetableEntry[]> {
  const timetableMap = new Map<string, ClassTimetableEntry>();
  let remoteLoaded = false;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('class_timetables')
        .select('*')
        .order('period_number', { ascending: true })
        .order('start_time', { ascending: true });

      if (classId && classId !== 'all') {
        query = query.eq('class_id', classId);
      }
      if (dayOfWeek && dayOfWeek !== 'all') {
        query = query.eq('day_of_week', dayOfWeek);
      }

      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        data.forEach((entry: any) => {
          if (!isDummyTimetableEntry(entry)) {
            timetableMap.set(entry.id, entry);
          }
        });
        remoteLoaded = true;
      } else if (error) {
        console.warn('[Portal DB] Querying class_timetables notice:', error.message);
      }
    } catch (e) {
      console.warn('[Portal DB] Exception querying class_timetables:', e);
    }
  }

  // Always merge non-dummy entries from local/store (so offline or locally-created entries are never dropped)
  store.timetables.forEach((e) => {
    if (!isDummyTimetableEntry(e) && !timetableMap.has(e.id)) {
      timetableMap.set(e.id, e);
    }
  });

  // Merge from localStorage (excluding dummy entries)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timetables && Array.isArray(parsed.timetables)) {
          parsed.timetables.forEach((e: any) => {
            if (!isDummyTimetableEntry(e) && !timetableMap.has(e.id)) {
              timetableMap.set(e.id, e);
            }
          });
        }
      }
    } catch {}
  }

  let list = Array.from(timetableMap.values()).filter((e) => !isDummyTimetableEntry(e));
  if (classId && classId !== 'all') {
    list = list.filter((e) => e.class_id === classId);
  }
  if (dayOfWeek && dayOfWeek !== 'all') {
    list = list.filter((e) => e.day_of_week === dayOfWeek);
  }

  const classes = await fetchClasses();
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  return list
    .sort((a: any, b: any) => {
      const dA = DAY_ORDER[a.day_of_week] || 0;
      const dB = DAY_ORDER[b.day_of_week] || 0;
      if (dA !== dB) return dA - dB;
      return (Number(a.period_number) || 0) - (Number(b.period_number) || 0);
    })
    .map((entry: any) => ({
      ...entry,
      class_name: classMap.get(entry.class_id) || entry.class_name || 'Class',
    }));
}

export const fetchClassTimetables = fetchClassTimetable;

export async function addClassTimetableEntry(
  entryData: Omit<ClassTimetableEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<ClassTimetableEntry> {
  const now = new Date().toISOString();
  const startTime = entryData.start_time || '10:30 AM';
  const endTime = entryData.end_time || '11:15 AM';
  const timeSlot = entryData.time_slot || (entryData.start_time && entryData.end_time ? `${entryData.start_time} - ${entryData.end_time}` : `${startTime} - ${endTime}`);
  const newEntry: ClassTimetableEntry = {
    ...entryData,
    start_time: startTime,
    end_time: endTime,
    time_slot: timeSlot,
    id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: now,
    updated_at: now,
  };

  const cls = store.classes.find((c) => c.id === entryData.class_id);
  newEntry.class_name = cls?.name || 'Class';

  // Always save locally in memory store
  store.timetables.push(newEntry);
  store.save();

  // Always backup to localStorage
  if (typeof window !== 'undefined') {
    try {
      const savedStore = localStorage.getItem('rkvm_portal_store');
      const parsed = savedStore ? JSON.parse(savedStore) : {};
      const tList = parsed.timetables && Array.isArray(parsed.timetables) ? parsed.timetables : [];
      tList.push(newEntry);
      parsed.timetables = tList;
      localStorage.setItem('rkvm_portal_store', JSON.stringify(parsed));
    } catch (storageErr) {
      console.warn('[Portal DB] LocalStorage timetable save warning:', storageErr);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const sanitized = sanitizeClassTimetablePayload(newEntry);
      const { data, error } = await supabase.from('class_timetables').insert([sanitized]).select().single();
      if (!error && data) {
        const classes = await fetchClasses();
        const foundCls = classes.find((c) => c.id === data.class_id);
        return { ...data, class_name: foundCls?.name || 'Class' };
      }
      console.warn('[Portal DB] class_timetables table not in Supabase yet, entry preserved locally:', error?.message);
    } catch (err: any) {
      console.warn('[Portal DB] Exception inserting to class_timetables in Supabase, preserved locally:', err);
    }
  }

  return newEntry;
}

export async function updateClassTimetableEntry(
  id: string,
  updates: Partial<ClassTimetableEntry>
): Promise<ClassTimetableEntry> {
  const now = new Date().toISOString();
  const fullUpdates = {
    ...updates,
    time_slot: updates.start_time && updates.end_time ? `${updates.start_time} - ${updates.end_time}` : updates.time_slot,
    updated_at: now,
  };

  const idx = store.timetables.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store.timetables[idx] = { ...store.timetables[idx], ...fullUpdates };
    const cls = store.classes.find((c) => c.id === store.timetables[idx].class_id);
    store.timetables[idx].class_name = cls?.name || 'Class';
    store.save();
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timetables && Array.isArray(parsed.timetables)) {
          const tIdx = parsed.timetables.findIndex((e: any) => e.id === id);
          if (tIdx >= 0) {
            parsed.timetables[tIdx] = { ...parsed.timetables[tIdx], ...fullUpdates };
            localStorage.setItem('rkvm_portal_store', JSON.stringify(parsed));
          }
        }
      }
    } catch {}
  }

  if (isSupabaseConfigured) {
    try {
      const sanitized = sanitizeClassTimetablePayload(fullUpdates);
      const { data, error } = await supabase
        .from('class_timetables')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const classes = await fetchClasses();
        const cls = classes.find((c) => c.id === data.class_id);
        return { ...data, class_name: cls?.name || 'Class' };
      }
    } catch (e) {
      console.warn('[Portal DB] Exception updating class_timetables in Supabase:', e);
    }
  }

  const existing = store.timetables.find((e) => e.id === id);
  if (existing) return existing;
  return { id, ...fullUpdates } as ClassTimetableEntry;
}

export async function deleteClassTimetableEntry(id: string): Promise<boolean> {
  store.timetables = store.timetables.filter((e) => e.id !== id);
  store.save();

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timetables && Array.isArray(parsed.timetables)) {
          parsed.timetables = parsed.timetables.filter((e: any) => e.id !== id);
          localStorage.setItem('rkvm_portal_store', JSON.stringify(parsed));
        }
      }
    } catch {}
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('class_timetables').delete().eq('id', id);
    } catch (e) {
      console.warn('[Portal DB] Notice: Unable to delete from Supabase class_timetables:', e);
    }
  }

  return true;
}

// ==========================================
// Clean up any legacy subjects from local storage to ensure ONLY Supabase is used
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('rkvm_portal_subjects');
  } catch {}
}

// Clean up any legacy dummy timetable entries from Supabase & local storage
if (isSupabaseConfigured) {
  try {
    const dummyIds = Array.from({ length: 33 }, (_, i) => `tt-${i + 1}`);
    supabase.from('class_timetables').delete().in('id', dummyIds).then(() => {});
  } catch {}
}

function sanitizeSubjectPayload(sub: Partial<Subject>): Record<string, any> {
  const allowed = ['id', 'name', 'code', 'class_id', 'category', 'description', 'created_at', 'updated_at'];
  const sanitized: Record<string, any> = {};
  for (const key of allowed) {
    if ((sub as any)[key] !== undefined) {
      sanitized[key] = (sub as any)[key];
    }
  }
  return sanitized;
}

export async function fetchSubjects(classId?: string): Promise<Subject[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('subjects').select('*');
    if (classId && classId !== 'all') {
      query = query.or(`class_id.eq.${classId},class_id.eq.all`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Error] fetchSubjects:', error);
      if (error.message?.includes('schema cache') || error.code === '42P01') {
        throw new Error("Supabase table 'public.subjects' not found. Please run the SQL query in Supabase SQL Editor to create it.");
      }
      throw new Error(`Database error: ${error.message}`);
    }

    const list: Subject[] = data || [];
    const classes = await fetchClasses();
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    classMap.set('all', 'All Classes');

    return list
      .map((s) => ({
        ...s,
        class_name: s.class_id ? classMap.get(s.class_id) || 'All Classes' : 'All Classes',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Demo mode fallback only when Supabase is completely unconfigured in env
  let result = store.subjects;
  if (classId && classId !== 'all') {
    result = result.filter((s) => s.class_id === classId || s.class_id === 'all');
  }
  const classMap = new Map(store.classes.map((c) => [c.id, c.name]));
  classMap.set('all', 'All Classes');
  return result
    .map((s) => ({
      ...s,
      class_name: s.class_id ? classMap.get(s.class_id) || 'All Classes' : 'All Classes',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addSubject(subjectData: Partial<Subject>): Promise<Subject> {
  const now = new Date().toISOString();

  let newId = subjectData.id;
  if (!newId) {
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase.from('subjects').select('id');
        let nextNum = 1;
        if (existing && existing.length > 0) {
          const nums = existing
            .map((s) => {
              const match = String(s.id).match(/^sub-(\d+)$/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n) && n > 0);
          nextNum = nums.length > 0 ? Math.max(...nums) + 1 : existing.length + 1;
        }
        newId = `sub-${nextNum}`;
      } catch {
        newId = `sub-${Date.now()}`;
      }
    } else {
      const nums = store.subjects
        .map((s) => {
          const match = String(s.id).match(/^sub-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : store.subjects.length + 1;
      newId = `sub-${nextNum}`;
    }
  }

  const newSubject: Subject = {
    id: newId,
    name: subjectData.name?.trim() || 'Untitled Subject',
    code: subjectData.code?.trim().toUpperCase() || '',
    class_id: subjectData.class_id || 'all',
    category: subjectData.category || 'Academic',
    description: subjectData.description?.trim() || '',
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const sanitized = sanitizeSubjectPayload(newSubject);
    const { data, error } = await supabase
      .from('subjects')
      .insert([sanitized])
      .select()
      .single();

    if (error || !data) {
      console.error('[Supabase Error] addSubject:', error);
      if (error?.message?.includes('schema cache') || error?.code === '42P01') {
        throw new Error("Supabase table 'public.subjects' not found. Please run the SQL query in Supabase SQL Editor to create it.");
      }
      throw new Error(`Database error: ${error?.message || 'Failed to create subject in Supabase.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: data.class_id === 'all' ? 'All Classes' : cls?.name || 'All Classes' };
  }

  store.subjects.unshift(newSubject);
  const cls = store.classes.find((c) => c.id === newSubject.class_id);
  return { ...newSubject, class_name: newSubject.class_id === 'all' ? 'All Classes' : cls?.name || 'All Classes' };
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
  const now = new Date().toISOString();
  const fullUpdates = {
    ...updates,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const sanitized = sanitizeSubjectPayload(fullUpdates);
    const { data, error } = await supabase
      .from('subjects')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[Supabase Error] updateSubject:', error);
      if (error?.message?.includes('schema cache') || error?.code === '42P01') {
        throw new Error("Supabase table 'public.subjects' not found. Please run the SQL query in Supabase SQL Editor to create it.");
      }
      throw new Error(`Database error: ${error?.message || 'Failed to update subject in Supabase.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: data.class_id === 'all' ? 'All Classes' : cls?.name || 'All Classes' };
  }

  const idx = store.subjects.findIndex((s) => s.id === id);
  if (idx >= 0) {
    store.subjects[idx] = { ...store.subjects[idx], ...fullUpdates };
    const cls = store.classes.find((c) => c.id === store.subjects[idx].class_id);
    return { ...store.subjects[idx], class_name: store.subjects[idx].class_id === 'all' ? 'All Classes' : cls?.name || 'All Classes' };
  }
  throw new Error('Subject not found');
}

export async function deleteSubject(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      console.error('[Supabase Error] deleteSubject:', error);
      if (error.message?.includes('schema cache') || error.code === '42P01') {
        throw new Error("Supabase table 'public.subjects' not found. Please run the SQL query in Supabase SQL Editor to create it.");
      }
      throw new Error(`Database error: ${error.message}`);
    }
    return true;
  }

  store.subjects = store.subjects.filter((s) => s.id !== id);
  return true;
}
