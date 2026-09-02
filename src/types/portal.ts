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
  portal_password?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields for convenience
  class_name?: string;
  section_name?: string;
}

export interface Teacher {
  id: string; // References profiles.id
  employee_id: string;
  qualification?: string;
  status: StudentStatus;
  profile?: Profile;
  assigned_classes?: {
    class_id: string;
    section_id: string;
    class_name?: string;
    section_name?: string;
  }[];
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
  marked_by: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  student_name?: string;
  roll_number?: string;
  class_name?: string;
  section_name?: string;
  marked_by_name?: string;
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
