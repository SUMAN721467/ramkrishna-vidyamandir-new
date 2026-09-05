import React, { useEffect, useState, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  User,
  Users,
  BookOpen,
  Award,
  ShieldCheck,
  Phone,
  Mail,
  Camera,
  Upload,
  AlertCircle,
  X,
  Edit2,
  Save,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import {
  fetchStudents,
  fetchParentChildren,
  fetchAttendance,
  fetchNotices,
  fetchStudentMarks,
  fetchScheduledExams,
  fetchClassTimetable,
  requestStudentPhotoChange,
  rejectStudentPhotoChange,
  updateStudent,
  calculateGrade,
  formatDisplayEmail,
} from '../../lib/portal-db';
import { formatDateDDMMYYYY } from '../../lib/format';
import { uploadProfilePhoto } from '../../lib/storage';
import { toast } from 'sonner';
import type {
  Student,
  AttendanceRecord,
  Notice,
  StudentMark,
  ScheduledExam,
  ClassTimetableEntry,
  DayOfWeek,
} from '../../types/portal';

export const Route = createFileRoute('/portal/student')({
  component: StudentDashboardPage,
});

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getCurrentDayOfWeek(): DayOfWeek {
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  if (DAYS_OF_WEEK.includes(dayName as DayOfWeek)) {
    return dayName as DayOfWeek;
  }
  return 'Monday';
}

export function StudentDashboardPage() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Student profile state
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Edit Parent Details Modal
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [parentForm, setParentForm] = useState({
    father_name: '',
    father_occupation: '',
    mother_name: '',
    mother_occupation: '',
    phone: '',
    alt_phone: '',
    email: '',
    address: '',
  });

  // Student sub-tabs: 'profile' | 'academic' | 'routine' | 'exams' | 'attendance' | 'notices'
  const [subTab, setSubTab] = useState<'profile' | 'academic' | 'routine' | 'exams' | 'attendance' | 'notices'>('profile');

  // Timetable Day Selector state
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<DayOfWeek>(getCurrentDayOfWeek());
  const [showFullWeeklyView, setShowFullWeeklyView] = useState(false);

  // Attendance history, notices, examination marks, scheduled exams, and class daily routine
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [classTimetable, setClassTimetable] = useState<ClassTimetableEntry[]>([]);

  // Derived Attendance Stats
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absentDays = attendanceHistory.filter((a) => a.status === 'absent').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Derived Academic Marks Stats
  const totalFullMarks = studentMarks.reduce((acc, m) => acc + (Number(m.full_marks) || 100), 0);
  const totalMarksObtained = studentMarks.reduce((acc, m) => acc + (Number(m.marks_obtained) || 0), 0);
  const hasUploadedMarks = studentMarks.length > 0;
  const academicPercentage = hasUploadedMarks && totalFullMarks > 0 ? Math.round((totalMarksObtained / totalFullMarks) * 1000) / 10 : null;
  const overallGrade = academicPercentage !== null ? calculateGrade(academicPercentage) : null;

  // Group marks by Exam Name
  const marksByExam = React.useMemo(() => {
    const map = new Map<string, StudentMark[]>();
    studentMarks.forEach((m) => {
      const exam = m.exam_name || 'Class Assessments';
      const list = map.get(exam) || [];
      list.push(m);
      map.set(exam, list);
    });
    return Array.from(map.entries());
  }, [studentMarks]);

  // Protected route check
  useEffect(() => {
    if (!authLoading) {
      if (!role) {
        navigate({ to: '/portal/login' });
      } else if (role === 'admin') {
        navigate({ to: '/portal/admin' });
      } else if (role === 'teacher') {
        navigate({ to: '/portal/teacher' });
      }
    }
  }, [role, authLoading, navigate]);

  // Load Student Data
  useEffect(() => {
    async function loadStudentData() {
      if (!user) return;
      setLoading(true);
      try {
        const allStudents = await fetchStudents();
        const foundStudent = allStudents.find(
          (s) =>
            s.id === user.id ||
            (user.email && s.email?.toLowerCase() === user.email.toLowerCase()) ||
            (profile?.phone && s.phone === profile.phone) ||
            (profile?.full_name && `${s.first_name} ${s.last_name}`.trim().toLowerCase() === profile.full_name.trim().toLowerCase())
        );

        let studentObj: Student;

        if (foundStudent) {
          studentObj = foundStudent;
        } else {
          const childList = await fetchParentChildren(user.id);
          if (childList.length > 0) {
            studentObj = childList[0];
          } else if (allStudents.length > 0) {
            studentObj = allStudents[0];
          } else {
            studentObj = {
              id: user.id || 'st-logged-in',
              roll_number: '01',
              first_name: profile?.full_name?.split(' ')[0] || 'Student',
              last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
              class_id: 'c5',
              section_id: 's1',
              class_name: 'Class 5',
              section_name: 'Section A',
              date_of_birth: '2014-05-12',
              gender: 'Male',
              status: 'active',
              avatar_url: profile?.avatar_url,
              pending_avatar_url: profile?.pending_avatar_url,
              pending_avatar_status: profile?.pending_avatar_status,
            };
          }
        }

        setActiveStudent(studentObj);

        // Fetch attendance for student
        const att = await fetchAttendance({ studentId: studentObj.id });
        setAttendanceHistory(att);

        // Fetch real marks uploaded by teachers
        const marks = await fetchStudentMarks({ studentId: studentObj.id });
        setStudentMarks(marks);

        // Fetch class-specific scheduled exams strictly for student's class
        const exams = await fetchScheduledExams(studentObj.class_id);
        setScheduledExams(exams);

        // Fetch class daily routine & timetable strictly for student's class
        const tt = await fetchClassTimetable(studentObj.class_id);
        setClassTimetable(tt);

        // Fetch school notices
        const nots = await fetchNotices('parent');
        setNotices(nots);
      } catch (err: any) {
        console.error('[Student Dashboard] Load error:', err);
        toast.error(err?.message || 'Failed to load student portal info');
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [user, profile]);

  // Handle Photo Upload Request
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeStudent) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadProfilePhoto(file, 'students');
      await requestStudentPhotoChange(activeStudent.id, photoUrl);
      toast.success('Photo uploaded and sent to School Admin for verification!');
      setActiveStudent({
        ...activeStudent,
        pending_avatar_url: photoUrl,
        pending_avatar_status: 'pending',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Cancel Pending Request
  const handleCancelPhotoRequest = async () => {
    if (!activeStudent) return;
    try {
      await rejectStudentPhotoChange(activeStudent.id);
      toast.success('Photo verification request removed.');
      setActiveStudent({
        ...activeStudent,
        pending_avatar_url: undefined,
        pending_avatar_status: undefined,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel photo request');
    }
  };

  // Open Edit Parent Modal
  const openEditParentModal = () => {
    if (!activeStudent) return;
    setParentForm({
      father_name: activeStudent.father_name || '',
      father_occupation: activeStudent.father_occupation || '',
      mother_name: activeStudent.mother_name || '',
      mother_occupation: activeStudent.mother_occupation || '',
      phone: activeStudent.phone || '',
      alt_phone: activeStudent.alt_phone || '',
      email: activeStudent.email || '',
      address: activeStudent.address || '',
    });
    setShowEditParentModal(true);
  };

  // Save Parent Form
  const handleSaveParentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    try {
      const updated = await updateStudent(activeStudent.id, {
        father_name: parentForm.father_name,
        father_occupation: parentForm.father_occupation,
        mother_name: parentForm.mother_name,
        mother_occupation: parentForm.mother_occupation,
        phone: parentForm.phone,
        alt_phone: parentForm.alt_phone,
        email: parentForm.email,
        address: parentForm.address,
      });

      setActiveStudent(updated);
      toast.success('Parent and guardian contact details updated successfully!');
      setShowEditParentModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update guardian details');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Loading Student Portal...
          </p>
        </div>
      </div>
    );
  }

  const st = activeStudent || {
    id: 'st-0',
    roll_number: '01',
    first_name: 'Student',
    last_name: '',
    class_name: 'Class 5',
    section_name: 'Section A',
    gender: 'Male',
    date_of_birth: '2014-05-12',
    status: 'active',
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-foreground flex flex-col">
      <PortalHeader
        title="Student Portal"
        avatarUrl={activeStudent?.avatar_url || profile?.avatar_url}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TOP HERO PROFILE CARD */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Student Avatar and Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5">
              <div className="relative group shrink-0">
                {st.avatar_url ? (
                  <img
                    src={st.avatar_url}
                    alt={`${st.first_name} ${st.last_name}`}
                    className="size-24 rounded-3xl object-cover border-4 border-primary/20 shadow-md ring-4 ring-primary/10"
                  />
                ) : (
                  <div className="grid size-24 place-items-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-extrabold border-4 border-primary/20 shadow-md">
                    {st.first_name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Upload Photo Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-2 -right-2 rounded-2xl bg-primary p-2 text-primary-foreground shadow-soft hover:bg-primary-dark transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Upload New Profile Photo"
                >
                  <Camera className="size-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelected}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {st.first_name} {st.last_name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 px-2.5 py-0.5 text-xs font-bold uppercase">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    Enrolled Student
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-primary">
                  {st.class_name || 'Class 5'} — {st.section_name || 'Section A'} • Roll Number: #{st.roll_number || '01'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground pt-0.5">
                  <span>Gender: <strong className="text-foreground">{st.gender || 'Male'}</strong></span>
                  <span>•</span>
                  <span>Date of Birth: <strong className="text-foreground">{formatDateDDMMYYYY(st.date_of_birth) || '12-05-2014'}</strong></span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Camera className="size-3.5" />
                    Upload New Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Top Performance Badge */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center md:text-right shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Academic & Attendance Standing
              </span>
              {hasUploadedMarks ? (
                <>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
                    Grade {overallGrade} ({academicPercentage}%)
                  </span>
                  <span className="text-xs text-muted-foreground font-medium block">
                    Attendance Rate: {attendancePercentage}% • {studentMarks.length} Marks Published
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block mt-1">
                    Evaluation Pending
                  </span>
                  <span className="text-xs text-muted-foreground font-medium block">
                    Attendance Rate: {attendancePercentage}% • Marks Not Uploaded Yet
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PENDING PHOTO APPROVAL NOTICE BANNER */}
        {st.pending_avatar_url && st.pending_avatar_status === 'pending' && (
          <div className="rounded-3xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-4">
              <img
                src={st.pending_avatar_url}
                alt="Pending verification photo"
                className="size-14 rounded-2xl object-cover border-2 border-amber-500 shrink-0 shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    New Photo Submitted — Pending Admin Approval
                  </h4>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  Your new photo has been uploaded and submitted to the School Administrator for verification. Once approved, it will automatically update your public profile picture.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelPhotoRequest}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-100 dark:bg-amber-900/60 px-3.5 py-2 text-xs font-bold text-amber-900 dark:text-amber-100 hover:bg-amber-200 transition-colors shrink-0"
            >
              <X className="size-3.5" />
              Cancel Request
            </button>
          </div>
        )}

        {/* SUB-TABS NAVIGATION BAR */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          {[
            { id: 'profile', label: 'My Student Details', icon: User },
            { id: 'notices', label: `School Notices (${notices.length})`, icon: Megaphone },
            { id: 'routine', label: `Daily Routine (${classTimetable.length})`, icon: Clock },
            { id: 'attendance', label: 'Attendance Record', icon: Calendar },
            { id: 'exams', label: `Exam Timetable (${scheduledExams.length})`, icon: Calendar },
            { id: 'academic', label: `Academic Marks & Grades ${hasUploadedMarks ? `(${studentMarks.length})` : ''}`, icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
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

        {/* SUB-TAB 1: STUDENT & GUARDIAN PROFILE */}
        {subTab === 'profile' && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="size-5 text-emerald-600" />
                  Parent, Guardian & Contact Information
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official contact records for school communication and emergency contacts.
                </p>
              </div>

              <button
                type="button"
                onClick={openEditParentModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors shrink-0"
              >
                <Edit2 className="size-3.5" />
                Edit / Update Details
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-border/60">
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

              {/* Primary Contact */}
              <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                  Primary Mobile Phone
                </span>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  {st.phone || 'Not provided'}
                </p>
                {st.alt_phone && (
                  <p className="text-xs text-muted-foreground">
                    Alt: <strong className="text-foreground">{st.alt_phone}</strong>
                  </p>
                )}
              </div>

              {/* Email & Home Address */}
              <div className="rounded-2xl bg-muted/30 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider">
                  Email & Address
                </span>
                <p className="text-xs font-semibold text-foreground truncate">
                  {formatDisplayEmail(st.email, st.phone)}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {st.address || 'Address on school file'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: ACADEMIC MARKS & REPORT CARDS */}
        {subTab === 'academic' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!hasUploadedMarks ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center mx-auto">
                  <BookOpen className="size-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-bold text-foreground">
                    No Examination Marks Uploaded Yet
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your subject teachers have not published examination marks for this academic term yet. Once teachers upload and publish unit test or term assessment marks, your official report card will appear here.
                  </p>
                </div>
              </div>
            ) : (
              marksByExam.map(([examTitle, marksList], eIdx) => {
                const examFull = marksList.reduce((acc, m) => acc + (Number(m.full_marks) || 100), 0);
                const examObt = marksList.reduce((acc, m) => acc + (Number(m.marks_obtained) || 0), 0);
                const examPct = examFull > 0 ? Math.round((examObt / examFull) * 1000) / 10 : 0;
                const examGrd = calculateGrade(examPct);

                return (
                  <div key={eIdx} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Award className="size-5 text-emerald-600" />
                          <h3 className="text-base font-bold text-foreground">{examTitle}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Official Term Assessment Report Card & Subject Performance
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Score</span>
                          <span className="text-sm font-extrabold text-foreground">{examObt} / {examFull}</span>
                        </div>
                        <span className="inline-flex items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 px-3 py-1 text-xs font-extrabold">
                          Grade {examGrd} ({examPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="border border-border rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="px-4 py-3">Subject Name</th>
                            <th className="px-4 py-3 text-center">Full Marks</th>
                            <th className="px-4 py-3 text-center">Marks Obtained</th>
                            <th className="px-4 py-3 text-center">Grade</th>
                            <th className="px-4 py-3">Teacher Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {marksList.map((row) => (
                            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-bold text-foreground">{row.subject}</td>
                              <td className="px-4 py-3 text-center font-mono text-muted-foreground">{row.full_marks}</td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-primary">{row.marks_obtained}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 font-bold">
                                  {row.grade || calculateGrade(Number(row.marks_obtained), Number(row.full_marks))}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{row.remarks || 'Satisfactory'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUB-TAB: CLASS DAILY ROUTINE & WEEKLY TIMETABLE */}
        {subTab === 'routine' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="size-5 text-primary" />
                    Class Daily Routine & Weekly Timetable
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official weekly timetable for <strong className="text-foreground">{st.class_name || 'Class'}</strong>. Managed and updated exclusively by the School Administration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullWeeklyView(!showFullWeeklyView)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all shrink-0"
                >
                  <FileText className="size-3.5 text-primary" />
                  {showFullWeeklyView ? 'Day-by-Day View' : 'Full Weekly Matrix'}
                </button>
              </div>

              {/* Day Selector Navigation */}
              {!showFullWeeklyView && (
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/60 no-scrollbar">
                  {DAYS_OF_WEEK.map((day) => {
                    const teachingCount = classTimetable.filter((e) => e.day_of_week === day && !e.is_break).length;
                    const breakCount = classTimetable.filter((e) => e.day_of_week === day && e.is_break).length;
                    const isToday = getCurrentDayOfWeek() === day;
                    const active = selectedRoutineDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedRoutineDay(day)}
                        className={`relative flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isToday && (
                          <span
                            className={`size-2 rounded-full animate-pulse ${
                              active ? 'bg-amber-300' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                        <span>{day}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            active
                              ? 'bg-primary-dark text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {teachingCount} {teachingCount === 1 ? 'Period' : 'Periods'}
                        </span>
                        {breakCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              active
                                ? 'bg-amber-400/30 text-amber-100'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            🥪 {breakCount}
                          </span>
                        )}
                        {isToday && (
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-sm ${
                              active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FULL WEEKLY MATRIX VIEW */}
            {showFullWeeklyView ? (
              <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Full Weekly Schedule (Monday – Saturday)
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {classTimetable.filter((e) => !e.is_break).length} Teaching Periods
                    {classTimetable.filter((e) => e.is_break).length > 0 &&
                      ` + ${classTimetable.filter((e) => e.is_break).length} Breaks`}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-5 py-3.5">Day</th>
                        <th className="px-5 py-3.5">Slot / Period</th>
                        <th className="px-5 py-3.5">Subject / Activity</th>
                        <th className="px-5 py-3.5">Teacher / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {classTimetable.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                            No routine periods scheduled for this class yet.
                          </td>
                        </tr>
                      ) : (
                        classTimetable.map((entry) => (
                          <tr
                            key={entry.id}
                            className={`transition-colors ${
                              entry.is_break
                                ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-5 py-3.5 font-bold text-foreground">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                  entry.is_break
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {entry.day_of_week}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {entry.is_break ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold tracking-wide uppercase">
                                  🥪 Non-Period Slot
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-primary">
                                  Period {entry.period_number}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-foreground">
                              <div className="flex items-center gap-2">
                                <span>{entry.subject || (entry.is_break ? 'Tiffin Break' : '')}</span>
                                {entry.timing_slot && (
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                    ⏰ {entry.timing_slot}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              {entry.is_break ? (
                                <span className="text-muted-foreground italic text-[11px]">
                                  Recess Interval • No Teaching
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-medium">
                                  {entry.teacher_name}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* DAY-BY-DAY TIMELINE VIEW */
              (() => {
                const dayPeriods = classTimetable.filter((e) => e.day_of_week === selectedRoutineDay);

                if (dayPeriods.length === 0) {
                  return (
                    <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                      <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                        <Clock className="size-8" />
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="text-base font-bold text-foreground">
                          No Classes Scheduled for {selectedRoutineDay}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedRoutineDay === 'Sunday'
                            ? 'Sunday is a weekly holiday.'
                            : `There are no scheduled class periods for ${selectedRoutineDay} in ${st.class_name || 'this class'}. Switch to another day above to view the routine.`}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayPeriods.map((period) => {
                      if (period.is_break) {
                        return (
                          <div
                            key={period.id}
                            className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-card p-5 shadow-soft hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                          >
                            {/* Top: Break Badge */}
                            <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-extrabold">
                                🥪 Tiffin / Recess Break
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/90 dark:text-amber-300/90 bg-amber-500/15 px-2 py-0.5 rounded-md">
                                Non-Period
                              </span>
                            </div>

                            {/* Middle: Subject & Timing */}
                            <div className="space-y-1.5">
                              <h4 className="text-base font-extrabold text-foreground tracking-tight">
                                {period.subject || 'Tiffin Break (টিফিন বিরতি)'}
                              </h4>
                              {period.timing_slot ? (
                                <p className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                  ⏰ {period.timing_slot}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Lunch & Refreshment Interval
                                </p>
                              )}
                            </div>

                            {/* Bottom: Note */}
                            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="italic">School Recess</span>
                              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Enjoy your break!</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={period.id}
                          className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                        >
                          {/* Top: Period Badge */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1 text-xs font-extrabold">
                              <Clock className="size-3.5" />
                              Period {period.period_number}
                            </span>
                            {period.timing_slot && (
                              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                                {period.timing_slot}
                              </span>
                            )}
                          </div>

                          {/* Middle: Subject */}
                          <div className="space-y-1">
                            <h4 className="text-base font-extrabold text-foreground tracking-tight">
                              {period.subject}
                            </h4>
                          </div>

                          {/* Bottom: Teacher info */}
                          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Teacher:</span>
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <User className="size-3.5 text-muted-foreground" />
                              {period.teacher_name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* SUB-TAB: EXAM TIMETABLE & SCHEDULE */}
        {subTab === 'exams' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  Upcoming Examination Timetable & Schedule
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official class exam schedule for <strong className="text-foreground">{st.class_name || 'Class'}</strong>.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-extrabold self-start sm:self-auto">
                <Calendar className="size-3.5" />
                {scheduledExams.length} {scheduledExams.length === 1 ? 'Exam' : 'Exams'} Scheduled
              </span>
            </div>

            {scheduledExams.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                  <Calendar className="size-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-bold text-foreground">
                    No Examination Scheduled for {st.class_name || 'Your Class'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    There are no active examination timetables published for your class right now. When school administrators or subject teachers schedule unit tests or terminal exams, they will appear here automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Top Exam Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                          {exam.exam_name}
                        </span>
                        <h4 className="text-base font-extrabold text-foreground">
                          {exam.subject}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 px-2.5 py-1 rounded-xl block">
                          {exam.full_marks} Marks
                        </span>
                      </div>
                    </div>

                    {/* Date, Time, Duration Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-4 text-primary shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Exam Date</span>
                          <span className="font-bold text-foreground">{formatDateDDMMYYYY(exam.date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 text-primary shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Time & Duration</span>
                          <span className="font-bold text-foreground">{exam.time} ({exam.duration})</span>
                        </div>
                      </div>
                    </div>

                    {/* Optional Room & Instructions */}
                    {(exam.room_number || exam.instructions) && (
                      <div className="rounded-2xl bg-muted/40 p-3 space-y-1 text-xs">
                        {exam.room_number && (
                          <p className="text-muted-foreground">
                            Examination Room / Hall: <strong className="text-foreground">{exam.room_number}</strong>
                          </p>
                        )}
                        {exam.instructions && (
                          <p className="text-muted-foreground">
                            Instructions: <span className="text-foreground">{exam.instructions}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Scheduled By Attribution */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      <span>Scheduled by: <strong className="text-foreground">{exam.created_by_name}</strong></span>
                      {exam.updated_by_name && (
                        <span className="text-[10px] text-muted-foreground">Modified: {exam.updated_by_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: ATTENDANCE RECORD */}
        {subTab === 'attendance' && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-5 text-indigo-600" />
                Attendance Record & History Log
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                Attendance Rate: {attendancePercentage}%
              </span>
            </div>

            {/* Stat Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Attendance Rate</span>
                <span className="text-3xl font-extrabold text-primary">{attendancePercentage}%</span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-4 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Logged Days</span>
                <span className="text-2xl font-bold text-foreground">{totalDays}</span>
              </div>

              <div className="rounded-2xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 p-4 text-center">
                <span className="text-[10px] font-bold uppercase block">Days Present</span>
                <span className="text-2xl font-bold">{presentDays}</span>
              </div>

              <div className="rounded-2xl bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 p-4 text-center">
                <span className="text-[10px] font-bold uppercase block">Days Absent</span>
                <span className="text-2xl font-bold">{absentDays}</span>
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
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground font-medium">
                        No attendance records logged yet for this student.
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((att) => (
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
                            {att.status === 'present' ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
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

        {/* SUB-TAB 4: SCHOOL NOTICES */}
        {subTab === 'notices' && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="size-5 text-primary" />
                School Notices & Circulars
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official announcements published for students and parents.
              </p>
            </div>

            {notices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No active announcements at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((n) => (
                  <div key={n.id} className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {n.is_pinned && <span className="size-2 rounded-full bg-primary" />}
                        {n.title}
                      </h4>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formatDateDDMMYYYY(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.content}
                    </p>
                    <div className="pt-2 text-[11px] text-muted-foreground">
                      Published by: <strong className="text-foreground">{n.author_name || 'School Administration'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT PARENT MODAL */}
      {showEditParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                Edit Parent / Guardian Details
              </h3>
              <button
                type="button"
                onClick={() => setShowEditParentModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParentForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Father's Full Name</label>
                  <input
                    type="text"
                    value={parentForm.father_name}
                    onChange={(e) => setParentForm({ ...parentForm, father_name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Father name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Father's Occupation</label>
                  <input
                    type="text"
                    value={parentForm.father_occupation}
                    onChange={(e) => setParentForm({ ...parentForm, father_occupation: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Business, Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Mother's Full Name</label>
                  <input
                    type="text"
                    value={parentForm.mother_name}
                    onChange={(e) => setParentForm({ ...parentForm, mother_name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Mother name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Mother's Occupation</label>
                  <input
                    type="text"
                    value={parentForm.mother_occupation}
                    onChange={(e) => setParentForm({ ...parentForm, mother_occupation: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Homemaker, Teacher"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Primary Mobile Phone</label>
                  <input
                    type="tel"
                    value={parentForm.phone}
                    onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="10-digit number"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Alternative Phone</label>
                  <input
                    type="tel"
                    value={parentForm.alt_phone}
                    onChange={(e) => setParentForm({ ...parentForm, alt_phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Alternate number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  placeholder="name@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Residential Address</label>
                <textarea
                  rows={3}
                  value={parentForm.address}
                  onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Village, PO, District, PIN..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditParentModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
