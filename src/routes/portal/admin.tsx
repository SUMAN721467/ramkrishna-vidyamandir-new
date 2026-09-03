import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Upload,
  Layers,
  Megaphone,
  RefreshCw,
  Eye,
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  BookOpen,
  Award,
  Phone,
  Mail,
  User,
  KeyRound,
  Key,
  Lock,
  Save,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import { ConfirmDialog } from '../../components/portal/ConfirmDialog';
import {
  fetchClasses,
  fetchSections,
  fetchProfiles,
  fetchStudents,
  fetchAttendance,
  fetchNotices,
  addStudent,
  updateStudent,
  addProfile,
  linkParentToStudent,
  deleteStudent,
  deleteAttendanceRecord,
  exportAttendanceToExcel,
  addNotice,
  deleteNotice,
  deleteProfile,
  updateProfile,
  approveStudentPhotoChange,
  rejectStudentPhotoChange,
  generateDefaultPassword,
  generateTeacherDefaultPassword,
  isSyntheticEmail,
  formatDisplayEmail,
  clearTeacherClasses,
  updateUserPassword,
  fetchScheduledExams,
  addScheduledExam,
  updateScheduledExam,
  deleteScheduledExam,
  fetchClassTimetable,
  addClassTimetableEntry,
  updateClassTimetableEntry,
  deleteClassTimetableEntry,
  fetchSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
} from '../../lib/portal-db';
import { formatDateDDMMYYYY, formatDateSlash, parseDateToISO } from '../../lib/format';
import { DateInput } from '../../components/ui/date-input';
import { uploadProfilePhoto } from '../../lib/storage';
import { toast } from 'sonner';
import type {
  SchoolClass,
  Section,
  Profile,
  Student,
  AttendanceRecord,
  Notice,
  ScheduledExam,
  ClassTimetableEntry,
  DayOfWeek,
  UserRole,
  Subject,
  SubjectCategory,
} from '../../types/portal';

export const Route = createFileRoute('/portal/admin')({
  component: AdminDashboardPage,
});

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_CATEGORIES: SubjectCategory[] = [
  'Academic',
  'Co-curricular / Activity',
];

function AdminDashboardPage() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active Tab state: 'overview' | 'students' | 'teachers' | 'subjects' | 'parents' | 'classes' | 'attendance' | 'timetable' | 'exams' | 'notices'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'subjects' | 'parents' | 'classes' | 'attendance' | 'timetable' | 'exams' | 'notices'>('overview');

  // Loading state
  const [loading, setLoading] = useState(true);

  // Entities Data
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [classTimetables, setClassTimetables] = useState<ClassTimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Subjects Management State
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedSubjectClass, setSelectedSubjectClass] = useState<string>('all');
  const [selectedSubjectCategory, setSelectedSubjectCategory] = useState<string>('all');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState<{
    name: string;
    code: string;
    class_id: string;
    category: SubjectCategory;
    description: string;
  }>({
    name: '',
    code: '',
    class_id: 'all',
    category: 'Academic',
    description: '',
  });

  // Class Timetable Management State
  const [selectedRoutineClass, setSelectedRoutineClass] = useState<string>('c7');
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<DayOfWeek>('Monday');
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingTimetableEntry, setEditingTimetableEntry] = useState<ClassTimetableEntry | null>(null);
  const [savingTimetable, setSavingTimetable] = useState(false);
  const [timetableForm, setTimetableForm] = useState<{
    class_id: string;
    day_of_week: DayOfWeek;
    period_number: number;
    subject: string;
    teacher_name: string;
  }>({
    class_id: 'c7',
    day_of_week: 'Monday',
    period_number: 1,
    subject: 'Bengali (বাংলা)',
    teacher_name: 'NA',
  });

  // Class-wise filter in Student Directory & Exams
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [examClassFilter, setExamClassFilter] = useState<string>('all');
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [deleteTeacherModal, setDeleteTeacherModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteExamModal, setDeleteExamModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteTimetableModal, setDeleteTimetableModal] = useState<{ id: string; description: string } | null>(null);
  const [deleteNoticeModal, setDeleteNoticeModal] = useState<{ id: string; title: string } | null>(null);

  // Exam Scheduling Form & Modal state
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ScheduledExam | null>(null);
  const [savingExam, setSavingExam] = useState(false);
  const [examForm, setExamForm] = useState({
    exam_name: '1st Unit Assessment 2026',
    class_id: '',
    subject: 'Mathematics',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:30 AM',
    duration: '2 Hours',
    full_marks: 100,
    room_number: 'Room 101',
    instructions: 'Students must carry admit card and school ID.',
  });

  // Viewing Individual Student Details Dashboard state
  const [viewingStudentDetails, setViewingStudentDetails] = useState<Student | null>(null);
  const [studentSubTab, setStudentSubTab] = useState<'profile' | 'academic' | 'attendance'>('profile');

  // Change Password Modal state
  const [passModal, setPassModal] = useState<{
    targetId: string;
    targetName: string;
    targetEmail: string;
    currentPass: string;
  } | null>(null);
  const [newPassInput, setNewPassInput] = useState('');

  // Filters for Attendance Tab
  const [attClassId, setAttClassId] = useState('');
  const [attSectionId, setAttSectionId] = useState('');
  const [attStartDate, setAttStartDate] = useState('');
  const [attEndDate, setAttEndDate] = useState('');
  const [attStudentSearch, setAttStudentSearch] = useState('');

  // Modals & Form states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    class_id: '',
    section_id: '',
    status: 'active' as const,
    father_name: '',
    father_occupation: '',
    mother_name: '',
    mother_occupation: '',
    alt_phone: '',
    email: '',
    address: '',
    aadhar_number: '',
  });
  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null);

  // Parent & Contact Info Edit Modal
  const [showParentInfoModal, setShowParentInfoModal] = useState(false);
  const [parentInfoForm, setParentInfoForm] = useState({
    father_name: '',
    father_occupation: '',
    mother_name: '',
    mother_occupation: '',
    phone: '',
    alt_phone: '',
    email: '',
    address: '',
    aadhar_number: '',
  });

  // Teacher Management & Details State
  const [viewingTeacherDetails, setViewingTeacherDetails] = useState<Profile | null>(null);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacherData, setEditingTeacherData] = useState<Profile | null>(null);
  const [teacherEditForm, setTeacherEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    qualification: '',
    specialized_subject: '',
    aadhar_number: '',
    avatar_url: '',
  });
  const [teacherPhotoFile, setTeacherPhotoFile] = useState<File | null>(null);

  // Teacher Form Modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    qualification: '',
  });

  // Parent Form Modal
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentForm, setParentForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    occupation: '',
    linked_student_id: '',
    relationship: 'Father',
  });

  // Notice Form Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    target_role: 'all' as 'all' | 'teacher' | 'parent',
    is_pinned: false,
  });

  // Confirm Dialog state for Delete Attendance
  const [deleteAttId, setDeleteAttId] = useState<string | null>(null);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading) {
      if (!role) {
        navigate({ to: '/portal/login' });
      } else if (role !== 'admin') {
        toast.error('Access Restricted: Admin clearance required.');
        if (role === 'teacher') navigate({ to: '/portal/teacher' });
        else navigate({ to: '/portal/student' });
      }
    }
  }, [role, authLoading, navigate]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const cls = await fetchClasses();
      const sec = await fetchSections();
      const st = await fetchStudents();
      const profs = await fetchProfiles();
      const att = await fetchAttendance({});
      const nots = await fetchNotices();
      const ex = await fetchScheduledExams();
      const tt = await fetchClassTimetable('all');
      const subs = await fetchSubjects();

      setClasses(cls);
      setSections(sec);
      setStudents(st);
      setTeachers(profs.filter((p) => p.role === 'teacher'));
      setParents(profs.filter((p) => p.role === 'parent'));
      setAttendanceRecords(att);
      setNotices(nots);
      setScheduledExams(ex);
      setClassTimetables(tt);
      setSubjects(subs);

      clearTeacherClasses().catch(() => {});

      if (cls.length > 0) {
        setStudentForm((prev) => ({ ...prev, class_id: cls[0].id }));
        setExamForm((prev) => ({ ...prev, class_id: cls[0].id }));
        if (!selectedRoutineClass) {
          setSelectedRoutineClass(cls[0].id);
        }
      }
      if (sec.length > 0) {
        setStudentForm((prev) => ({ ...prev, section_id: sec[0].id }));
      }
      if (st.length > 0) {
        setParentForm((prev) => ({ ...prev, linked_student_id: st[0].id }));
      }
    } catch (err: any) {
      console.error('[Admin Dashboard] Failed to load portal data:', err);
      toast.error(err?.message || 'Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  // Subject Management Handlers (Admin Only)
  const openCreateSubjectModal = () => {
    setEditingSubject(null);
    setSubjectForm({
      name: '',
      code: '',
      class_id: 'all',
      category: 'Academic',
      description: '',
    });
    setShowSubjectModal(true);
  };

  const openEditSubjectModal = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectForm({
      name: sub.name,
      code: sub.code || '',
      class_id: sub.class_id || 'all',
      category: sub.category || 'Academic',
      description: sub.description || '',
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      toast.error('Subject name is required');
      return;
    }
    setSavingSubject(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, subjectForm);
        toast.success(`Subject "${subjectForm.name}" updated successfully!`);
      } else {
        await addSubject(subjectForm);
        toast.success(`Subject "${subjectForm.name}" created successfully!`);
      }
      setShowSubjectModal(false);
      const subs = await fetchSubjects();
      setSubjects(subs);
    } catch (err: any) {
      console.error('[Admin Dashboard] Failed to save subject:', err);
      toast.error(err?.message || 'Failed to save subject');
    } finally {
      setSavingSubject(false);
    }
  };

  const confirmDeleteSubject = async () => {
    if (!deleteSubjectId) return;
    try {
      await deleteSubject(deleteSubjectId);
      toast.success('Subject deleted successfully!');
      setDeleteSubjectId(null);
      const subs = await fetchSubjects();
      setSubjects(subs);
    } catch (err: any) {
      console.error('[Admin Dashboard] Failed to delete subject:', err);
      toast.error(err?.message || 'Failed to delete subject');
    }
  };

  // Class Timetable / Daily Routine Handlers (Admin Only)
  const openCreateTimetableModal = (defaultDay?: DayOfWeek) => {
    setEditingTimetableEntry(null);
    setTimetableForm({
      class_id: selectedRoutineClass || classes[0]?.id || 'c7',
      day_of_week: defaultDay || selectedRoutineDay || 'Monday',
      period_number: 1,
      subject: subjects[0]?.name || 'Bengali (বাংলা)',
      teacher_name: teachers[0]?.full_name || 'NA',
    });
    setShowTimetableModal(true);
  };

  const openEditTimetableModal = (entry: ClassTimetableEntry) => {
    setEditingTimetableEntry(entry);
    setTimetableForm({
      class_id: entry.class_id,
      day_of_week: entry.day_of_week,
      period_number: entry.period_number,
      subject: entry.subject,
      teacher_name: entry.teacher_name || 'NA',
    });
    setShowTimetableModal(true);
  };

  const handleSaveTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableForm.class_id || !timetableForm.subject || !timetableForm.teacher_name || !timetableForm.period_number) {
      toast.error('Please fill in all required routine fields.');
      return;
    }

    setSavingTimetable(true);
    try {
      if (editingTimetableEntry) {
        await updateClassTimetableEntry(editingTimetableEntry.id, {
          class_id: timetableForm.class_id,
          day_of_week: timetableForm.day_of_week,
          period_number: Number(timetableForm.period_number) || 1,
          start_time: '',
          end_time: '',
          subject: timetableForm.subject.trim(),
          teacher_name: timetableForm.teacher_name.trim(),
          room_number: '',
        });
        toast.success('Timetable period updated successfully!');
      } else {
        await addClassTimetableEntry({
          class_id: timetableForm.class_id,
          day_of_week: timetableForm.day_of_week,
          period_number: Number(timetableForm.period_number) || 1,
          start_time: '',
          end_time: '',
          subject: timetableForm.subject.trim(),
          teacher_name: timetableForm.teacher_name.trim(),
          room_number: '',
        });
        toast.success('Period slot added to timetable!');
      }
      setShowTimetableModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save timetable slot');
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleDeleteTimetable = (id: string, subject: string, day: string, period: number) => {
    setDeleteTimetableModal({ id, description: `Period ${period} (${subject}) on ${day}` });
  };

  const confirmDeleteTimetable = async () => {
    if (!deleteTimetableModal) return;
    try {
      await deleteClassTimetableEntry(deleteTimetableModal.id);
      toast.success('Timetable period deleted.');
      setDeleteTimetableModal(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete timetable slot');
    }
  };

  // Exam Scheduling Handlers
  const openCreateExamModal = () => {
    setEditingExam(null);
    setExamForm({
      exam_name: '1st Unit Assessment 2026',
      class_id: classes[0]?.id || 'c5',
      subject: 'Mathematics',
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      time: '10:30 AM',
      duration: '2 Hours',
      full_marks: 100,
      room_number: 'Room 101',
      instructions: 'Students must carry admit card and school ID card.',
    });
    setShowExamModal(true);
  };

  const openEditExamModal = (exam: ScheduledExam) => {
    setEditingExam(exam);
    setExamForm({
      exam_name: exam.exam_name,
      class_id: exam.class_id,
      subject: exam.subject,
      date: exam.date,
      time: exam.time,
      duration: exam.duration,
      full_marks: Number(exam.full_marks) || 100,
      room_number: exam.room_number || '',
      instructions: exam.instructions || '',
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.exam_name || !examForm.subject || !examForm.date || !examForm.time || !examForm.class_id) {
      toast.error('Please fill in all required exam fields.');
      return;
    }

    setSavingExam(true);
    const adminName = profile?.full_name ? `${profile.full_name} (Admin)` : 'School Admin';
    try {
      if (editingExam) {
        await updateScheduledExam(editingExam.id, {
          exam_name: examForm.exam_name.trim(),
          class_id: examForm.class_id,
          subject: examForm.subject.trim(),
          date: parseDateToISO(examForm.date),
          time: examForm.time.trim(),
          duration: examForm.duration.trim(),
          full_marks: Number(examForm.full_marks) || 100,
          room_number: examForm.room_number?.trim(),
          instructions: examForm.instructions?.trim(),
          updated_by_name: adminName,
        });
        toast.success('Exam schedule updated successfully!');
      } else {
        await addScheduledExam({
          exam_name: examForm.exam_name.trim(),
          class_id: examForm.class_id,
          subject: examForm.subject.trim(),
          date: parseDateToISO(examForm.date),
          time: examForm.time.trim(),
          duration: examForm.duration.trim(),
          full_marks: Number(examForm.full_marks) || 100,
          room_number: examForm.room_number?.trim(),
          instructions: examForm.instructions?.trim(),
          created_by: user?.id || 'admin',
          created_by_name: adminName,
        });
        toast.success('New exam scheduled successfully!');
      }
      setShowExamModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save exam');
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = (id: string, name: string) => {
    setDeleteExamModal({ id, name });
  };

  const confirmDeleteExam = async () => {
    if (!deleteExamModal) return;
    try {
      await deleteScheduledExam(deleteExamModal.id);
      toast.success('Exam deleted successfully.');
      setDeleteExamModal(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exam');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter attendance records based on filter inputs
  const filteredAttendance = attendanceRecords.filter((rec) => {
    if (attClassId && rec.class_id !== attClassId) return false;
    if (attSectionId && rec.section_id !== attSectionId) return false;
    if (attStartDate && rec.date < parseDateToISO(attStartDate)) return false;
    if (attEndDate && rec.date > parseDateToISO(attEndDate)) return false;
    if (attStudentSearch) {
      const query = attStudentSearch.toLowerCase();
      const matchName = rec.student_name?.toLowerCase().includes(query);
      const matchRoll = rec.roll_number?.toLowerCase().includes(query);
      if (!matchName && !matchRoll) return false;
    }
    return true;
  });

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredAttendance.length === 0) {
      toast.error('No attendance records found matching current filters to export.');
      return;
    }
    exportAttendanceToExcel(filteredAttendance, 'RKVM_Attendance_Export');
    toast.success(`Successfully exported ${filteredAttendance.length} attendance records to Excel!`);
  };

  // Handle Save Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let avatar_url = editingStudent?.avatar_url;
      if (studentPhotoFile) {
        avatar_url = await uploadProfilePhoto(studentPhotoFile, 'students');
      }

      if (editingStudent) {
        const updated = await updateStudent(editingStudent.id, {
          ...studentForm,
          avatar_url,
        });
        toast.success('Student updated successfully!');
        if (viewingStudentDetails?.id === editingStudent.id) {
          setViewingStudentDetails(updated);
        }
      } else {
        await addStudent({
          ...studentForm,
          avatar_url,
        });
        toast.success('New student added successfully!');
      }
      setShowStudentModal(false);
      setEditingStudent(null);
      setStudentPhotoFile(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student');
    }
  };

  // Open Edit Parent & Contact Info Modal
  const openEditParentInfoModal = (st: Student) => {
    setParentInfoForm({
      father_name: st.father_name || '',
      father_occupation: st.father_occupation || '',
      mother_name: st.mother_name || '',
      mother_occupation: st.mother_occupation || '',
      phone: st.phone || '',
      alt_phone: st.alt_phone || '',
      email: st.email || '',
      address: st.address || '',
      aadhar_number: st.aadhar_number || '',
    });
    setShowParentInfoModal(true);
  };

  // Save Parent & Contact Info
  const handleSaveParentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingStudentDetails) return;
    try {
      const updated = await updateStudent(viewingStudentDetails.id, {
        father_name: parentInfoForm.father_name.trim(),
        father_occupation: parentInfoForm.father_occupation.trim(),
        mother_name: parentInfoForm.mother_name.trim(),
        mother_occupation: parentInfoForm.mother_occupation.trim(),
        phone: parentInfoForm.phone.trim(),
        alt_phone: parentInfoForm.alt_phone.trim(),
        email: parentInfoForm.email.trim(),
        address: parentInfoForm.address.trim(),
        aadhar_number: parentInfoForm.aadhar_number.trim(),
      });
      setViewingStudentDetails(updated);
      setShowParentInfoModal(false);
      toast.success('Parent & Contact Information updated successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update parent information');
    }
  };

  // Handle Delete Student Confirmation
  const confirmDeleteStudent = async () => {
    if (!deleteStudentId) return;
    try {
      await deleteStudent(deleteStudentId);
      toast.success('Student record removed successfully!');
      setDeleteStudentId(null);
      if (viewingStudentDetails?.id === deleteStudentId) {
        setViewingStudentDetails(null);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove student');
    }
  };

  // Handle Photo Approval Actions
  const handleApprovePhoto = async (studentId: string) => {
    try {
      const updated = await approveStudentPhotoChange(studentId);
      toast.success('Student profile photo approved successfully!');
      if (viewingStudentDetails?.id === studentId) {
        setViewingStudentDetails(updated);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve photo');
    }
  };

  const handleRejectPhoto = async (studentId: string) => {
    try {
      const updated = await rejectStudentPhotoChange(studentId);
      toast.success('Photo request rejected and permanently deleted from database.');
      if (viewingStudentDetails?.id === studentId) {
        setViewingStudentDetails(updated);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject photo');
    }
  };

  // Handle Save Teacher (Requires only Name and Mobile Number)
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trimmedName = teacherForm.full_name.trim();
      if (!trimmedName) {
        toast.error('Please enter the teacher\'s full name.');
        return;
      }

      const cleanPhone = teacherForm.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        toast.error('Please enter a valid 10-digit mobile number.');
        return;
      }

      // Email is optional - store 'NA' if no email is entered
      const teacherEmail = teacherForm.email?.trim() || 'NA';
      const defaultPassword = generateTeacherDefaultPassword(trimmedName);

      const newProf = await addProfile({
        full_name: trimmedName,
        email: teacherEmail,
        phone: cleanPhone,
        role: 'teacher',
        portal_password: defaultPassword,
      });

      toast.success(`Teacher account created for ${trimmedName}! Default Password: ${defaultPassword}`);
      setShowTeacherModal(false);
      setTeacherForm({
        full_name: '',
        email: '',
        phone: '',
        employee_id: '',
        qualification: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create teacher account');
    }
  };

  // Handle Delete Teacher Confirmation
  const confirmDeleteTeacher = async () => {
    if (!deleteTeacherModal) return;
    try {
      await deleteProfile(deleteTeacherModal.id);
      toast.success('Teacher account deleted successfully.');
      setDeleteTeacherModal(null);
      if (viewingTeacherDetails?.id === deleteTeacherModal.id) {
        setViewingTeacherDetails(null);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete teacher account');
    }
  };

  // Open Edit Teacher Modal
  const openEditTeacherModal = (t: Profile) => {
    setEditingTeacherData(t);
    setTeacherPhotoFile(null);
    setTeacherEditForm({
      full_name: t.full_name || '',
      email: isSyntheticEmail(t.email, t.phone) ? '' : (t.email || ''),
      phone: t.phone || '',
      address: t.address || '',
      qualification: t.qualification || '',
      specialized_subject: t.specialized_subject || '',
      aadhar_number: t.aadhar_number || '',
      avatar_url: t.avatar_url || '',
    });
    setShowEditTeacherModal(true);
  };

  // Save Teacher Details Edit
  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherData) return;
    try {
      let avatar_url = editingTeacherData.avatar_url;
      if (teacherPhotoFile) {
        avatar_url = await uploadProfilePhoto(teacherPhotoFile, 'teachers');
      }

      const updated = await updateProfile(editingTeacherData.id, {
        full_name: teacherEditForm.full_name.trim(),
        email: (isSyntheticEmail(teacherEditForm.email, teacherEditForm.phone) || !teacherEditForm.email.trim()) ? 'NA' : teacherEditForm.email.trim(),
        phone: teacherEditForm.phone.trim(),
        address: teacherEditForm.address.trim(),
        qualification: teacherEditForm.qualification.trim(),
        specialized_subject: teacherEditForm.specialized_subject.trim(),
        aadhar_number: teacherEditForm.aadhar_number.trim(),
        avatar_url,
      });

      if (viewingTeacherDetails?.id === editingTeacherData.id) {
        setViewingTeacherDetails(updated);
      }
      setShowEditTeacherModal(false);
      setEditingTeacherData(null);
      setTeacherPhotoFile(null);
      toast.success('Teacher details updated successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update teacher details');
    }
  };

  // Handle Save Parent
  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProf = await addProfile({
        full_name: parentForm.full_name,
        email: parentForm.email,
        phone: parentForm.phone,
        role: 'parent',
      });

      if (parentForm.linked_student_id) {
        await linkParentToStudent(newProf.id, parentForm.linked_student_id, parentForm.relationship);
      }

      toast.success('Parent account created & linked to student!');
      setShowParentModal(false);
      setParentForm({
        full_name: '',
        email: '',
        phone: '',
        occupation: '',
        linked_student_id: students[0]?.id || '',
        relationship: 'Father',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create parent account');
    }
  };

  // Handle Save Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addNotice({
        title: noticeForm.title,
        content: noticeForm.content,
        target_role: noticeForm.target_role,
        is_pinned: noticeForm.is_pinned,
        created_by: 'u-admin-1',
      });
      toast.success('Notice published successfully!');
      setShowNoticeModal(false);
      setNoticeForm({ title: '', content: '', target_role: 'all', is_pinned: false });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish notice');
    }
  };

  // Handle Delete Attendance Confirmation
  const confirmDeleteAttendance = async () => {
    if (!deleteAttId) return;
    try {
      await deleteAttendanceRecord(deleteAttId);
      toast.success('Attendance record permanently deleted.');
      setDeleteAttId(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete attendance record.');
    }
  };

  if (authLoading || (loading && students.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Loading RKVM Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <PortalHeader title="Admin Command Center" />

      {/* Navigation Sub-Header Tabs */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs sticky top-[57px] z-30">
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 no-scrollbar">
          <div className="flex space-x-1 py-2">
            {[
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'students', label: `Students (${students.length})`, icon: GraduationCap },
              { id: 'teachers', label: `Teachers (${teachers.length})`, icon: UserCheck },
              { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
              { id: 'attendance', label: 'Attendance & Export', icon: FileSpreadsheet },
              { id: 'timetable', label: `Class Routine (${classTimetables.length})`, icon: Clock },
              { id: 'exams', label: `Exams & Timetables (${scheduledExams.length})`, icon: Calendar },
              { id: 'notices', label: `Notices (${notices.length})`, icon: Megaphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Stat Cards (6-Column Layout) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Students
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <GraduationCap className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{students.length}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Enrolled</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Teachers
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <UserCheck className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{teachers.length}</span>
                  <span className="text-[11px] text-amber-600 font-semibold">Staff</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Classes
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <BookOpen className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{classes.length}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Grades</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Attendance
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <FileSpreadsheet className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{attendanceRecords.length}</span>
                  <span className="text-[11px] text-indigo-600 font-semibold">Entries</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Routine Slots
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
                    <Clock className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{classTimetables.length}</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Periods</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Scheduled Exams
                  </span>
                  <span className="grid size-9 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                    <Calendar className="size-4.5" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{scheduledExams.length}</span>
                  <span className="text-[11px] text-purple-600 font-semibold">Timetables</span>
                </div>
              </div>
            </div>

            {/* PENDING PHOTO VERIFICATION QUEUE (Shown when students submit new photos) */}
            {(() => {
              const pendingPhotos = students.filter(
                (s) => s.pending_avatar_url && s.pending_avatar_status === 'pending'
              );
              if (pendingPhotos.length === 0) return null;
              return (
                <div className="rounded-3xl border border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="size-5 text-amber-600" />
                      <h3 className="text-base font-bold text-foreground">
                        Student Photo Approval Requests ({pendingPhotos.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-full">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The following students have uploaded new photos from their portal. Review each photo to approve it for their official profile or reject and delete it.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {pendingPhotos.map((st) => (
                      <div
                        key={st.id}
                        className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {st.first_name} {st.last_name}
                            </p>
                            <p className="text-xs text-primary font-semibold">
                              {st.class_name || 'Class 5'} • Roll #{st.roll_number}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {st.id}
                          </span>
                        </div>

                        {/* Photo Comparison: Current vs New */}
                        <div className="flex items-center justify-around bg-muted/40 p-3 rounded-xl border border-border/50">
                          <div className="text-center space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Current</span>
                            {st.avatar_url ? (
                              <img
                                src={st.avatar_url}
                                alt="Current"
                                className="size-14 rounded-xl object-cover border border-border mx-auto opacity-70"
                              />
                            ) : (
                              <div className="size-14 rounded-xl bg-muted grid place-items-center text-xs font-bold text-muted-foreground mx-auto">
                                None
                              </div>
                            )}
                          </div>

                          <span className="text-base font-bold text-muted-foreground">→</span>

                          <div className="text-center space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase block">New Upload</span>
                            <img
                              src={st.pending_avatar_url}
                              alt="New Uploaded"
                              className="size-14 rounded-xl object-cover border-2 border-emerald-500 mx-auto shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Approval Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApprovePhoto(st.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPhoto(st.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="size-5 text-primary" />
                  Student Management
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enroll new students, assign roll numbers, classes, sections, and upload profile pictures.
                </p>
                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setStudentPhotoFile(null);
                    setStudentForm({
                      roll_number: '',
                      first_name: '',
                      last_name: '',
                      phone: '',
                      date_of_birth: '',
                      gender: 'Male',
                      class_id: classes[0]?.id || '',
                      section_id: sections[0]?.id || '',
                      status: 'active',
                    });
                    setShowStudentModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors"
                >
                  <Plus className="size-4" />
                  Add New Student
                </button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="size-5 text-amber-600" />
                  Teacher Onboarding
                </h3>
                <p className="text-xs text-muted-foreground">
                  Create teacher credentials and assign them to specific classes and sections for attendance marking.
                </p>
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-amber-700 transition-colors"
                >
                  <Plus className="size-4" />
                  Create Teacher Account
                </button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="size-5 text-emerald-600" />
                  Attendance & Reports
                </h3>
                <p className="text-xs text-muted-foreground">
                  Filter historical attendance by date range, class, or student and export instantly to Excel.
                </p>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="size-4" />
                  Open Attendance Register
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {viewingStudentDetails ? (
              /* FULL PAGE INDIVIDUAL STUDENT DASHBOARD VIEW (NO POPUP) */
              (() => {
                const st = viewingStudentDetails;
                const studentAtt = attendanceRecords.filter((a) => a.student_id === st.id);
                const total = studentAtt.length;
                const present = studentAtt.filter((a) => a.status === 'present').length;
                const absent = studentAtt.filter((a) => a.status === 'absent').length;
                const rate = total > 0 ? Math.round((present / total) * 100) : 100;

                return (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setViewingStudentDetails(null)}
                        className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors shadow-soft"
                      >
                        <ArrowLeft className="size-4" />
                        Back to Student Directory
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDeleteStudentId(st.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors shadow-soft"
                        >
                          <Trash2 className="size-4" />
                          Delete Student
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              roll_number: st.roll_number,
                              first_name: st.first_name,
                              last_name: st.last_name,
                              phone: st.phone || '',
                              date_of_birth: formatDateSlash(st.date_of_birth) || '',
                              gender: st.gender || 'Male',
                              class_id: st.class_id,
                              section_id: st.section_id,
                              status: st.status,
                              father_name: st.father_name || '',
                              father_occupation: st.father_occupation || '',
                              mother_name: st.mother_name || '',
                              mother_occupation: st.mother_occupation || '',
                              alt_phone: st.alt_phone || '',
                              email: st.email || '',
                              address: st.address || '',
                              aadhar_number: st.aadhar_number || '',
                            });
                            setShowStudentModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors"
                        >
                          <Edit2 className="size-4" />
                          Edit Profile Details
                        </button>
                      </div>
                    </div>

                    {/* PENDING PHOTO APPROVAL BANNER IN STUDENT DETAILS */}
                    {st.pending_avatar_url && st.pending_avatar_status === 'pending' && (
                      <div className="rounded-3xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 p-6 shadow-soft space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="size-5 text-amber-600" />
                            <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">
                              Student Uploaded a New Photo — Action Required
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-900/80 px-2.5 py-1 rounded-full">
                            Pending Verification
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
                          <div className="flex items-center gap-6">
                            <div className="text-center space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Current Photo</span>
                              {st.avatar_url ? (
                                <img src={st.avatar_url} alt="Current" className="size-20 rounded-2xl object-cover border border-border" />
                              ) : (
                                <div className="size-20 rounded-2xl bg-muted grid place-items-center text-xs font-bold text-muted-foreground">None</div>
                              )}
                            </div>

                            <span className="text-xl font-bold text-muted-foreground">→</span>

                            <div className="text-center space-y-1">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase block">New Uploaded Photo</span>
                              <img src={st.pending_avatar_url} alt="New upload" className="size-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleApprovePhoto(st.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle2 className="size-4" />
                              Approve & Update Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectPhoto(st.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors"
                            >
                              <Trash2 className="size-4" />
                              Reject & Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FIXED ALWAYS-VISIBLE STUDENT PROFILE BANNER */}
                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          {st.avatar_url ? (
                            <img
                              src={st.avatar_url}
                              alt={st.first_name}
                              className="size-24 rounded-3xl object-cover border-2 border-primary shadow-soft shrink-0"
                            />
                          ) : (
                            <div className="grid size-24 place-items-center rounded-3xl bg-primary/10 text-primary font-extrabold text-3xl border-2 border-primary shrink-0">
                              {st.first_name.charAt(0)}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                {st.first_name} {st.last_name}
                              </h2>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                                  st.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                <ShieldCheck className="size-3.5" />
                                {st.status}
                              </span>
                            </div>

                            <p className="text-sm font-bold text-primary">
                              {st.class_name || 'Class 5'} — {st.section_name || 'Section A'} • Roll Number: <span className="font-mono text-foreground font-extrabold">#{st.roll_number}</span>
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Mobile: <strong className="text-foreground">{st.phone || 'Not set'}</strong> • DOB: <strong className="text-foreground">{formatDateDDMMYYYY(st.date_of_birth) || 'N/A'}</strong> • Gender: <strong className="text-foreground">{st.gender || 'Male'}</strong> • Aadhar: <strong className="text-foreground font-mono">{st.aadhar_number || 'Not provided'}</strong> • System ID: <span className="font-mono">{st.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Top Performance Badge */}
                        <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center md:text-right shrink-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Academic & Attendance Status
                          </span>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block mt-1">
                            Evaluation Pending
                          </span>
                          <span className="text-xs text-muted-foreground font-medium block">
                            Attendance Rate: 100% • Official Record
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SUB-TABS NAVIGATION BAR (Placed after fixed student profile banner) */}
                    <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
                      {[
                        { id: 'parent', label: 'Parent & Guardian Details', icon: Users },
                        { id: 'academic', label: 'Academic Marks & Grades', icon: BookOpen },
                        { id: 'attendance', label: 'Attendance & History Log', icon: Calendar },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = studentSubTab === tab.id || (studentSubTab === 'profile' && tab.id === 'parent');
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStudentSubTab(tab.id as any)}
                            className={`flex items-center gap-2 rounded-2xl px-4.5 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                              active
                                ? 'bg-primary text-primary-foreground shadow-soft'
                                : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Icon className="size-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* SUB-TAB CONTENT 1: PARENT & GUARDIAN DETAILS & STUDENT CREDENTIALS */}
                    {(studentSubTab === 'parent' || studentSubTab === 'profile') && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Student Portal Credentials Card */}
                        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-soft space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <KeyRound className="size-5 text-primary" />
                                Student Portal Login Credentials
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Credentials generated by School Admin for student login access.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const pass = st.portal_password || generateDefaultPassword(st.first_name, st.date_of_birth);
                                const email = st.phone || st.email || `${st.first_name.toLowerCase()}.st@rkvmschool.in`;
                                setPassModal({
                                  targetId: st.id,
                                  targetName: st.first_name,
                                  targetEmail: email,
                                  currentPass: pass,
                                });
                                setNewPassInput(pass);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors shrink-0"
                            >
                              <Lock className="size-3.5" />
                              Change Password
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-primary/10">
                            <div className="rounded-2xl bg-card p-4 border border-border space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Login Mobile Number</span>
                              <p className="text-sm font-mono font-bold text-foreground">
                                {st.phone || st.email || 'Not provided'}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-card p-4 border border-border space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Portal Password</span>
                              <p className="text-sm font-mono font-bold text-primary">
                                {st.portal_password || generateDefaultPassword(st.first_name, st.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                              <Users className="size-5 text-emerald-600" />
                              Parent, Guardian & Contact Information
                            </h3>
                            <button
                              type="button"
                              onClick={() => openEditParentInfoModal(st)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-soft transition-colors self-start sm:self-auto cursor-pointer"
                            >
                              <Edit3 className="size-3.5" />
                              Edit Contact & Parent Info
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-border/60">
                            {/* Father Information */}
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                                Father's Details
                              </span>
                              <p className="text-sm font-bold text-foreground">
                                {st.father_name || 'Not provided'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Occupation: <strong className="text-foreground">{st.father_occupation || 'Not provided'}</strong>
                              </p>
                            </div>

                            {/* Mother Information */}
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                                Mother's Details
                              </span>
                              <p className="text-sm font-bold text-foreground">
                                {st.mother_name || 'Not provided'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Occupation: <strong className="text-foreground">{st.mother_occupation || 'Homemaker'}</strong>
                              </p>
                            </div>

                            {/* Aadhar Card Number */}
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                                Aadhar Card Number
                              </span>
                              <p className="text-sm font-mono font-bold text-foreground flex items-center gap-1.5">
                                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                                {st.aadhar_number || 'Not provided'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Government ID Verification
                              </p>
                            </div>

                            {/* Contact Numbers */}
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                                Contact Numbers
                              </span>
                              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Phone className="size-3.5 text-emerald-600" />
                                Primary: {st.phone || 'Not provided'}
                              </p>
                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Phone className="size-3.5 text-indigo-500" />
                                Alternative: {st.alt_phone || 'None'}
                              </p>
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                <Mail className="size-3.5 text-primary" />
                                {st.email || 'No email set'}
                              </p>
                            </div>

                            {/* Residential Address */}
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                                Residential Address
                              </span>
                              <p className="text-xs font-semibold text-foreground leading-relaxed">
                                {st.address || 'Keshiary, Paschim Medinipur, West Bengal - 721133'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 2: ACADEMIC MARKS & GRADES */}
                    {studentSubTab === 'academic' && (
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <BookOpen className="size-5 text-primary" />
                            Academic Marks & Assessment Records
                          </h3>
                        </div>

                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                          <p className="font-semibold text-foreground">Examination Marks Managed by Class Teachers</p>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Class subject teachers record and publish unit assessment and terminal evaluation marks directly from the Teacher Portal. Once submitted, marks are reflected on official student report cards.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 3: ATTENDANCE & HISTORY LOG */}
                    {studentSubTab === 'attendance' && (
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Calendar className="size-5 text-indigo-600" />
                            Individual Attendance Analytics & Historical Log
                          </h3>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                            Attendance Rate: {rate}%
                          </span>
                        </div>

                        {/* Stat Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Attendance Rate</span>
                            <span className="text-3xl font-extrabold text-primary">{rate}%</span>
                          </div>

                          <div className="rounded-2xl bg-muted/40 p-4 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Days Logged</span>
                            <span className="text-2xl font-bold text-foreground">{total}</span>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 p-4 text-center">
                            <span className="text-[10px] font-bold uppercase block">Days Present</span>
                            <span className="text-2xl font-bold">{present}</span>
                          </div>

                          <div className="rounded-2xl bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 p-4 text-center">
                            <span className="text-[10px] font-bold uppercase block">Days Absent</span>
                            <span className="text-2xl font-bold">{absent}</span>
                          </div>
                        </div>

                        {/* Attendance Log Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                              <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Marked By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                              {studentAtt.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                    No attendance records logged yet for this student.
                                  </td>
                                </tr>
                              ) : (
                                studentAtt.map((att) => (
                                  <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-foreground">{formatDateDDMMYYYY(att.date)}</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                          att.status === 'present'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        }`}
                                      >
                                        {att.status === 'present' ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                                        {att.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{att.marked_by_name || 'Class Teacher'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* Student Directory Table */
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Student Directory</h2>
                    <p className="text-xs text-muted-foreground">
                      Manage student profiles, roll numbers, classes, and sections.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Class-wise Filter Dropdown */}
                    <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold shadow-xs">
                      <Filter className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Class:</span>
                      <select
                        value={filterClassId}
                        onChange={(e) => setFilterClassId(e.target.value)}
                        className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Classes ({students.length})</option>
                        {classes.map((c) => {
                          const count = students.filter((s) => s.class_id === c.id).length;
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} ({count})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudent(null);
                        setStudentPhotoFile(null);
                        setStudentForm({
                          roll_number: '',
                          first_name: '',
                          last_name: '',
                          phone: '',
                          date_of_birth: '',
                          gender: 'Male',
                          class_id: filterClassId !== 'all' ? filterClassId : (classes[0]?.id || ''),
                          section_id: sections[0]?.id || '',
                          status: 'active',
                        });
                        setShowStudentModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors"
                    >
                      <Plus className="size-4" />
                      Add Student
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-4 py-4 text-center w-16">Sl No.</th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Roll No.</th>
                          <th className="px-6 py-4">Class & Section</th>
                          <th className="px-6 py-4">Gender</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(() => {
                          const filtered = students.filter((s) => filterClassId === 'all' || s.class_id === filterClassId);
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground font-medium">
                                  {students.length === 0
                                    ? 'No students registered yet. Click "Add Student" above to create your first student account.'
                                    : 'No students found in the selected class.'}
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((st, index) => (
                            <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-4 text-center font-mono font-bold text-xs text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 flex items-center gap-3">
                                {st.avatar_url ? (
                                  <img
                                    src={st.avatar_url}
                                    alt={st.first_name}
                                    className="size-10 rounded-full object-cover border border-primary/20 shrink-0"
                                  />
                                ) : (
                                  <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                                    {st.first_name ? st.first_name.charAt(0) : 'S'}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-foreground">
                                    {st.first_name} {st.last_name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Mobile: <strong className="text-foreground">{st.phone || 'Not set'}</strong> • DOB: <strong className="text-foreground">{formatDateDDMMYYYY(st.date_of_birth) || 'N/A'}</strong>
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-primary">#{st.roll_number}</td>
                              <td className="px-6 py-4 font-semibold text-foreground">
                                {st.class_name || 'Class 5'} — {st.section_name || 'Section A'}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{st.gender || 'Male'}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    st.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  <CheckCircle className="size-3" />
                                  {st.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setViewingStudentDetails(st)}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                  >
                                    <Eye className="size-3.5" />
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteStudentId(st.id)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {viewingTeacherDetails ? (
              /* FULL PAGE INDIVIDUAL TEACHER DETAILS VIEW */
              (() => {
                const t = viewingTeacherDetails;
                const teacherDefaultPass = generateTeacherDefaultPassword(t.full_name);
                const displayPassword = (!t.portal_password || t.portal_password.endsWith('@2011'))
                  ? teacherDefaultPass
                  : t.portal_password;

                return (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setViewingTeacherDetails(null)}
                        className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors shadow-soft cursor-pointer"
                      >
                        <ArrowLeft className="size-4" />
                        Back to Teacher Directory
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDeleteTeacherModal({ id: t.id, name: t.full_name })}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors shadow-soft cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                          Delete Teacher
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTeacherModal(t)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-colors cursor-pointer"
                        >
                          <Edit2 className="size-4" />
                          Edit Teacher Details
                        </button>
                      </div>
                    </div>

                    {/* Teacher Profile Banner */}
                    <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                          <div className="relative group">
                            {t.avatar_url ? (
                              <img
                                src={t.avatar_url}
                                alt={t.full_name}
                                className="size-20 rounded-3xl object-cover border-2 border-amber-500/30 shadow-md"
                              />
                            ) : (
                              <div className="grid size-20 place-items-center rounded-3xl bg-amber-500/10 text-amber-600 font-bold text-2xl border border-amber-500/20 shadow-soft">
                                {t.full_name ? t.full_name.charAt(0) : 'T'}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditTeacherModal(t)}
                              className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-amber-600 text-white grid place-items-center shadow-md hover:bg-amber-700 transition-transform active:scale-90 cursor-pointer"
                              title="Update Photo"
                            >
                              <Camera className="size-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                                {t.full_name}
                              </h2>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 text-xs font-extrabold uppercase">
                                <ShieldCheck className="size-3.5" />
                                Teacher
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold uppercase">
                                <CheckCircle className="size-3.5" />
                                Active
                              </span>
                            </div>

                            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                              Teacher ID: <span className="font-mono text-foreground font-extrabold">#{t.id}</span>
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Mobile: <strong className="text-foreground font-mono">{t.phone || 'Not set'}</strong> • Email: <span className="font-mono text-foreground">{formatDisplayEmail(t.email, t.phone)}</span> • Specialization: <strong className="text-foreground">{t.specialized_subject || 'General'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Verification Clearance Badge */}
                        <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center md:text-right shrink-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Faculty Clearance
                          </span>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block mt-1">
                            Verified Teacher
                          </span>
                          <span className="text-xs text-muted-foreground font-medium block">
                            Attendance & Marks Authorization
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Details Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Card 1: Personal & Government Identification */}
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <User className="size-4 text-amber-600" />
                            Personal & Government Identity
                          </h3>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                              Aadhar Card Number
                            </span>
                            <p className="text-sm font-mono font-bold text-foreground flex items-center gap-1.5">
                              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                              {t.aadhar_number || 'Not provided'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">National Unique Identification</p>
                          </div>

                          <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                              Contact Mobile & Email
                            </span>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono">
                              <Phone className="size-3.5 text-emerald-600 shrink-0" />
                              {t.phone || 'Not provided'}
                            </p>
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 font-mono truncate">
                              <Mail className="size-3.5 text-amber-600 shrink-0" />
                              {formatDisplayEmail(t.email, t.phone)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                              Residential Address
                            </span>
                            <p className="text-xs text-foreground font-medium leading-relaxed">
                              {t.address || 'Address not entered yet. Click "Edit Teacher Details" to add.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Academic & Teaching Qualifications */}
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <GraduationCap className="size-4 text-amber-600" />
                            Academic & Teaching Credentials
                          </h3>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                              Educational Qualification
                            </span>
                            <p className="text-sm font-bold text-foreground">
                              {t.qualification || 'Not provided'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">e.g. M.Sc, M.A, B.Ed, D.El.Ed</p>
                          </div>

                          <div className="rounded-2xl bg-muted/30 p-3.5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                              Subject Specialization
                            </span>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                              {t.specialized_subject || 'Not specified'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">Primary teaching subject</p>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Portal Login & Security Credentials */}
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <KeyRound className="size-4 text-amber-600" />
                            Portal Credentials & Security
                          </h3>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-3.5 border border-amber-200/50 dark:border-amber-900/50 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block tracking-wider">
                              Login Username (Mobile)
                            </span>
                            <p className="text-sm font-mono font-bold text-amber-950 dark:text-amber-100">
                              {t.phone || (formatDisplayEmail(t.email, t.phone) !== 'NA' ? t.email : t.id)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-3.5 border border-amber-200/50 dark:border-amber-900/50 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block tracking-wider">
                              Current Portal Password
                            </span>
                            <p className="text-sm font-mono font-bold text-amber-950 dark:text-amber-100">
                              {displayPassword}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPassModal({
                                targetId: t.id,
                                targetName: t.full_name,
                                targetEmail: t.email,
                                currentPass: displayPassword,
                              });
                              setNewPassInput(displayPassword);
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-xs font-bold shadow-soft transition-colors cursor-pointer"
                          >
                            <Lock className="size-3.5" />
                            Change Portal Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Teacher Directory</h2>
                    <p className="text-xs text-muted-foreground">
                      View and add authorized teachers and class assignments.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTeacherModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-amber-700 transition-colors"
                  >
                    <Plus className="size-4" />
                    Add Teacher Account
                  </button>
                </div>

            {/* TEACHER DIRECTORY TABLE */}
            <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-4 text-center w-16">Sl No.</th>
                      <th className="px-6 py-4">Teacher</th>
                      <th className="px-6 py-4">Teacher ID</th>
                      <th className="px-6 py-4">Specialization</th>
                      <th className="px-6 py-4">Portal Password</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teachers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground font-medium">
                          No teachers onboarded yet. Click "Add Teacher Account" above to onboard your first teacher.
                        </td>
                      </tr>
                    ) : (
                      teachers.map((t, index) => {
                        const teacherDefaultPass = generateTeacherDefaultPassword(t.full_name);
                        const displayPassword = (!t.portal_password || t.portal_password.endsWith('@2011'))
                          ? teacherDefaultPass
                          : t.portal_password;

                        return (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            {/* SL NO */}
                            <td className="px-4 py-4 text-center font-mono font-bold text-xs text-muted-foreground">
                              {index + 1}
                            </td>

                            {/* TEACHER */}
                            <td className="px-6 py-4 flex items-center gap-3">
                              {t.avatar_url ? (
                                <img
                                  src={t.avatar_url}
                                  alt={t.full_name}
                                  className="size-10 rounded-full object-cover border border-amber-500/20 shrink-0"
                                />
                              ) : (
                                <div className="grid size-10 place-items-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs shrink-0">
                                  {t.full_name ? t.full_name.charAt(0) : 'T'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-foreground">{t.full_name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  Mobile: <strong className="text-foreground font-mono">{t.phone || 'Not set'}</strong> • Email: <span className="font-mono text-muted-foreground">{formatDisplayEmail(t.email, t.phone)}</span>
                                </p>
                              </div>
                            </td>

                            {/* TEACHER ID */}
                            <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                              #{t.id}
                            </td>

                            {/* SPECIALIZATION */}
                            <td className="px-6 py-4 font-semibold text-foreground">
                              {t.specialized_subject || 'General'}
                            </td>

                            {/* PORTAL PASSWORD */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 px-3 py-1 text-xs font-mono font-bold text-amber-900 dark:text-amber-200 shadow-2xs">
                                <KeyRound className="size-3 text-amber-600" />
                                {displayPassword}
                              </span>
                            </td>

                            {/* STATUS */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <CheckCircle className="size-3" />
                                active
                              </span>
                            </td>

                            {/* ACTIONS */}
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingTeacherDetails(t)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                                  title="View Details"
                                >
                                  <Eye className="size-3.5" />
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPassModal({
                                      targetId: t.id,
                                      targetName: t.full_name,
                                      targetEmail: t.email,
                                      currentPass: displayPassword,
                                    });
                                    setNewPassInput(displayPassword);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                                  title="Change Password"
                                >
                                  <Lock className="size-3.5" />
                                  Change Password
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTeacherModal({ id: t.id, name: t.full_name })}
                                  className="inline-flex items-center gap-1 rounded-xl border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
                                  title="Delete Teacher"
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* SUBJECTS MANAGEMENT TAB (ADMIN ONLY) */}
        {activeTab === 'subjects' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Filter Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    School Curriculum & Subjects Directory
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure curriculum subjects, course codes, syllabus classification, and assign them across grade levels.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openCreateSubjectModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all"
                  >
                    <Plus className="size-4" />
                    Add New Subject
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                {/* Search */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Search Subject / Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Mathematics, BEN..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  </div>
                </div>

                {/* Class Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Filter by Class
                  </label>
                  <select
                    value={selectedSubjectClass}
                    onChange={(e) => setSelectedSubjectClass(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All Classes / Grades</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Filter by Category
                  </label>
                  <select
                    value={selectedSubjectCategory}
                    onChange={(e) => setSelectedSubjectCategory(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All Categories</option>
                    {SUBJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Subjects Grid */}
            {(() => {
              const filteredSubjects = subjects.filter((s) => {
                const matchSearch =
                  !subjectSearch ||
                  s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
                  (s.code && s.code.toLowerCase().includes(subjectSearch.toLowerCase()));
                const matchClass =
                  selectedSubjectClass === 'all' ||
                  !selectedSubjectClass ||
                  s.class_id === 'all' ||
                  s.class_id === selectedSubjectClass;
                const matchCat =
                  selectedSubjectCategory === 'all' ||
                  !selectedSubjectCategory ||
                  s.category === selectedSubjectCategory;
                return matchSearch && matchClass && matchCat;
              });

              if (filteredSubjects.length === 0) {
                return (
                  <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-3">
                    <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No subjects found</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No subjects match the selected filters. You can add a new subject to the school curriculum anytime.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateSubjectModal}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all mt-2"
                    >
                      <Plus className="size-4" />
                      Add Subject Now
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubjects.map((sub) => {
                    const categoryColors: Record<string, string> = {
                      Academic: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground border-primary/20',
                      'Co-curricular / Activity': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    };

                    const catBadge = categoryColors[sub.category || 'Academic'] || 'bg-muted text-muted-foreground border-border';

                    return (
                      <div
                        key={sub.id}
                        className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-lift transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-foreground leading-snug">
                                {sub.name}
                              </h3>
                              {sub.code && (
                                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                                  {sub.code}
                                </span>
                              )}
                            </div>

                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${catBadge}`}
                            >
                              {sub.category || 'Core Academic'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                            <GraduationCap className="size-3.5 shrink-0" />
                            <span>{sub.class_name || (sub.class_id === 'all' ? 'All Classes' : 'Class')}</span>
                          </div>

                          {sub.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {sub.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                          <button
                            type="button"
                            onClick={() => openEditSubjectModal(sub)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit2 className="size-3.5 text-muted-foreground" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteSubjectId(sub.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ATTENDANCE & EXCEL EXPORT TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter Bar Header */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="size-5 text-emerald-600" />
                    Attendance Register & Export Center
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Filter historical records by date range, class, section, or student, and download as Excel.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                  >
                    <FileSpreadsheet className="size-4" />
                    Export Filtered to Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Class
                  </label>
                  <select
                    value={attClassId}
                    onChange={(e) => setAttClassId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Section
                  </label>
                  <select
                    value={attSectionId}
                    onChange={(e) => setAttSectionId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Start Date
                  </label>
                  <DateInput
                    placeholder="DD/MM/YYYY"
                    value={attStartDate}
                    onChange={(e) => setAttStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    End Date
                  </label>
                  <DateInput
                    placeholder="DD/MM/YYYY"
                    value={attEndDate}
                    onChange={(e) => setAttEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Search Student
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or Roll..."
                      value={attStudentSearch}
                      onChange={(e) => setAttStudentSearch(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Section</th>
                      <th className="px-6 py-4">Roll No.</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Marked By</th>
                      <th className="px-6 py-4 text-right">Delete Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-xs text-muted-foreground">
                          No attendance records found matching the specified filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">{formatDateDDMMYYYY(rec.date)}</td>
                          <td className="px-6 py-4 font-bold text-foreground">{rec.student_name || 'Anirban Das'}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{rec.class_name || 'Class 5'}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{rec.section_name || 'Section A'}</td>
                          <td className="px-6 py-4 font-mono font-bold text-primary">#{rec.roll_number || '01'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                rec.status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : rec.status === 'absent'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{rec.marked_by_name || 'Teacher'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDeleteAttId(rec.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">School Notice Management</h2>
                <p className="text-xs text-muted-foreground">
                  Publish announcements to teachers, parents, or all portal users.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNoticeModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors"
              >
                <Plus className="size-4" />
                Publish New Notice
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notices.map((n) => (
                <div key={n.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Target: {n.target_role.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteNoticeModal({ id: n.id, title: n.title })}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete Notice"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{n.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                    <span>By: {n.author_name || 'Headmaster'}</span>
                    <span>{formatDateDDMMYYYY(n.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLASS ROUTINE / TIMETABLE TAB */}
        {activeTab === 'timetable' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="size-5 text-primary" />
                    Class Timetables & Daily Period Routine
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure weekly period schedules and daily routines for each class. Changes automatically synchronize and reflect on respective student dashboards.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreateTimetableModal(selectedRoutineDay)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all"
                  >
                    <Plus className="size-4" />
                    Add Period Slot
                  </button>
                </div>
              </div>

              {/* Class & Day Selector Toolbar */}
              <div className="pt-4 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Select Class */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Select Class:
                  </label>
                  <select
                    value={selectedRoutineClass}
                    onChange={(e) => setSelectedRoutineClass(e.target.value)}
                    className="rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classes.map((c) => {
                      const count = classTimetables.filter((t) => t.class_id === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({count} {count === 1 ? 'Period' : 'Periods'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Day Navigation Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {DAYS_OF_WEEK.map((day) => {
                    const count = classTimetables.filter(
                      (t) => t.class_id === selectedRoutineClass && t.day_of_week === day
                    ).length;
                    const active = selectedRoutineDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedRoutineDay(day)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <span>{day}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                            active ? 'bg-primary-dark text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timetable Period Grid for Selected Class & Day */}
            {(() => {
              const currentPeriods = classTimetables.filter(
                (t) => t.class_id === selectedRoutineClass && t.day_of_week === selectedRoutineDay
              );
              const selectedCls = classes.find((c) => c.id === selectedRoutineClass);

              if (currentPeriods.length === 0) {
                return (
                  <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                    <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                      <Clock className="size-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="text-base font-bold text-foreground">
                        No Periods Scheduled on {selectedRoutineDay}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        There are no routine periods scheduled for {selectedCls?.name || 'this class'} on {selectedRoutineDay}. Click below to add period slots.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => openCreateTimetableModal(selectedRoutineDay)}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark"
                        >
                          <Plus className="size-4" />
                          Add Period Slot for {selectedRoutineDay}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentPeriods.map((period) => (
                    <div
                      key={period.id}
                      className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      {/* Top bar: Period Number */}
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1 text-xs font-extrabold">
                          <Clock className="size-3.5" />
                          Period {period.period_number}
                        </span>
                      </div>

                      {/* Middle: Subject */}
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-foreground tracking-tight">
                          {period.subject}
                        </h4>
                      </div>

                      {/* Bottom bar: Teacher & Admin Actions */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-muted-foreground" />
                          {period.teacher_name}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTimetableModal(period)}
                            className="size-7 rounded-lg border border-border bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit Period"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTimetable(period.id, period.subject, period.day_of_week, period.period_number)}
                            className="size-7 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 grid place-items-center text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Delete Period"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* EXAMS & TIMETABLES TAB */}
        {activeTab === 'exams' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Class Examination Timetables & Schedules
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule, modify, and manage examination schedules for each class. Timetables are visible exclusively to enrolled students of that class.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateExamModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all shrink-0"
                >
                  <Plus className="size-4" />
                  Schedule New Exam
                </button>
              </div>

              {/* Class Filter Dropdown */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Filter by Class:
                </label>
                <select
                  value={examClassFilter}
                  onChange={(e) => setExamClassFilter(e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Classes ({scheduledExams.length} Total Exams)</option>
                  {classes.map((c) => {
                    const count = scheduledExams.filter((e) => e.class_id === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count} {count === 1 ? 'Exam' : 'Exams'})
                      </option>
                    );
                  })}
                </select>

                <span className="text-xs text-muted-foreground font-mono">
                  Showing {scheduledExams.filter((e) => examClassFilter === 'all' || e.class_id === examClassFilter).length} exams
                </span>
              </div>
            </div>

            {/* Exam Table / List */}
            {(() => {
              const displayExams = scheduledExams.filter(
                (e) => examClassFilter === 'all' || e.class_id === examClassFilter
              );

              if (displayExams.length === 0) {
                return (
                  <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                    <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                      <Calendar className="size-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="text-base font-bold text-foreground">
                        No Examination Schedules Found
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {examClassFilter === 'all'
                          ? 'No examinations have been scheduled in the school system yet. Click "Schedule New Exam" to create timetables for students.'
                          : 'No examinations are scheduled for this class. Click "Schedule New Exam" to schedule an assessment.'}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Exam & Subject</th>
                          <th className="px-4 py-3">Date & Time</th>
                          <th className="px-4 py-3">Full Marks</th>
                          <th className="px-4 py-3">Room / Notes</th>
                          <th className="px-4 py-3">Scheduled By</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {displayExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                            {/* Class */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">
                                {exam.class_name || 'Class'}
                              </span>
                            </td>

                            {/* Exam Title & Subject */}
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-foreground text-sm">{exam.subject}</p>
                              <p className="text-xs text-muted-foreground">{exam.exam_name}</p>
                            </td>

                            {/* Date, Time & Duration */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <p className="font-bold text-foreground flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-primary" />
                                {formatDateDDMMYYYY(exam.date)}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Clock className="size-3.5 text-muted-foreground" />
                                {exam.time} ({exam.duration})
                              </p>
                            </td>

                            {/* Full Marks */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 font-bold text-xs">
                                {exam.full_marks} Marks
                              </span>
                            </td>

                            {/* Room & Instructions */}
                            <td className="px-4 py-3.5 max-w-xs">
                              {exam.room_number && (
                                <p className="font-semibold text-foreground truncate">
                                  Room: {exam.room_number}
                                </p>
                              )}
                              {exam.instructions && (
                                <p className="text-muted-foreground truncate" title={exam.instructions}>
                                  {exam.instructions}
                                </p>
                              )}
                              {!exam.room_number && !exam.instructions && (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>

                            {/* Scheduled By & Updated By */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <p className="font-bold text-foreground">{exam.created_by_name}</p>
                              {exam.updated_by_name && (
                                <p className="text-[10px] text-muted-foreground">
                                  Updated: {exam.updated_by_name}
                                </p>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditExamModal(exam)}
                                  className="size-8 rounded-xl border border-border bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  title="Edit Exam"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(exam.id, exam.subject)}
                                  className="size-8 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 grid place-items-center text-rose-600 hover:bg-rose-100 transition-colors"
                                  title="Delete Exam"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* CONFIRM DELETE ATTENDANCE MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteAttId)}
        title="Confirm Attendance Record Deletion"
        description="WARNING: You are about to permanently delete this attendance record. Deleting attendance alters historical log data. Are you sure you want to proceed?"
        confirmLabel="Yes, Permanently Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteAttendance}
        onCancel={() => setDeleteAttId(null)}
      />

      {/* CONFIRM DELETE STUDENT MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteStudentId)}
        title="Confirm Student Record Removal"
        description="WARNING: You are about to remove this student record from the school portal directory. This will also remove the student login profile and attendance records. Are you sure you want to proceed?"
        confirmLabel="Yes, Remove Student"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteStudent}
        onCancel={() => setDeleteStudentId(null)}
      />

      {/* CONFIRM DELETE TEACHER MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteTeacherModal)}
        title="Confirm Teacher Account Deletion"
        description={`WARNING: You are about to remove the teacher account for "${deleteTeacherModal?.name}". This will also remove login access and class assignments. Are you sure you want to proceed?`}
        confirmLabel="Yes, Delete Teacher"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTeacher}
        onCancel={() => setDeleteTeacherModal(null)}
      />

      {/* CONFIRM DELETE EXAM MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteExamModal)}
        title="Confirm Exam Deletion"
        description={`WARNING: You are about to permanently remove the exam "${deleteExamModal?.name}". Are you sure you want to proceed?`}
        confirmLabel="Yes, Delete Exam"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteExam}
        onCancel={() => setDeleteExamModal(null)}
      />

      {/* CONFIRM DELETE NOTICE MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteNoticeModal)}
        title="Confirm Notice Deletion"
        description={`WARNING: You are about to remove the notice "${deleteNoticeModal?.title}". Are you sure you want to proceed?`}
        confirmLabel="Yes, Delete Notice"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (!deleteNoticeModal) return;
          try {
            await deleteNotice(deleteNoticeModal.id);
            toast.success('Notice deleted successfully.');
            setDeleteNoticeModal(null);
            loadData();
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete notice');
          }
        }}
        onCancel={() => setDeleteNoticeModal(null)}
      />

      {/* CONFIRM DELETE TIMETABLE SLOT MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteTimetableModal)}
        title="Confirm Timetable Slot Deletion"
        description={`WARNING: You are about to remove ${deleteTimetableModal?.description}. Are you sure you want to proceed?`}
        confirmLabel="Yes, Delete Slot"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTimetable}
        onCancel={() => setDeleteTimetableModal(null)}
      />

      {/* STUDENT FORM MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              {editingStudent ? 'Edit Student Details' : 'Add New Student'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Student Name"
                  value={studentForm.first_name}
                  onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value, last_name: '' })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Mobile Number (Used for Login & SMS)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit Mobile Number"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Date of Birth (DOB) <span className="text-[10px] text-muted-foreground/80 font-normal lowercase">(dd/mm/yyyy)</span>
                </label>
                <DateInput
                  required
                  placeholder="DD/MM/YYYY"
                  value={studentForm.date_of_birth}
                  onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Roll Number"
                    value={studentForm.roll_number}
                    onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Class
                  </label>
                  <select
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Section
                  </label>
                  <select
                    value={studentForm.section_id}
                    onChange={(e) => setStudentForm({ ...studentForm, section_id: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PARENT, GUARDIAN & CONTACT DETAILS (EXPANDED SECTION) */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="size-3.5 text-emerald-600" />
                  Parent & Guardian Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      placeholder="Father's full name"
                      value={studentForm.father_name}
                      onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Father's Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Business, Teacher"
                      value={studentForm.father_occupation}
                      onChange={(e) => setStudentForm({ ...studentForm, father_occupation: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      placeholder="Mother's full name"
                      value={studentForm.mother_name}
                      onChange={(e) => setStudentForm({ ...studentForm, mother_name: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Mother's Occupation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Homemaker, Teacher"
                      value={studentForm.mother_occupation}
                      onChange={(e) => setStudentForm({ ...studentForm, mother_occupation: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Student Aadhar Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="12-digit Aadhar number"
                      value={studentForm.aadhar_number}
                      onChange={(e) => setStudentForm({ ...studentForm, aadhar_number: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Alternative Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Alternative mobile number"
                      value={studentForm.alt_phone}
                      onChange={(e) => setStudentForm({ ...studentForm, alt_phone: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="Optional email address"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Residential Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Full residential address"
                    value={studentForm.address}
                    onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PARENT & CONTACT INFORMATION MODAL */}
      {showParentInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-foreground">
                  Edit Parent, Guardian & Contact Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowParentInfoModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParentInfo} className="space-y-4">
              {/* Father's Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Father's Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Father's Name"
                    value={parentInfoForm.father_name}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, father_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Father's Occupation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Business, Teacher, Farmer"
                    value={parentInfoForm.father_occupation}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, father_occupation: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Mother's Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Mother's Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Mother's Name"
                    value={parentInfoForm.mother_name}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, mother_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Mother's Occupation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Homemaker, Teacher, Service"
                    value={parentInfoForm.mother_occupation}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, mother_occupation: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Primary Mobile Phone (Login) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={parentInfoForm.phone}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Alternative Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional alternate mobile"
                    value={parentInfoForm.alt_phone}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, alt_phone: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
              </div>

              {/* Aadhar & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Student Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="12-digit Aadhar number"
                    value={parentInfoForm.aadhar_number}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, aadhar_number: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={parentInfoForm.email}
                    onChange={(e) => setParentInfoForm({ ...parentInfoForm, email: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Full residential address"
                  value={parentInfoForm.address}
                  onChange={(e) => setParentInfoForm({ ...parentInfoForm, address: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowParentInfoModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 cursor-pointer"
                >
                  Save Information
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER FORM MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Create Teacher Account</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter teacher's name and mobile number. The teacher will use this mobile number to log in.
              </p>
            </div>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Smt. Ananya Sen"
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  placeholder="10-digit mobile number"
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-amber-700 cursor-pointer"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER DETAILS MODAL (ADMIN) */}
      {showEditTeacherModal && editingTeacherData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-amber-600" />
                <h3 className="text-base font-bold text-foreground">
                  Edit Teacher Details ({editingTeacherData.full_name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTeacherModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherEdit} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/60">
                {teacherPhotoFile ? (
                  <img
                    src={URL.createObjectURL(teacherPhotoFile)}
                    alt="Preview"
                    className="size-16 rounded-2xl object-cover border border-amber-500/30 shrink-0"
                  />
                ) : teacherEditForm.avatar_url ? (
                  <img
                    src={teacherEditForm.avatar_url}
                    alt="Current"
                    className="size-16 rounded-2xl object-cover border border-amber-500/30 shrink-0"
                  />
                ) : (
                  <div className="grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 font-bold text-xl shrink-0">
                    {teacherEditForm.full_name ? teacherEditForm.full_name.charAt(0) : 'T'}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setTeacherPhotoFile(e.target.files[0]);
                    }}
                    className="text-xs text-muted-foreground file:mr-2 file:rounded-xl file:border-0 file:bg-amber-500/10 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-700 dark:file:text-amber-300 hover:file:bg-amber-500/20 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherEditForm.full_name}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, full_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={teacherEditForm.phone}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={teacherEditForm.email}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, email: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                    placeholder="e.g. teacher@example.com (or leave blank for NA)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Aadhar Card Number
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="12-digit Aadhar number"
                    value={teacherEditForm.aadhar_number}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, aadhar_number: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc, M.A, B.Ed"
                    value={teacherEditForm.qualification}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, qualification: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Specialized Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Science, Bengali"
                    value={teacherEditForm.specialized_subject}
                    onChange={(e) => setTeacherEditForm({ ...teacherEditForm, specialized_subject: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter full residential address"
                  value={teacherEditForm.address}
                  onChange={(e) => setTeacherEditForm({ ...teacherEditForm, address: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditTeacherModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-amber-700 cursor-pointer"
                >
                  Save Teacher Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARENT FORM MODAL */}
      {showParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Parent Account</h3>
            <form onSubmit={handleSaveParent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shri Amitabha Roy"
                  value={parentForm.full_name}
                  onChange={(e) => setParentForm({ ...parentForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="parent@rkvm.edu.in"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Link Child Student
                </label>
                <select
                  value={parentForm.linked_student_id}
                  onChange={(e) => setParentForm({ ...parentForm, linked_student_id: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} (Roll #{s.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-emerald-700"
                >
                  Create Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTICE FORM MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <h3 className="text-lg font-bold text-foreground">Publish School Notice</h3>
            <form onSubmit={handleSaveNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test Schedule"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Target Role
                </label>
                <select
                  value={noticeForm.target_role}
                  onChange={(e) => setNoticeForm({ ...noticeForm, target_role: e.target.value as any })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                >
                  <option value="all">Everyone (All Portal Users)</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="parent">Parents Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Notice Body Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write notice details..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Change Account Password</h3>
                  <p className="text-xs text-muted-foreground">{passModal.targetName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPassModal(null)}
                className="rounded-xl border border-input p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!passModal || !newPassInput) return;
                try {
                  await updateUserPassword(passModal.targetId, newPassInput);
                  toast.success(`Password for ${passModal.targetName} updated to "${newPassInput}"`);
                  setPassModal(null);
                  setNewPassInput('');
                  await loadData();
                } catch (err) {
                  toast.error('Failed to update password');
                }
              }}
            >
              <div className="rounded-2xl bg-muted/40 p-3.5 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Login Email / User ID</span>
                <p className="font-mono font-bold text-foreground">{passModal.targetEmail}</p>
                <span className="text-[10px] font-medium text-muted-foreground block">
                  Current Password: <strong className="text-primary font-mono">{passModal.currentPass}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Set New Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Enter new password"
                  className="block w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPassModal(null)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXAM SCHEDULING FORM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                {editingExam ? 'Edit Examination Schedule' : 'Schedule New Class Examination'}
              </h3>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="size-8 rounded-xl grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Class *
                  </label>
                  <select
                    value={examForm.class_id}
                    onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam Title */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.exam_name}
                    onChange={(e) => setExamForm({ ...examForm, exam_name: e.target.value })}
                    placeholder="e.g. 1st Unit Test 2026"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Subject *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExamModal(false);
                        setActiveTab('subjects');
                        openCreateSubjectModal();
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      + Add New Subject
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                  {subjects.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setExamForm({ ...examForm, subject: e.target.value });
                        }
                      }}
                      value={subjects.some(s => s.name === examForm.subject) ? examForm.subject : ''}
                      className="mt-1.5 w-full rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground outline-none font-medium"
                    >
                      <option value="">-- Or Select from Dynamic Subjects ({subjects.length}) --</option>
                      {subjects
                        .filter((s) => s.class_id === 'all' || s.class_id === examForm.class_id)
                        .map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} {s.code ? `(${s.code})` : ''}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Full Marks */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Full Marks *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={200}
                    value={examForm.full_marks}
                    onChange={(e) => setExamForm({ ...examForm, full_marks: Number(e.target.value) || 100 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Exam Date * <span className="text-[10px] text-muted-foreground/80 font-normal lowercase">(dd/mm/yyyy)</span>
                  </label>
                  <DateInput
                    required
                    placeholder="DD/MM/YYYY"
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.time}
                    onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                    placeholder="e.g. 2 Hours"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Number */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Room / Hall Number
                  </label>
                  <input
                    type="text"
                    value={examForm.room_number}
                    onChange={(e) => setExamForm({ ...examForm, room_number: e.target.value })}
                    placeholder="e.g. Main Hall (Room 102)"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Special Instructions
                  </label>
                  <input
                    type="text"
                    value={examForm.instructions}
                    onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                    placeholder="e.g. Bring Admit Card and geometry set"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExam}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {savingExam ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {editingExam ? 'Update Schedule' : 'Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS TIMETABLE / PERIOD SLOT MODAL (ADMIN ONLY) */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                {editingTimetableEntry ? 'Edit Timetable Period' : 'Add Period Slot to Timetable'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTimetableModal(false)}
                className="size-8 rounded-xl grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTimetable} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Class *
                  </label>
                  <select
                    value={timetableForm.class_id}
                    onChange={(e) => setTimetableForm({ ...timetableForm, class_id: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Day *
                  </label>
                  <select
                    value={timetableForm.day_of_week}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day_of_week: e.target.value as DayOfWeek })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period Dropdown (1 to 7) */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Period (Max 7) *
                  </label>
                  <select
                    value={timetableForm.period_number}
                    onChange={(e) => setTimetableForm({ ...timetableForm, period_number: Number(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        Period {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Selection (Dynamic + Quick Add) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Subject Name *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimetableModal(false);
                        setActiveTab('subjects');
                        openCreateSubjectModal();
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      + Add New Subject
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={timetableForm.subject}
                    onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                    placeholder="e.g. Mathematics, Tiffin Break"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                  {subjects.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setTimetableForm({ ...timetableForm, subject: e.target.value });
                        }
                      }}
                      value={subjects.some(s => s.name === timetableForm.subject) ? timetableForm.subject : ''}
                      className="mt-1.5 w-full rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground outline-none font-medium"
                    >
                      <option value="">-- Or Select from Dynamic Subjects ({subjects.length}) --</option>
                      {subjects
                        .filter((s) => s.class_id === 'all' || s.class_id === timetableForm.class_id)
                        .map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} {s.code ? `(${s.code})` : ''}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Assigned Teacher (Dropdown with NA as 1st option) */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Assigned Teacher *
                  </label>
                  <select
                    value={timetableForm.teacher_name || 'NA'}
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacher_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="NA">NA (Not Assigned)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.full_name}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTimetable}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {savingTimetable ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {editingTimetableEntry ? 'Update Period' : 'Save to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SUBJECT MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteSubjectId)}
        title="Confirm Subject Deletion"
        description="Are you sure you want to remove this subject from the school curriculum? This action cannot be undone."
        confirmLabel="Yes, Delete Subject"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteSubject}
        onCancel={() => setDeleteSubjectId(null)}
      />

      {/* ADD / EDIT SUBJECT MODAL (ADMIN ONLY) */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-card-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                {editingSubject ? 'Edit Subject Details' : 'Add New Subject to Curriculum'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="size-8 rounded-xl grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Subject Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g. Mathematics, Bengali"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Subject Code */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MATH-01"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Applicable Class */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Applicable Class *
                  </label>
                  <select
                    value={subjectForm.class_id}
                    onChange={(e) => setSubjectForm({ ...subjectForm, class_id: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="all">All Classes / Grades</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Curriculum Category *
                  </label>
                  <select
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value as SubjectCategory })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {SUBJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Description / Syllabus Outline
                </label>
                <textarea
                  rows={3}
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="e.g. Topics, reference textbooks, assessment weightage..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSubject}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {savingSubject ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
