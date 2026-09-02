import { supabase, isSupabaseConfigured } from './supabase';
import { formatDateDDMMYYYY } from './format';
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
} from '../types/portal';

// Initial Mock Seed Data for Instant Local Testing / Fallback
const INITIAL_CLASSES: SchoolClass[] = [
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

const INITIAL_TIMETABLES: ClassTimetableEntry[] = [
  // Class 5 (c7) - Monday
  { id: 'tt-1', class_id: 'c7', day_of_week: 'Monday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'Bengali (1st Language)', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-2', class_id: 'c7', day_of_week: 'Monday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'English (2nd Language)', teacher_name: 'Debashis Mukherjee', room_number: 'Room 101' },
  { id: 'tt-3', class_id: 'c7', day_of_week: 'Monday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'Mathematics', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-4', class_id: 'c7', day_of_week: 'Monday', period_number: 4, start_time: '01:15 PM', end_time: '02:00 PM', time_slot: '01:15 PM - 02:00 PM', subject: 'General Science', teacher_name: 'Anupam Roy', room_number: 'Science Lab' },
  { id: 'tt-5', class_id: 'c7', day_of_week: 'Monday', period_number: 5, start_time: '02:00 PM', end_time: '02:45 PM', time_slot: '02:00 PM - 02:45 PM', subject: 'History & Geography', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-6', class_id: 'c7', day_of_week: 'Monday', period_number: 6, start_time: '02:45 PM', end_time: '03:30 PM', time_slot: '02:45 PM - 03:30 PM', subject: 'Computer & Practical', teacher_name: 'Ranjan Banerjee', room_number: 'Computer Lab' },

  // Class 5 (c7) - Tuesday
  { id: 'tt-7', class_id: 'c7', day_of_week: 'Tuesday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'Mathematics', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-8', class_id: 'c7', day_of_week: 'Tuesday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'Bengali (1st Language)', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-9', class_id: 'c7', day_of_week: 'Tuesday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'English (2nd Language)', teacher_name: 'Debashis Mukherjee', room_number: 'Room 101' },
  { id: 'tt-10', class_id: 'c7', day_of_week: 'Tuesday', period_number: 4, start_time: '01:15 PM', end_time: '02:00 PM', time_slot: '01:15 PM - 02:00 PM', subject: 'General Science', teacher_name: 'Anupam Roy', room_number: 'Room 101' },
  { id: 'tt-11', class_id: 'c7', day_of_week: 'Tuesday', period_number: 5, start_time: '02:00 PM', end_time: '02:45 PM', time_slot: '02:00 PM - 02:45 PM', subject: 'Physical Education & Yoga', teacher_name: 'Kallol Ghosh', room_number: 'Ground' },
  { id: 'tt-12', class_id: 'c7', day_of_week: 'Tuesday', period_number: 6, start_time: '02:45 PM', end_time: '03:30 PM', time_slot: '02:45 PM - 03:30 PM', subject: 'Drawing & Crafts', teacher_name: 'Priyanka Das', room_number: 'Art Room' },

  // Class 5 (c7) - Wednesday
  { id: 'tt-13', class_id: 'c7', day_of_week: 'Wednesday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'English (2nd Language)', teacher_name: 'Debashis Mukherjee', room_number: 'Room 101' },
  { id: 'tt-14', class_id: 'c7', day_of_week: 'Wednesday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'Mathematics', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-15', class_id: 'c7', day_of_week: 'Wednesday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'Bengali (1st Language)', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-16', class_id: 'c7', day_of_week: 'Wednesday', period_number: 4, start_time: '01:15 PM', end_time: '02:00 PM', time_slot: '01:15 PM - 02:00 PM', subject: 'Computer & Practical', teacher_name: 'Ranjan Banerjee', room_number: 'Computer Lab' },
  { id: 'tt-17', class_id: 'c7', day_of_week: 'Wednesday', period_number: 5, start_time: '02:00 PM', end_time: '02:45 PM', time_slot: '02:00 PM - 02:45 PM', subject: 'History & Geography', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-18', class_id: 'c7', day_of_week: 'Wednesday', period_number: 6, start_time: '02:45 PM', end_time: '03:30 PM', time_slot: '02:45 PM - 03:30 PM', subject: 'General Knowledge & Values', teacher_name: 'Anupam Roy', room_number: 'Room 101' },

  // Class 5 (c7) - Thursday
  { id: 'tt-19', class_id: 'c7', day_of_week: 'Thursday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'Bengali (1st Language)', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-20', class_id: 'c7', day_of_week: 'Thursday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'General Science', teacher_name: 'Anupam Roy', room_number: 'Room 101' },
  { id: 'tt-21', class_id: 'c7', day_of_week: 'Thursday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'Mathematics', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-22', class_id: 'c7', day_of_week: 'Thursday', period_number: 4, start_time: '01:15 PM', end_time: '02:00 PM', time_slot: '01:15 PM - 02:00 PM', subject: 'English (2nd Language)', teacher_name: 'Debashis Mukherjee', room_number: 'Room 101' },
  { id: 'tt-23', class_id: 'c7', day_of_week: 'Thursday', period_number: 5, start_time: '02:00 PM', end_time: '02:45 PM', time_slot: '02:00 PM - 02:45 PM', subject: 'Environmental Studies', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-24', class_id: 'c7', day_of_week: 'Thursday', period_number: 6, start_time: '02:45 PM', end_time: '03:30 PM', time_slot: '02:45 PM - 03:30 PM', subject: 'Library & Reading', teacher_name: 'Debashis Mukherjee', room_number: 'Library' },

  // Class 5 (c7) - Friday
  { id: 'tt-25', class_id: 'c7', day_of_week: 'Friday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'Mathematics', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-26', class_id: 'c7', day_of_week: 'Friday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'English (2nd Language)', teacher_name: 'Debashis Mukherjee', room_number: 'Room 101' },
  { id: 'tt-27', class_id: 'c7', day_of_week: 'Friday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'General Science', teacher_name: 'Anupam Roy', room_number: 'Room 101' },
  { id: 'tt-28', class_id: 'c7', day_of_week: 'Friday', period_number: 4, start_time: '01:15 PM', end_time: '02:00 PM', time_slot: '01:15 PM - 02:00 PM', subject: 'Bengali (1st Language)', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-29', class_id: 'c7', day_of_week: 'Friday', period_number: 5, start_time: '02:00 PM', end_time: '02:45 PM', time_slot: '02:00 PM - 02:45 PM', subject: 'History & Geography', teacher_name: 'Subrata Sen', room_number: 'Room 101' },
  { id: 'tt-30', class_id: 'c7', day_of_week: 'Friday', period_number: 6, start_time: '02:45 PM', end_time: '03:30 PM', time_slot: '02:45 PM - 03:30 PM', subject: 'Moral Education & Prayer', teacher_name: 'Subrata Sen', room_number: 'Prayer Hall' },

  // Class 5 (c7) - Saturday
  { id: 'tt-31', class_id: 'c7', day_of_week: 'Saturday', period_number: 1, start_time: '10:30 AM', end_time: '11:15 AM', time_slot: '10:30 AM - 11:15 AM', subject: 'Weekly Assessment & Quiz', teacher_name: 'Sourav Ganguly', room_number: 'Room 101' },
  { id: 'tt-32', class_id: 'c7', day_of_week: 'Saturday', period_number: 2, start_time: '11:15 AM', end_time: '12:00 PM', time_slot: '11:15 AM - 12:00 PM', subject: 'Music & Recitation', teacher_name: 'Priyanka Das', room_number: 'Music Room' },
  { id: 'tt-33', class_id: 'c7', day_of_week: 'Saturday', period_number: 3, start_time: '12:00 PM', end_time: '12:45 PM', time_slot: '12:00 PM - 12:45 PM', subject: 'Games & Sports', teacher_name: 'Kallol Ghosh', room_number: 'Ground' },
];

const INITIAL_SECTIONS: Section[] = [
  { id: 's-a', class_id: 'all', name: 'Section A' },
  { id: 's-b', class_id: 'all', name: 'Section B' },
];

export function generateDefaultPassword(name: string, dob?: string): string {
  const firstName = name.trim().split(' ')[0] || 'User';
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  let year = '2011';
  if (dob && dob.length >= 4) {
    const extractedYear = dob.split('-')[0];
    if (extractedYear && extractedYear.length === 4 && !isNaN(Number(extractedYear))) {
      year = extractedYear;
    }
  }

  return `${capitalized}@${year}`;
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

// Local Storage sync for demo/offline development mode ONLY
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
  timetables: ClassTimetableEntry[] = INITIAL_TIMETABLES;

  constructor() {
    if (typeof window !== 'undefined' && !isSupabaseConfigured) {
      const saved = localStorage.getItem('rkvm_portal_store');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.classes = parsed.classes && parsed.classes.length > 0 ? parsed.classes : INITIAL_CLASSES;
          this.sections = INITIAL_SECTIONS;
          this.profiles = parsed.profiles && parsed.profiles.length > 0 ? parsed.profiles : INITIAL_PROFILES;
          this.students = parsed.students || [];
          this.teacherAssignments = parsed.teacherAssignments || INITIAL_TEACHER_ASSIGNMENTS;
          this.parentLinks = parsed.parentLinks || INITIAL_PARENT_LINKS;
          this.notices = parsed.notices && parsed.notices.length > 0 ? parsed.notices : INITIAL_NOTICES;
          this.attendance = parsed.attendance || [];
          this.marks = parsed.marks || [];
          this.exams = parsed.exams || [];
          this.timetables = parsed.timetables && parsed.timetables.length > 0 ? parsed.timetables : INITIAL_TIMETABLES;
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
        })
      );
    }
  }
}

export const store = new PortalStore();

// ==========================================
// DATA API SERVICES
// ==========================================

export async function fetchClasses(): Promise<SchoolClass[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) {
      console.error('[Portal DB] Failed to fetch classes from Supabase:', error);
      throw new Error(`Failed to load classes: ${error.message}`);
    }
    return data || [];
  }
  return store.classes;
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
    return data || [];
  }
  if (role) {
    return store.profiles.filter((p) => p.role === role);
  }
  return store.profiles;
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

export async function fetchTeacherClasses(teacherId: string) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      console.error('[Portal DB] Failed to fetch teacher classes from Supabase:', error);
      throw new Error(`Failed to load teacher classes: ${error.message}`);
    }

    const [classes, sections] = await Promise.all([fetchClasses(), fetchSections()]);
    const classMap = new Map(classes.map((c) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

    if (data && data.length > 0) {
      return data.map((tc: any) => ({
        class_id: tc.class_id,
        section_id: tc.section_id,
        class_name: classMap.get(tc.class_id) || 'Class',
        section_name: sectionMap.get(tc.section_id) || 'Section',
      }));
    }

    // Fallback: If no specific teacher assignments exist, allow teacher to select any school class
    return classes.flatMap((cls) =>
      sections.map((sec) => ({
        class_id: cls.id,
        section_id: sec.id,
        class_name: cls.name,
        section_name: sec.name,
      }))
    );
  }

  const assignments = store.teacherAssignments.filter((ta) => ta.teacher_id === teacherId);
  if (assignments.length > 0) {
    return assignments.map((ta) => {
      const cls = store.classes.find((c) => c.id === ta.class_id);
      const sec = store.sections.find((s) => s.id === ta.section_id);
      return {
        class_id: ta.class_id,
        section_id: ta.section_id,
        class_name: cls?.name || 'Class 5',
        section_name: sec?.name || 'Section A',
      };
    });
  }

  return store.classes.flatMap((cls) =>
    store.sections.map((sec) => ({
      class_id: cls.id,
      section_id: sec.id,
      class_name: cls.name,
      section_name: sec.name,
    }))
  );
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

export async function fetchAttendance(filters: {
  date?: string;
  startDate?: string;
  endDate?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
}): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (filters.date) query = query.eq('date', filters.date);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
    if (filters.classId) query = query.eq('class_id', filters.classId);
    if (filters.sectionId) query = query.eq('section_id', filters.sectionId);
    if (filters.studentId) query = query.eq('student_id', filters.studentId);

    const { data, error } = await query;
    if (error) {
      console.error('[Portal DB] Failed to fetch attendance from Supabase:', error);
      throw new Error(`Failed to load attendance records: ${error.message}`);
    }

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

    return (data || []).map((att: any) => {
      const st = studentMap.get(att.student_id);
      return {
        ...att,
        student_name: st ? `${st.first_name} ${st.last_name}`.trim() : (att.student_name || 'Student'),
        roll_number: st ? st.roll_number : (att.roll_number || '01'),
        class_name: classMap.get(att.class_id) || att.class_name || 'Class',
        section_name: sectionMap.get(att.section_id) || att.section_name || 'Section',
        marked_by_name: profileMap.get(att.marked_by) || att.marked_by_name || 'Class Teacher',
      };
    });
  }

  let result = [...store.attendance];
  if (filters.date) result = result.filter((a) => a.date === filters.date);
  if (filters.startDate) result = result.filter((a) => a.date >= filters.startDate!);
  if (filters.endDate) result = result.filter((a) => a.date <= filters.endDate!);
  if (filters.classId) result = result.filter((a) => a.class_id === filters.classId);
  if (filters.sectionId) result = result.filter((a) => a.section_id === filters.sectionId);
  if (filters.studentId) result = result.filter((a) => a.student_id === filters.studentId);

  // Sort descending by date
  result.sort((a, b) => b.date.localeCompare(a.date));

  return result.map((att) => {
    const st = store.students.find((s) => s.id === att.student_id);
    const cls = store.classes.find((c) => c.id === att.class_id);
    const sec = store.sections.find((s) => s.id === att.section_id);
    const prof = store.profiles.find((p) => p.id === att.marked_by);
    return {
      ...att,
      student_name: st ? `${st.first_name} ${st.last_name}`.trim() : (att.student_name || 'Student'),
      roll_number: st ? st.roll_number : (att.roll_number || '01'),
      class_name: cls ? cls.name : (att.class_name || 'Class 5'),
      section_name: sec ? sec.name : (att.section_name || 'Section A'),
      marked_by_name: prof ? prof.full_name : (att.marked_by_name || 'Class Teacher'),
    };
  });
}

export async function submitAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'created_at'>[]) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' });

    if (error) {
      console.error('[Portal DB] Failed to submit attendance to Supabase:', error);
      throw new Error(error.message || 'Database error: Failed to save attendance to Supabase.');
    }

    return true;
  }

  // Offline / Demo fallback
  records.forEach((newRec) => {
    const idx = store.attendance.findIndex(
      (a) => a.student_id === newRec.student_id && a.date === newRec.date
    );
    const fullRec: AttendanceRecord = {
      ...newRec,
      id: idx >= 0 ? store.attendance[idx].id : `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      store.attendance[idx] = fullRec;
    } else {
      store.attendance.push(fullRec);
    }
  });

  store.save();
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
  'portal_password',
  'avatar_url',
  'pending_avatar_url',
  'pending_avatar_status',
  'status',
  'created_at',
  'updated_at',
]);

function sanitizeStudentPayload(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (VALID_STUDENT_COLUMNS.has(key) && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

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
  'created_at',
  'updated_at',
]);

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

  // Generate collision-free unique Student ID
  const uniqueSuffix = Math.random().toString(36).substring(2, 7);
  const newStudentId = `st-${Date.now()}-${uniqueSuffix}`;

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
  const generatedPassword = profileData.portal_password || generateDefaultPassword(profileData.full_name, '2011');
  const now = new Date().toISOString();

  // Generate collision-free unique Profile ID
  const uniqueSuffix = Math.random().toString(36).substring(2, 7);
  const newId = profileData.role === 'teacher'
    ? `t-${Date.now()}-${uniqueSuffix}`
    : `u-${profileData.role}-${Date.now()}-${uniqueSuffix}`;

  const newProf: Profile = {
    ...profileData,
    id: newId,
    portal_password: generatedPassword,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('profiles').insert([newProf]).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to add profile to Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to create profile.'}`);
    }
    return data;
  }

  // Offline / Demo fallback
  store.profiles.push(newProf);
  store.save();
  return newProf;
}

export async function updateUserPassword(targetId: string, newPassword: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    const results = await Promise.allSettled([
      supabase.from('students').update({ portal_password: newPassword, updated_at: now }).eq('id', targetId),
      supabase.from('profiles').update({ portal_password: newPassword, updated_at: now }).eq('id', targetId),
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

export async function assignTeacherToClass(teacherId: string, classId: string, sectionId: string) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('teacher_classes').insert([{ teacher_id: teacherId, class_id: classId, section_id: sectionId }]);
    if (error) {
      console.error('[Portal DB] Failed to assign teacher to class in Supabase:', error);
      throw new Error(`Failed to assign teacher to class: ${error.message}`);
    }
    return;
  }

  const exists = store.teacherAssignments.some(
    (a) => a.teacher_id === teacherId && a.class_id === classId && a.section_id === sectionId
  );
  if (!exists) {
    store.teacherAssignments.push({
      id: `ta-${Date.now()}`,
      teacher_id: teacherId,
      class_id: classId,
      section_id: sectionId,
    });
    store.save();
  }
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
      'Student Name': rec.student_name || 'N/A',
      'Class': rec.class_name || 'N/A',
      'Section': rec.section_name || 'N/A',
      'Roll Number': rec.roll_number || 'N/A',
      'Status': rec.status.toUpperCase(),
      'Marked By': rec.marked_by_name || 'Teacher/Admin',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const colWidths = [
      { wch: 14 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    XLSX.writeFile(workbook, `${filenamePrefix}_${formatDateDDMMYYYY(new Date())}.xlsx`);
    return;
  }

  // Native UTF-8 BOM CSV Export (Excel Compatible)
  const headers = ['Date', 'Student Name', 'Class', 'Section', 'Roll Number', 'Status', 'Marked By'];
  const rows = records.map((rec) => [
    formatDateDDMMYYYY(rec.date),
    `"${(rec.student_name || '').replace(/"/g, '""')}"`,
    `"${(rec.class_name || '').replace(/"/g, '""')}"`,
    `"${(rec.section_name || '').replace(/"/g, '""')}"`,
    `"${(rec.roll_number || '').replace(/"/g, '""')}"`,
    rec.status.toUpperCase(),
    `"${(rec.marked_by_name || '').replace(/"/g, '""')}"`,
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
  if (isSupabaseConfigured) {
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
    if (error) {
      console.error('[Portal DB] Failed to fetch class timetables from Supabase:', error);
      return [];
    }

    const classes = await fetchClasses();
    const classMap = new Map(classes.map((c) => [c.id, c.name]));

    return (data || [])
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

  // Demo fallback
  let list = [...store.timetables];
  if (classId && classId !== 'all') {
    list = list.filter((e) => e.class_id === classId);
  }
  if (dayOfWeek && dayOfWeek !== 'all') {
    list = list.filter((e) => e.day_of_week === dayOfWeek);
  }

  const classes = store.classes;
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  return list
    .sort((a, b) => {
      const dA = DAY_ORDER[a.day_of_week] || 0;
      const dB = DAY_ORDER[b.day_of_week] || 0;
      if (dA !== dB) return dA - dB;
      return (Number(a.period_number) || 0) - (Number(b.period_number) || 0);
    })
    .map((e) => ({
      ...e,
      class_name: classMap.get(e.class_id) || e.class_name || 'Class',
    }));
}

export async function addClassTimetableEntry(
  entryData: Omit<ClassTimetableEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<ClassTimetableEntry> {
  const now = new Date().toISOString();
  const timeSlot = entryData.time_slot || `${entryData.start_time} - ${entryData.end_time}`;
  const newEntry: ClassTimetableEntry = {
    ...entryData,
    time_slot: timeSlot,
    id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    const sanitized = sanitizeClassTimetablePayload(newEntry);
    const { data, error } = await supabase.from('class_timetables').insert([sanitized]).select().single();
    if (error || !data) {
      console.error('[Portal DB] Failed to create timetable entry in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to add timetable entry.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: cls?.name || 'Class' };
  }

  const cls = store.classes.find((c) => c.id === entryData.class_id);
  newEntry.class_name = cls?.name || 'Class';
  store.timetables.push(newEntry);
  store.save();
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

  if (isSupabaseConfigured) {
    const sanitized = sanitizeClassTimetablePayload(fullUpdates);
    const { data, error } = await supabase
      .from('class_timetables')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[Portal DB] Failed to update timetable entry in Supabase:', error);
      throw new Error(`Database error: ${error?.message || 'Failed to update timetable entry.'}`);
    }

    const classes = await fetchClasses();
    const cls = classes.find((c) => c.id === data.class_id);
    return { ...data, class_name: cls?.name || 'Class' };
  }

  const idx = store.timetables.findIndex((e) => e.id === id);
  if (idx >= 0) {
    store.timetables[idx] = { ...store.timetables[idx], ...fullUpdates };
    const cls = store.classes.find((c) => c.id === store.timetables[idx].class_id);
    store.timetables[idx].class_name = cls?.name || 'Class';
    store.save();
    return store.timetables[idx];
  }
  throw new Error('Timetable entry not found');
}

export async function deleteClassTimetableEntry(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('class_timetables').delete().eq('id', id);
    if (error) {
      console.error('[Portal DB] Failed to delete timetable entry from Supabase:', error);
      throw new Error(`Failed to delete timetable entry: ${error.message}`);
    }
    return true;
  }
  store.timetables = store.timetables.filter((e) => e.id !== id);
  store.save();
  return true;
}
