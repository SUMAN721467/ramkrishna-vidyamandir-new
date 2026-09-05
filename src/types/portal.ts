export type UserRole = 'admin' | 'teacher' | 'parent';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type StudentStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  pending_avatar_url?: string;
  pending_avatar_status?: 'pending' | 'approved' | 'rejected';
  portal_password?: string;
  address?: string;
  qualification?: string;
  specialized_subject?: string;
  aadhar_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  created_at?: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
  created_at?: string;
}

export interface Student {
  id: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  class_id: string;
  section_id: string;
  avatar_url?: string;
  pending_avatar_url?: string;
  pending_avatar_status?: 'pending' | 'approved' | 'rejected';
  status: StudentStatus;
  phone?: string;
  alt_phone?: string;
  email?: string;
  father_name?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_occupation?: string;
  address?: string;
  aadhar_number?: string;
  portal_password?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields for convenience
  class_name?: string;
  section_name?: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  qualification?: string;
  specialized_subject?: string;
  address?: string;
  aadhar_number?: string;
  avatar_url?: string;
  portal_password?: string;
  status?: StudentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Parent {
  id: string; // References profiles.id
  occupation?: string;
  status: StudentStatus;
  profile?: Profile;
  children?: Student[];
}

export interface TeacherClassAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  created_at?: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  is_late?: boolean;
  timetable_id?: string;
  marked_by: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  section_name?: string;
  marked_by_name?: string;
  teacher_name?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  target_role: 'all' | 'teacher' | 'parent';
  created_by: string;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  author_name?: string;
}

export interface StudentMark {
  id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  exam_name: string;
  subject: string;
  full_marks: number;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
  teacher_id?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  section_name?: string;
}

export interface ScheduledExam {
  id: string;
  exam_name: string;
  class_id: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  full_marks: number;
  room_number?: string;
  instructions?: string;
  created_by: string;
  created_by_name: string;
  updated_by_name?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  class_name?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ClassTimetableEntry {
  id: string;
  class_id: string;
  day_of_week: DayOfWeek;
  period_number: number; // 1 to 7 for teaching periods, or fractional for break placement (e.g. 3.5 = after period 3)
  is_break?: boolean; // True for Tiffin Break, Recess, etc. (NOT a period)
  break_type?: 'tiffin' | 'lunch' | 'recess' | 'short_break' | 'break' | string;
  start_time?: string;
  end_time?: string;
  time_slot?: string;
  subject: string;
  teacher_name: string;
  teacher_id?: string;
  room_number?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  class_name?: string;
}

export type SubjectCategory =
  | 'Academic'
  | 'Co-curricular / Activity';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  class_id?: string; // 'all' or specific class id (e.g. 'c0', 'c7')
  category?: SubjectCategory;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Joined field
  class_name?: string;
}

