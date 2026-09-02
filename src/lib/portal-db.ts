import { supabase, isSupabaseConfigured } from './supabase';
import { formatDateDDMMYYYY } from './format';
import type {
  Profile,
  SchoolClass,
  Section,
  Student,
  Teacher,
  Parent,
  AttendanceRecord,
  Notice,
  UserRole,
  AttendanceStatus,
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

// Initial attendance records (Blank until attendance is taken)
function generateInitialAttendance(): AttendanceRecord[] {
  return [];
}

// Local Storage sync for demo mode persistence
class PortalStore {
  classes: SchoolClass[] = INITIAL_CLASSES;
  sections: Section[] = INITIAL_SECTIONS;
  profiles: Profile[] = INITIAL_PROFILES;
  students: Student[] = INITIAL_STUDENTS;
  teacherAssignments = INITIAL_TEACHER_ASSIGNMENTS;
  parentLinks = INITIAL_PARENT_LINKS;
  notices: Notice[] = INITIAL_NOTICES;
  attendance: AttendanceRecord[] = generateInitialAttendance();

  constructor() {
    if (typeof window !== 'undefined') {
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
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  save() {
    if (typeof window !== 'undefined') {
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
    if (!error && data) return data;
  }
  return store.classes;
}

export async function fetchSections(classId?: string): Promise<Section[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('sections').select('*');
    if (classId) query = query.eq('class_id', classId);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  if (classId) {
    return store.sections.filter((s) => s.class_id === classId);
  }
  return store.sections;
}

export async function fetchProfiles(role?: UserRole): Promise<Profile[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('profiles').select('*');
      if (role) query = query.eq('role', role);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchProfiles fallback:', e);
    }
  }
  if (role) {
    return store.profiles.filter((p) => p.role === role);
  }
  return store.profiles;
}

export async function fetchStudents(classId?: string, sectionId?: string): Promise<Student[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('students')
        .select('*, classes(name), sections(name)')
        .order('roll_number');

      if (classId) query = query.eq('class_id', classId);
      if (sectionId) query = query.eq('section_id', sectionId);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((st: any) => ({
          ...st,
          class_name: st.classes?.name,
          section_name: st.sections?.name,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchStudents fallback:', e);
    }
  }

  let result = store.students;
  if (classId) result = result.filter((s) => s.class_id === classId);
  if (sectionId) result = result.filter((s) => s.section_id === sectionId);
  return result;
}

export async function fetchTeacherClasses(teacherId: string) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('*, classes(name), sections(name)')
        .eq('teacher_id', teacherId);

      if (!error && data) {
        return data.map((tc: any) => ({
          class_id: tc.class_id,
          section_id: tc.section_id,
          class_name: tc.classes?.name,
          section_name: tc.sections?.name,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchTeacherClasses error:', e);
    }
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

  // Fallback: If no specific teacher assignments exist, allow teacher to select any school class
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
    try {
      const { data, error } = await supabase
        .from('parent_students')
        .select('student_id, students(*, classes(name), sections(name))')
        .eq('parent_id', parentId);

      if (!error && data) {
        return data.map((item: any) => ({
          ...item.students,
          class_name: item.students?.classes?.name,
          section_name: item.students?.sections?.name,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchParentChildren error:', e);
    }
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
    try {
      let query = supabase
        .from('attendance')
        .select('*, students(first_name, last_name, roll_number), classes(name), sections(name), profiles(full_name)')
        .order('date', { ascending: false });

      if (filters.date) query = query.eq('date', filters.date);
      if (filters.startDate) query = query.gte('date', filters.startDate);
      if (filters.endDate) query = query.lte('date', filters.endDate);
      if (filters.classId) query = query.eq('class_id', filters.classId);
      if (filters.sectionId) query = query.eq('section_id', filters.sectionId);
      if (filters.studentId) query = query.eq('student_id', filters.studentId);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((att: any) => ({
          ...att,
          student_name: `${att.students?.first_name || ''} ${att.students?.last_name || ''}`.trim(),
          roll_number: att.students?.roll_number,
          class_name: att.classes?.name,
          section_name: att.sections?.name,
          marked_by_name: att.profiles?.full_name,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchAttendance error:', e);
    }
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
  // Always update local store first for instant UI response and persistence
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

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' });

    if (error) {
      throw new Error(error.message || 'Database error: Failed to save attendance.');
    }
  }

  return true;
}

export async function deleteAttendanceRecord(id: string) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  store.attendance = store.attendance.filter((a) => a.id !== id);
  store.save();
  return true;
}

export async function addStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<Student> {
  const generatedEmail = studentData.phone
    ? `${studentData.phone.replace(/\D/g, '')}@rkvmschool.in`
    : (studentData.email || `${studentData.first_name.toLowerCase().replace(/\s+/g, '')}.st@rkvmschool.in`);
  const generatedPassword = studentData.portal_password || generateDefaultPassword(studentData.first_name, studentData.date_of_birth);

  // Generate sequential Student ID: rkvm-s1, rkvm-s2, rkvm-s3...
  const existingStudents = await fetchStudents();
  const allList = [...existingStudents, ...store.students];
  let maxNum = 0;
  allList.forEach((s) => {
    const match = s.id?.match(/rkvm-s(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  const newStudentId = `rkvm-s${maxNum + 1}`;

  const newStudent: Student = {
    ...studentData,
    id: newStudentId,
    email: generatedEmail,
    portal_password: generatedPassword,
    created_at: new Date().toISOString(),
  };

  const cls = store.classes.find((c) => c.id === studentData.class_id);
  const sec = store.sections.find((s) => s.id === studentData.section_id);
  newStudent.class_name = cls?.name;
  newStudent.section_name = sec?.name;

  // Sync profile for student portal authentication
  const studentProfile: Profile = {
    id: newStudent.id,
    email: generatedEmail,
    full_name: `${studentData.first_name} ${studentData.last_name}`.trim(),
    phone: studentData.phone,
    role: 'parent',
    portal_password: generatedPassword,
  };
  const pIdx = store.profiles.findIndex((p) => p.email.toLowerCase() === generatedEmail.toLowerCase() || p.id === newStudent.id);
  if (pIdx >= 0) store.profiles[pIdx] = studentProfile;
  else store.profiles.push(studentProfile);

  if (isSupabaseConfigured) {
    // Strip non-table properties before inserting
    const dbPayload = { ...newStudent };
    delete dbPayload.class_name;
    delete dbPayload.section_name;
    
    const { data, error } = await supabase.from('students').insert([dbPayload]).select().single();
    if (error || !data) {
      throw new Error(error?.message || 'Database connection error: Failed to enroll student.');
    }
    
    // Merge the joined properties back for the UI
    const completeStudent = { ...data, class_name: cls?.name, section_name: sec?.name };
    store.students.push(completeStudent);
    store.save();
    return completeStudent;
  }

  store.students.push(newStudent);
  store.save();
  return newStudent;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  if (isSupabaseConfigured) {
    const dbPayload = { ...updates };
    delete dbPayload.class_name;
    delete dbPayload.section_name;
    
    const { data, error } = await supabase.from('students').update(dbPayload).eq('id', id).select().single();
    if (!error && data) return data;
  }

  const idx = store.students.findIndex((s) => s.id === id);
  if (idx >= 0) {
    store.students[idx] = { ...store.students[idx], ...updates };
    const cls = store.classes.find((c) => c.id === store.students[idx].class_id);
    const sec = store.sections.find((s) => s.id === store.students[idx].section_id);
    store.students[idx].class_name = cls?.name;
    store.students[idx].section_name = sec?.name;

    // Keep profile email / password / phone / avatar synced
    const pIdx = store.profiles.findIndex((p) => p.id === id || p.email.toLowerCase() === store.students[idx].email?.toLowerCase());
    if (pIdx >= 0) {
      store.profiles[pIdx].full_name = store.students[idx].first_name;
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
    pending_avatar_requested_at: new Date().toISOString(),
  };
  return updateStudent(studentId, updates);
}

export async function approveStudentPhotoChange(studentId: string): Promise<Student> {
  const st = store.students.find((s) => s.id === studentId);
  if (!st || !st.pending_avatar_url) throw new Error('No pending photo found for this student');

  const updates: Partial<Student> = {
    avatar_url: st.pending_avatar_url,
    pending_avatar_url: undefined,
    pending_avatar_status: 'approved',
    pending_avatar_requested_at: undefined,
  };
  return updateStudent(studentId, updates);
}

export async function rejectStudentPhotoChange(studentId: string): Promise<Student> {
  const updates: Partial<Student> = {
    pending_avatar_url: undefined,
    pending_avatar_status: 'rejected',
    pending_avatar_requested_at: undefined,
  };
  return updateStudent(studentId, updates);
}

export async function deleteStudent(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await supabase.from('students').delete().eq('id', id);
  }
  store.students = store.students.filter((s) => s.id !== id);
  store.profiles = store.profiles.filter((p) => p.id !== id);
  store.attendance = store.attendance.filter((a) => a.student_id !== id);
  store.save();
  return true;
}

export async function addProfile(profileData: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
  const generatedPassword = profileData.portal_password || generateDefaultPassword(profileData.full_name, '2011');
  
  // Generate sequential Teacher ID: rkvm-t1, rkvm-t2, rkvm-t3...
  let newId: string;
  if (profileData.role === 'teacher') {
    const existingProfiles = await fetchProfiles('teacher');
    const allProfs = [...existingProfiles, ...store.profiles.filter((p) => p.role === 'teacher')];
    let maxNum = 0;
    allProfs.forEach((p) => {
      const match = p.id?.match(/rkvm-t(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    newId = `rkvm-t${maxNum + 1}`;
  } else {
    newId = `u-${profileData.role}-${Date.now()}`;
  }

  const newProf: Profile = {
    ...profileData,
    id: newId,
    portal_password: generatedPassword,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('profiles').insert([newProf]).select().single();
    if (error || !data) {
      throw new Error(error?.message || 'Database connection error: Failed to add teacher profile.');
    }
    store.profiles.push(data);
    store.save();
    return data;
  }

  store.profiles.push(newProf);
  store.save();
  return newProf;
}

export async function updateUserPassword(targetId: string, newPassword: string): Promise<boolean> {
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
    await supabase.from('parent_students').insert([{ parent_id: parentId, student_id: studentId, relationship }]);
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
    await supabase.from('teacher_classes').insert([{ teacher_id: teacherId, class_id: classId, section_id: sectionId }]);
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
      .select('*, profiles(full_name)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((n: any) => ({
        ...n,
        author_name: n.profiles?.full_name || 'Admin',
      }));
    }
  }

  if (role && role !== 'admin') {
    return store.notices.filter((n) => n.target_role === 'all' || n.target_role === role);
  }
  return store.notices;
}

export async function addNotice(noticeData: Omit<Notice, 'id' | 'created_at'>): Promise<Notice> {
  const newNotice: Notice = {
    ...noticeData,
    id: `n-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('notices').insert([noticeData]).select().single();
    if (!error && data) return data;
  }

  store.notices.unshift(newNotice);
  store.save();
  return newNotice;
}

export async function deleteNotice(id: string) {
  if (isSupabaseConfigured) {
    await supabase.from('notices').delete().eq('id', id);
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
