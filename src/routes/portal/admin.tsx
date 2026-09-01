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
  assignTeacherToClass,
  deleteAttendanceRecord,
  exportAttendanceToExcel,
  addNotice,
  deleteNotice,
  store,
  generateDefaultPassword,
  updateUserPassword,
} from '../../lib/portal-db';
import { uploadProfilePhoto } from '../../lib/storage';
import { toast } from 'sonner';
import type {
  SchoolClass,
  Section,
  Profile,
  Student,
  AttendanceRecord,
  Notice,
  UserRole,
} from '../../types/portal';

export const Route = createFileRoute('/portal/admin')({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active Tab state: 'overview' | 'students' | 'teachers' | 'parents' | 'classes' | 'attendance' | 'notices'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'parents' | 'classes' | 'attendance' | 'notices'>('overview');

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
    date_of_birth: '',
    gender: 'Male',
    class_id: '',
    section_id: '',
    status: 'active' as const,
  });
  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null);

  // Teacher Form Modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    qualification: '',
    assigned_class_id: '',
    assigned_section_id: '',
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
        else navigate({ to: '/portal/parent' });
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

      setClasses(cls);
      setSections(sec);
      setStudents(st);
      setTeachers(profs.filter((p) => p.role === 'teacher'));
      setParents(profs.filter((p) => p.role === 'parent'));
      setAttendanceRecords(att);
      setNotices(nots);

      if (cls.length > 0) {
        setStudentForm((prev) => ({ ...prev, class_id: cls[0].id }));
        setTeacherForm((prev) => ({ ...prev, assigned_class_id: cls[0].id }));
      }
      if (sec.length > 0) {
        setStudentForm((prev) => ({ ...prev, section_id: sec[0].id }));
        setTeacherForm((prev) => ({ ...prev, assigned_section_id: sec[0].id }));
      }
      if (st.length > 0) {
        setParentForm((prev) => ({ ...prev, linked_student_id: st[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter attendance records based on filter inputs
  const filteredAttendance = attendanceRecords.filter((rec) => {
    if (attClassId && rec.class_id !== attClassId) return false;
    if (attSectionId && rec.section_id !== attSectionId) return false;
    if (attStartDate && rec.date < attStartDate) return false;
    if (attEndDate && rec.date > attEndDate) return false;
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
        await updateStudent(editingStudent.id, {
          ...studentForm,
          avatar_url,
        });
        toast.success('Student updated successfully!');
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

  // Handle Save Teacher
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProf = await addProfile({
        full_name: teacherForm.full_name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        role: 'teacher',
      });

      if (teacherForm.assigned_class_id && teacherForm.assigned_section_id) {
        await assignTeacherToClass(newProf.id, teacherForm.assigned_class_id, teacherForm.assigned_section_id);
      }

      toast.success('Teacher account created successfully!');
      setShowTeacherModal(false);
      setTeacherForm({
        full_name: '',
        email: '',
        phone: '',
        employee_id: '',
        qualification: '',
        assigned_class_id: classes[0]?.id || '',
        assigned_section_id: sections[0]?.id || '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create teacher account');
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
              { id: 'attendance', label: 'Attendance & Export', icon: FileSpreadsheet },
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
            {/* Top Stat Cards (4-Column Layout) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Students
                  </span>
                  <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <GraduationCap className="size-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">{students.length}</span>
                  <span className="text-xs text-emerald-600 font-semibold">Active Enrolled</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Teachers
                  </span>
                  <span className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <UserCheck className="size-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">{teachers.length}</span>
                  <span className="text-xs text-amber-600 font-semibold">Onboarded Staff</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Classes
                  </span>
                  <span className="grid size-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <BookOpen className="size-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">{classes.length}</span>
                  <span className="text-xs text-emerald-600 font-semibold">Grade Levels (Nursery - Class 10)</span>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Attendance Logged
                  </span>
                  <span className="grid size-10 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <FileSpreadsheet className="size-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">{attendanceRecords.length}</span>
                  <span className="text-xs text-indigo-600 font-semibold">Total Entries</span>
                </div>
              </div>
            </div>

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
                    setStudentForm({
                      roll_number: String(students.length + 1).padStart(2, '0'),
                      first_name: '',
                      last_name: '',
                      date_of_birth: '2015-01-01',
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
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              roll_number: st.roll_number,
                              first_name: st.first_name,
                              last_name: st.last_name,
                              date_of_birth: st.date_of_birth || '',
                              gender: st.gender || 'Male',
                              class_id: st.class_id,
                              section_id: st.section_id,
                              status: st.status,
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
                              Gender: <strong className="text-foreground">{st.gender || 'Male'}</strong> • Date of Birth: <strong className="text-foreground">{st.date_of_birth || '2014-05-12'}</strong> • System ID: <span className="font-mono">{st.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Top Performance Badge */}
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center md:text-right shrink-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Academic & Attendance Status
                          </span>
                          <span className="text-2xl font-extrabold text-emerald-600 block mt-1">
                            Grade A+ (91.4%)
                          </span>
                          <span className="text-xs text-muted-foreground font-medium block">
                            Class Rank: #02 • Excellent Standing
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
                                const email = st.email || `${st.first_name.toLowerCase()}.${st.last_name.toLowerCase()}.st@rkvmschool.in`;
                                setPassModal({
                                  targetId: st.id,
                                  targetName: `${st.first_name} ${st.last_name}`,
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
                              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Login Email / User ID</span>
                              <p className="text-sm font-mono font-bold text-foreground">
                                {st.email || `${st.first_name.toLowerCase()}.${st.last_name.toLowerCase()}.st@rkvmschool.in`}
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
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Users className="size-5 text-emerald-600" />
                            Parent & Guardian Contact Information
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Guardian Name</span>
                              <p className="text-sm font-bold text-foreground">Shri Rajesh Kumar Das</p>
                              <span className="text-xs text-primary font-semibold block">Relationship: Father</span>
                            </div>

                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Contact Details</span>
                              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Phone className="size-3.5 text-emerald-600" />
                                +91 94340 98765
                              </p>
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Mail className="size-3.5 text-primary" />
                                parent@rkvm.edu.in
                              </p>
                            </div>

                            <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Residential Address</span>
                              <p className="text-xs font-semibold text-foreground">
                                Vill - Aurangabad, P.O - Keshiary, Dist - Paschim Medinipur
                              </p>
                              <span className="text-[11px] text-muted-foreground block">West Bengal 721133</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 2: ACADEMIC MARKS & GRADES */}
                    {studentSubTab === 'academic' && (
                      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <BookOpen className="size-5 text-primary" />
                            Academic Performance & Subject Marks Summary
                          </h3>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            First Term Assessment 2026
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-border rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-semibold border-b border-border">
                              <tr>
                                <th className="px-4 py-3">Subject Name</th>
                                <th className="px-4 py-3">Full Marks</th>
                                <th className="px-4 py-3">Marks Obtained</th>
                                <th className="px-4 py-3">Grade</th>
                                <th className="px-4 py-3">Teacher Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {[
                                { subject: 'Bengali (1st Language)', total: 100, marks: 92, grade: 'A+', remark: 'Outstanding literary skills & comprehension' },
                                { subject: 'English (2nd Language)', total: 100, marks: 88, grade: 'A', remark: 'Good vocabulary and grammar proficiency' },
                                { subject: 'Mathematics', total: 100, marks: 96, grade: 'A+', remark: 'Exceptional analytical & calculation speed' },
                                { subject: 'Science & Environment', total: 100, marks: 91, grade: 'A+', remark: 'Keen experimental understanding' },
                                { subject: 'History & Geography', total: 100, marks: 89, grade: 'A', remark: 'Strong map pointing and historical facts' },
                                { subject: 'Computer & Physical Ed.', total: 100, marks: 95, grade: 'A+', remark: 'Active participation and practical skills' },
                              ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 font-bold text-foreground">{row.subject}</td>
                                  <td className="px-4 py-3 font-mono text-muted-foreground">{row.total}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-primary">{row.marks}</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 font-bold">
                                      {row.grade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{row.remark}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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

                        {/* Attendance History Log Table */}
                        <div className="border border-border rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-semibold border-b border-border">
                              <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Marked By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {studentAtt.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                    No attendance history logged yet for this student.
                                  </td>
                                </tr>
                              ) : (
                                studentAtt.map((att) => (
                                  <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-foreground">{att.date}</td>
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

                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setStudentForm({
                        roll_number: String(students.length + 1).padStart(2, '0'),
                        first_name: '',
                        last_name: '',
                        date_of_birth: '2015-01-01',
                        gender: 'Male',
                        class_id: classes[0]?.id || '',
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

                <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Roll No.</th>
                          <th className="px-6 py-4">Class & Section</th>
                          <th className="px-6 py-4">Gender</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-xs text-muted-foreground font-medium">
                              No students registered yet. Click <strong className="text-primary font-bold">"Add Student"</strong> above to create your first student account.
                            </td>
                          </tr>
                        ) : (
                          students.map((st) => (
                            <tr key={st.id} className="hover:bg-muted/30 transition-colors">
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
                                  <p className="text-[11px] text-muted-foreground">ID: {st.id}</p>
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
                                <button
                                  type="button"
                                  onClick={() => setViewingStudentDetails(st)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                  <Eye className="size-3.5" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
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

            {teachers.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-10 text-center text-xs text-muted-foreground space-y-2">
                <UserCheck className="size-8 text-amber-500 mx-auto" />
                <p className="font-bold text-foreground text-sm">No Teachers Onboarded Yet</p>
                <p>Click <strong className="text-amber-600 font-bold">"Add Teacher Account"</strong> above to onboard teachers and assign classes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((t) => (
                  <div key={t.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                    <div className="flex items-center gap-3">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.full_name} className="size-12 rounded-full object-cover border" />
                      ) : (
                        <div className="grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-base">
                          {t.full_name ? t.full_name.charAt(0) : 'T'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-foreground leading-tight">{t.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                        <p className="text-xs text-amber-600 font-medium">{t.phone || 'No phone set'}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Assigned Class:</span>
                        <span className="font-bold text-foreground">Class 5 — Section A</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl">
                        <span className="text-amber-800 dark:text-amber-300 font-medium">Password:</span>
                        <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                          {t.portal_password || '********'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pass = t.portal_password || '';
                          setPassModal({
                            targetId: t.id,
                            targetName: t.full_name,
                            targetEmail: t.email,
                            currentPass: pass,
                          });
                          setNewPassInput(pass);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-input py-1.5 text-xs font-bold text-foreground hover:bg-accent transition-colors"
                      >
                        <Lock className="size-3.5" />
                        Change Password
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <input
                    type="date"
                    value={attStartDate}
                    onChange={(e) => setAttStartDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={attEndDate}
                    onChange={(e) => setAttEndDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                          <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">{rec.date}</td>
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
                      onClick={async () => {
                        await deleteNotice(n.id);
                        toast.success('Notice deleted');
                        loadData();
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{n.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                    <span>By: {n.author_name || 'Headmaster'}</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
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

      {/* STUDENT FORM MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              {editingStudent ? 'Edit Student Details' : 'Add New Student'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.first_name}
                    onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.last_name}
                    onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
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

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Upload Profile Photo (Supabase Storage)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setStudentPhotoFile(e.target.files[0]);
                    }
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
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

      {/* TEACHER FORM MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Teacher Account</h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smt. Ananya Sen"
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
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
                  placeholder="teacher@rkvm.edu.in"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98310 00000"
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-amber-700"
                >
                  Create Teacher
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
    </div>
  );
}
