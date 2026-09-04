import React, { useEffect, useState, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Save,
  Users,
  CheckCheck,
  Ban,
  FileText,
  Megaphone,
  CheckSquare,
  BookOpen,
  Award,
  Plus,
  Trash2,
  Edit2,
  X,
  User,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import {
  updateProfile,
  generateTeacherDefaultPassword,
  isSyntheticEmail,
  formatDisplayEmail,
  fetchTeacherClasses,
  fetchStudents,
  fetchAttendance,
  submitAttendanceBatch,
  fetchNotices,
  fetchStudentMarks,
  submitStudentMarksBatch,
  calculateGrade,
  fetchScheduledExams,
  addScheduledExam,
  updateScheduledExam,
  deleteScheduledExam,
  fetchSubjects,
} from '../../lib/portal-db';
import { formatDateDDMMYYYY, formatDateSlash, parseDateToISO } from '../../lib/format';
import { DateInput } from '../../components/ui/date-input';
import { ConfirmDialog } from '../../components/portal/ConfirmDialog';
import { uploadProfilePhoto } from '../../lib/storage';
import { toast } from 'sonner';
import type { Student, AttendanceRecord, Notice, AttendanceStatus, StudentMark, ScheduledExam, Subject } from '../../types/portal';

export const Route = createFileRoute('/portal/teacher')({
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const { user, profile, role, loading: authLoading, updateCurrentProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [savingExam, setSavingExam] = useState(false);

  // Teacher Assigned Classes
  const [assignedClasses, setAssignedClasses] = useState<
    { class_id: string; section_id: string; class_name?: string; section_name?: string }[]
  >([]);

  // Selected Class/Section & Date
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Students in selected class
  const [students, setStudents] = useState<Student[]>([]);

  // Local Attendance State map: studentId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  // Summary / Notices
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);

  // Marks Entry State
  const [examName, setExamName] = useState('Unit Assessment 1 (2026)');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [fullMarks, setFullMarks] = useState<number>(100);
  const [marksMap, setMarksMap] = useState<Record<string, { marks_obtained: string; remarks: string }>>({});
  const [publishedMarks, setPublishedMarks] = useState<StudentMark[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Exam Scheduling State
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ScheduledExam | null>(null);
  const [deleteExamModal, setDeleteExamModal] = useState<{ id: string; name: string } | null>(null);
  const [examForm, setExamForm] = useState({
    exam_name: 'Unit Assessment 1 (2026)',
    class_id: '',
    subject: 'Mathematics',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:30 AM',
    duration: '2 Hours',
    full_marks: 100,
    room_number: 'Room 101',
    instructions: 'Bring geometry box and black pen. Arrive 15 mins early.',
  });

  // Active Tab: 'take' | 'marks' | 'exams' | 'history' | 'notices' | 'profile'
  const [activeTab, setActiveTab] = useState<'take' | 'marks' | 'exams' | 'history' | 'notices' | 'profile'>('take');

  // Teacher Profile Edit State
  const [teacherProfileForm, setTeacherProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    qualification: '',
    specialized_subject: '',
    aadhar_number: '',
  });
  const [teacherAvatarFile, setTeacherAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      setTeacherProfileForm({
        full_name: profile.full_name || '',
        email: isSyntheticEmail(profile.email, profile.phone) ? '' : (profile.email || ''),
        phone: profile.phone || '',
        address: profile.address || '',
        qualification: profile.qualification || '',
        specialized_subject: profile.specialized_subject || '',
        aadhar_number: profile.aadhar_number || '',
      });
    }
  }, [profile]);

  // Handle Save Teacher Profile
  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      let avatar_url = profile.avatar_url;
      if (teacherAvatarFile) {
        avatar_url = await uploadProfilePhoto(teacherAvatarFile, 'teachers');
      }

      const updated = await updateProfile(profile.id, {
        full_name: teacherProfileForm.full_name.trim(),
        email: (isSyntheticEmail(teacherProfileForm.email, teacherProfileForm.phone) || !teacherProfileForm.email.trim()) ? 'NA' : teacherProfileForm.email.trim(),
        phone: teacherProfileForm.phone.trim(),
        address: teacherProfileForm.address.trim(),
        qualification: teacherProfileForm.qualification.trim(),
        specialized_subject: teacherProfileForm.specialized_subject.trim(),
        aadhar_number: teacherProfileForm.aadhar_number.trim(),
        avatar_url,
      });

      updateCurrentProfile(updated);
      setTeacherAvatarFile(null);
      toast.success('Your teacher profile details have been updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Protected route check
  useEffect(() => {
    if (!authLoading) {
      if (!role) {
        navigate({ to: '/portal/login' });
      } else if (role === 'parent') {
        toast.error('Access Restricted: Teacher clearance required.');
        navigate({ to: '/portal/student' });
      }
    }
  }, [role, authLoading, navigate]);

  // Load Teacher Classes & Subjects
  useEffect(() => {
    async function loadTeacherClasses() {
      if (!user) return;
      setLoading(true);
      try {
        const [classes, nots, subs] = await Promise.all([
          fetchTeacherClasses(user.id),
          fetchNotices('teacher'),
          fetchSubjects(),
        ]);

        setAssignedClasses(classes);
        setAvailableSubjects(subs);
        if (classes.length > 0) {
          setSelectedClassId(classes[0].class_id);
          setSelectedSectionId(classes[0].section_id);
        }

        setNotices(nots);
      } catch (err: any) {
        console.error('[Teacher Dashboard] Class/Subject load error:', err);
        toast.error(err?.message || 'Failed to load teacher class assignments');
      } finally {
        setLoading(false);
      }
    }
    loadTeacherClasses();
  }, [user]);

  // Subjects filtered for the currently selected class
  const classSubjects = useMemo(() => {
    if (!availableSubjects || availableSubjects.length === 0) return [];
    const filtered = availableSubjects.filter(
      (s) => !s.class_id || s.class_id === 'all' || s.class_id === selectedClassId
    );
    return filtered.length > 0 ? filtered : availableSubjects;
  }, [availableSubjects, selectedClassId]);

  // Keep subjectName aligned with available class subjects
  useEffect(() => {
    if (classSubjects.length > 0) {
      if (!classSubjects.some((s) => s.name === subjectName)) {
        setSubjectName(classSubjects[0].name);
      }
    }
  }, [classSubjects, selectedClassId]);

  // Load Students and existing attendance when Class or Date changes
  useEffect(() => {
    async function loadClassData() {
      if (!selectedClassId || !selectedSectionId) return;
      setLoading(true);
      try {
        const stList = await fetchStudents(selectedClassId, selectedSectionId);
        setStudents(stList);

        // Fetch existing attendance records for this date/class/section
        const existingAtt = await fetchAttendance({
          date: parseDateToISO(selectedDate),
          classId: selectedClassId,
          sectionId: selectedSectionId,
        });

        setRecentRecords(existingAtt);

        // Build initial attendance status map
        const newMap: Record<string, AttendanceStatus> = {};
        stList.forEach((st) => {
          const match = existingAtt.find((a) => a.student_id === st.id);
          newMap[st.id] = match ? match.status : 'present'; // Default Present
        });
        setAttendanceMap(newMap);
      } catch (err: any) {
        console.error('[Teacher Dashboard] Class data error:', err);
        toast.error(err?.message || 'Error loading class attendance sheet');
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [selectedClassId, selectedSectionId, selectedDate]);

  // Load published marks for this class & section
  useEffect(() => {
    async function loadMarksData() {
      if (!selectedClassId || !selectedSectionId) return;
      try {
        const marks = await fetchStudentMarks({
          classId: selectedClassId,
          sectionId: selectedSectionId,
          examName: examName,
        });
        setPublishedMarks(marks);

        // Pre-fill input map if matching subject exists
        const initialMap: Record<string, { marks_obtained: string; remarks: string }> = {};
        students.forEach((st) => {
          const match = marks.find((m) => m.student_id === st.id && m.subject.toLowerCase() === subjectName.toLowerCase());
          initialMap[st.id] = {
            marks_obtained: match ? String(match.marks_obtained) : '',
            remarks: match?.remarks || '',
          };
        });
        setMarksMap(initialMap);
      } catch (e) {
        console.warn('Error loading marks:', e);
      }
    }
    loadMarksData();
  }, [selectedClassId, selectedSectionId, examName, subjectName, students]);

  // Status toggle handler
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark All shortcuts
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
    toast.info(`Marked all students as ${status.toUpperCase()}`);
  };

  // Submit Attendance Batch
  const handleSubmitAttendance = async () => {
    if (students.length === 0) {
      toast.error('No students in selected class to submit attendance.');
      return;
    }

    setSaving(true);
    try {
      const recordsToInsert = students.map((st) => ({
        student_id: st.id,
        class_id: selectedClassId,
        section_id: selectedSectionId,
        date: parseDateToISO(selectedDate),
        status: attendanceMap[st.id] || 'present',
        marked_by: user?.id || 'u-teacher-1',
      }));

      await submitAttendanceBatch(recordsToInsert);
      toast.success(`Attendance for ${students.length} students submitted successfully!`);

      // Refresh recent records
      const updatedAtt = await fetchAttendance({
        date: parseDateToISO(selectedDate),
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      setRecentRecords(updatedAtt);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  // Submit Marks Batch
  const handleSubmitMarks = async () => {
    if (students.length === 0) {
      toast.error('No students in this class section.');
      return;
    }
    const marksToInsert: Omit<StudentMark, 'id' | 'created_at'>[] = [];
    for (const st of students) {
      const val = marksMap[st.id]?.marks_obtained;
      if (val !== undefined && val !== '') {
        const numericVal = Number(val);
        if (isNaN(numericVal) || numericVal < 0 || numericVal > fullMarks) {
          toast.error(`Invalid marks for ${st.first_name}: enter number between 0 and ${fullMarks}`);
          return;
        }
        marksToInsert.push({
          student_id: st.id,
          class_id: selectedClassId,
          section_id: selectedSectionId,
          exam_name: examName.trim(),
          subject: subjectName.trim(),
          full_marks: fullMarks,
          marks_obtained: numericVal,
          grade: calculateGrade(numericVal, fullMarks),
          remarks: marksMap[st.id]?.remarks || '',
          teacher_id: user?.id,
        });
      }
    }

    if (marksToInsert.length === 0) {
      toast.error('Please enter marks for at least one student before submitting.');
      return;
    }

    setSavingMarks(true);
    try {
      await submitStudentMarksBatch(marksToInsert);
      toast.success(`Marks for ${marksToInsert.length} students published successfully!`);
      const updatedMarks = await fetchStudentMarks({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        examName: examName,
      });
      setPublishedMarks(updatedMarks);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  // Load scheduled exams for selected class
  const loadClassExams = async () => {
    if (!selectedClassId) return;
    try {
      const ex = await fetchScheduledExams(selectedClassId);
      setScheduledExams(ex);
    } catch (err) {
      console.error('Error loading scheduled exams:', err);
    }
  };

  useEffect(() => {
    loadClassExams();
  }, [selectedClassId, activeTab]);

  // Open Create Exam Modal
  const openCreateExamModal = () => {
    setEditingExam(null);
    setExamForm({
      exam_name: 'Unit Assessment 1 (2026)',
      class_id: selectedClassId,
      subject: 'Mathematics',
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      time: '10:30 AM',
      duration: '2 Hours',
      full_marks: 100,
      room_number: 'Room 101',
      instructions: 'Bring geometry box and black pen. Arrive 15 mins early.',
    });
    setShowExamModal(true);
  };

  // Open Edit Exam Modal
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

  // Save Exam (Create or Update)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.exam_name || !examForm.subject || !examForm.date || !examForm.time) {
      toast.error('Please fill in all required exam fields.');
      return;
    }

    setSavingExam(true);
    const creatorName = profile?.full_name ? `${profile.full_name} (Teacher)` : 'Class Teacher';
    try {
      if (editingExam) {
        await updateScheduledExam(editingExam.id, {
          exam_name: examForm.exam_name.trim(),
          class_id: examForm.class_id || selectedClassId,
          subject: examForm.subject.trim(),
          date: parseDateToISO(examForm.date),
          time: examForm.time.trim(),
          duration: examForm.duration.trim(),
          full_marks: Number(examForm.full_marks) || 100,
          room_number: examForm.room_number?.trim(),
          instructions: examForm.instructions?.trim(),
          updated_by_name: creatorName,
        });
        toast.success('Exam schedule updated successfully!');
      } else {
        await addScheduledExam({
          exam_name: examForm.exam_name.trim(),
          class_id: examForm.class_id || selectedClassId,
          subject: examForm.subject.trim(),
          date: parseDateToISO(examForm.date),
          time: examForm.time.trim(),
          duration: examForm.duration.trim(),
          full_marks: Number(examForm.full_marks) || 100,
          room_number: examForm.room_number?.trim(),
          instructions: examForm.instructions?.trim(),
          created_by: user?.id || 'teacher',
          created_by_name: creatorName,
        });
        toast.success('New exam scheduled successfully for students!');
      }
      setShowExamModal(false);
      await loadClassExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save exam schedule');
    } finally {
      setSavingExam(false);
    }
  };

  // Delete Exam Confirmation
  const confirmDeleteExam = async () => {
    if (!deleteExamModal) return;
    try {
      await deleteScheduledExam(deleteExamModal.id);
      toast.success('Exam schedule deleted successfully.');
      setDeleteExamModal(null);
      await loadClassExams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete exam');
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'late').length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <PortalHeader title="Teacher Class Dashboard" avatarUrl={profile?.avatar_url} />

      {/* Subnav Tabs */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs sticky top-[57px] z-30">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <div className="flex space-x-2 py-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('take')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'take'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CheckSquare className="size-4" />
              Take Attendance
            </button>

            <button
              onClick={() => setActiveTab('marks')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'marks'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <BookOpen className="size-4" />
              Upload / Enter Marks
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'exams'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Calendar className="size-4" />
              Exam Schedules ({scheduledExams.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <FileText className="size-4" />
              Class Summary & History
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'notices'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Megaphone className="size-4" />
              Staff Notices ({notices.length})
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <User className="size-4" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* TAKE ATTENDANCE TAB */}
        {activeTab === 'take' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Control Panel Card: Class & Date Selection */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Daily Class Attendance Register
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select your assigned class and date to mark or edit student attendance.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={saving || students.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Submit Attendance
                </button>
              </div>

              {/* Class & Date Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border/60">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Assigned Class & Section
                  </label>
                  <select
                    value={`${selectedClassId}_${selectedSectionId}`}
                    onChange={(e) => {
                      const [cId, sId] = e.target.value.split('_');
                      setSelectedClassId(cId);
                      setSelectedSectionId(sId);
                    }}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {assignedClasses.map((ac) => (
                      <option key={`${ac.class_id}_${ac.section_id}`} value={`${ac.class_id}_${ac.section_id}`}>
                        {ac.class_name} — {ac.section_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Attendance Date <span className="text-[10px] text-muted-foreground/80 font-normal lowercase">(dd/mm/yyyy)</span>
                  </label>
                  <DateInput
                    placeholder="DD/MM/YYYY"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Quick Stats Pills */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold">
                      <CheckCircle2 className="size-3.5" />
                      {presentCount} Present
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 text-xs font-bold">
                      <XCircle className="size-3.5" />
                      {absentCount} Absent
                    </span>
                    {lateCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 text-xs font-bold">
                        <Clock className="size-3.5" />
                        {lateCount} Late
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Quick Batch Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground">Quick Actions:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors"
                  >
                    <Ban className="size-3.5" />
                    Mark All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Student List Sheet */}
            <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Student List ({students.length} Students)
                </h3>
                <span className="text-xs text-muted-foreground font-mono">Date: {formatDateDDMMYYYY(selectedDate)}</span>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No active students enrolled in this class section.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((st) => {
                    const currentStatus = attendanceMap[st.id] || 'present';
                    return (
                      <div
                        key={st.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-primary w-8 text-center shrink-0">
                            #{st.roll_number}
                          </span>

                          {st.avatar_url ? (
                            <img
                              src={st.avatar_url}
                              alt={st.first_name}
                              className="size-11 rounded-full object-cover border border-primary/20 shrink-0"
                            />
                          ) : (
                            <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {st.first_name.charAt(0)}
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-foreground text-sm sm:text-base">
                              {st.first_name} {st.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Class 5 - Section A • Gender: {st.gender || 'Male'}
                            </p>
                          </div>
                        </div>

                        {/* Status Toggle Buttons (Optimized for Mobile Touch) */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'present')}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-soft ring-2 ring-emerald-600/30'
                                : 'border border-border bg-background text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="size-4" />
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'absent')}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-soft ring-2 ring-rose-600/30'
                                : 'border border-border bg-background text-muted-foreground hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="size-4" />
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'late')}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-soft ring-2 ring-amber-500/30'
                                : 'border border-border bg-background text-muted-foreground hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="size-4" />
                            Late
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UPLOAD / ENTER MARKS TAB */}
        {activeTab === 'marks' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Marks Control Panel */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    Enter Student Examination Marks
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Record and publish unit test and terminal evaluation marks directly to the student portal.
                  </p>
                </div>

                {/* Save Marks Button */}
                <button
                  type="button"
                  onClick={handleSubmitMarks}
                  disabled={savingMarks || students.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {savingMarks ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save & Publish Marks
                </button>
              </div>

              {/* Exam, Subject & Class Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-border/60">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Class & Section
                  </label>
                  <select
                    value={`${selectedClassId}_${selectedSectionId}`}
                    onChange={(e) => {
                      const [cId, sId] = e.target.value.split('_');
                      setSelectedClassId(cId);
                      setSelectedSectionId(sId);
                    }}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {assignedClasses.map((ac) => (
                      <option key={`${ac.class_id}_${ac.section_id}`} value={`${ac.class_id}_${ac.section_id}`}>
                        {ac.class_name} — {ac.section_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Exam / Assessment Name
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Unit Test 1 (2026)"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Subject
                  </label>
                  <select
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classSubjects.length > 0 ? (
                      classSubjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bengali (1st Language)">Bengali (1st Language)</option>
                        <option value="English (2nd Language)">English (2nd Language)</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science & Environment">Science & Environment</option>
                        <option value="History & Geography">History & Geography</option>
                        <option value="Computer & Practical">Computer & Practical</option>
                        <option value="General Knowledge">General Knowledge</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Full Marks
                  </label>
                  <input
                    type="number"
                    value={fullMarks}
                    onChange={(e) => setFullMarks(Number(e.target.value) || 100)}
                    min={10}
                    max={200}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Marks Entry Table */}
            <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Enter Marks for {subjectName} ({examName})
                </h3>
                <span className="text-xs text-muted-foreground font-mono">Full Marks: {fullMarks}</span>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No students in this class.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((st) => {
                    const currentVal = marksMap[st.id]?.marks_obtained ?? '';
                    const currentRemarks = marksMap[st.id]?.remarks ?? '';
                    const currentGrade = currentVal !== '' && !isNaN(Number(currentVal))
                      ? calculateGrade(Number(currentVal), fullMarks)
                      : '—';

                    return (
                      <div
                        key={st.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-3 w-full md:w-1/3">
                          <span className="font-mono text-sm font-bold text-primary w-8 text-center shrink-0">
                            #{st.roll_number}
                          </span>

                          {st.avatar_url ? (
                            <img
                              src={st.avatar_url}
                              alt={st.first_name}
                              className="size-10 rounded-full object-cover border border-primary/20 shrink-0"
                            />
                          ) : (
                            <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {st.first_name.charAt(0)}
                            </div>
                          )}

                          <div className="truncate">
                            <p className="font-bold text-foreground text-sm truncate">
                              {st.first_name} {st.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Roll: #{st.roll_number}
                            </p>
                          </div>
                        </div>

                        {/* Marks & Remarks Input */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-2/3 justify-end">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              Marks Obtained:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={fullMarks}
                              value={currentVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksMap((prev) => ({
                                  ...prev,
                                  [st.id]: {
                                    ...prev[st.id],
                                    marks_obtained: val,
                                    remarks: prev[st.id]?.remarks || '',
                                  },
                                }));
                              }}
                              placeholder="0"
                              className="w-20 rounded-xl border border-input bg-background px-3 py-1.5 text-center text-sm font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                            />
                            <span className="text-xs text-muted-foreground font-mono">/ {fullMarks}</span>
                          </div>

                          <div className="w-12 text-center">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-extrabold ${
                                currentGrade !== '—'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {currentGrade}
                            </span>
                          </div>

                          <div className="flex-1 min-w-[150px]">
                            <input
                              type="text"
                              value={currentRemarks}
                              onChange={(e) => {
                                const rem = e.target.value;
                                setMarksMap((prev) => ({
                                  ...prev,
                                  [st.id]: {
                                    ...prev[st.id],
                                    marks_obtained: prev[st.id]?.marks_obtained ?? '',
                                    remarks: rem,
                                  },
                                }));
                              }}
                              placeholder="Remarks (e.g. Good progress)"
                              className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXAM SCHEDULES TAB */}
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
                    Schedule, edit, or delete exams for your assigned classes. Timetables are visible exclusively to enrolled students.
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

              {/* Class Selector */}
              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Selected Class:
                </label>
                <select
                  value={`${selectedClassId}_${selectedSectionId}`}
                  onChange={(e) => {
                    const [cId, sId] = e.target.value.split('_');
                    setSelectedClassId(cId);
                    setSelectedSectionId(sId);
                  }}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {assignedClasses.map((ac) => (
                    <option key={`${ac.class_id}_${ac.section_id}`} value={`${ac.class_id}_${ac.section_id}`}>
                      {ac.class_name} — {ac.section_name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground font-mono">
                  ({scheduledExams.length} {scheduledExams.length === 1 ? 'Exam' : 'Exams'} scheduled)
                </span>
              </div>
            </div>

            {/* Exam List */}
            {scheduledExams.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-4">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
                  <Calendar className="size-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-bold text-foreground">
                    No Examination Timetable Scheduled
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have not scheduled any upcoming examinations for this class yet. Click "Schedule New Exam" above to create and publish a timetable.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {scheduledExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md inline-block mb-1">
                          {exam.exam_name}
                        </span>
                        <h4 className="text-base font-extrabold text-foreground">
                          {exam.subject}
                        </h4>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Class: {exam.class_name || 'Class'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 px-2.5 py-1 rounded-xl">
                          {exam.full_marks} Marks
                        </span>

                        {/* Action Buttons */}
                        <button
                          type="button"
                          onClick={() => openEditExamModal(exam)}
                          className="size-8 rounded-xl border border-border bg-muted/30 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit Exam"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteExamModal({ id: exam.id, name: exam.subject })}
                          className="size-8 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 grid place-items-center text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Date & Time */}
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
                            Room: <strong className="text-foreground">{exam.room_number}</strong>
                          </p>
                        )}
                        {exam.instructions && (
                          <p className="text-muted-foreground">
                            Note: <span className="text-foreground">{exam.instructions}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Creator / Modifier Badges */}
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

            {/* CREATE / EDIT EXAM MODAL */}
            {showExamModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Calendar className="size-5 text-primary" />
                      {editingExam ? 'Edit Examination Schedule' : 'Schedule New Examination'}
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
                          Class
                        </label>
                        <select
                          value={examForm.class_id || selectedClassId}
                          onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                        >
                          {assignedClasses.map((ac) => (
                            <option key={ac.class_id} value={ac.class_id}>
                              {ac.class_name}
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
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          required
                          value={examForm.subject}
                          onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                          placeholder="e.g. Mathematics"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                        />
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
                          Date * <span className="text-[10px] text-muted-foreground/80 font-normal lowercase">(dd/mm/yyyy)</span>
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
                          placeholder="e.g. Room 102"
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
                          placeholder="e.g. Bring Admit Card"
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
          </div>
        )}

        {/* CLASS HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-base font-bold text-foreground mb-4">
                Recent Attendance Logged for Selected Class
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-mono text-xs">{formatDateDDMMYYYY(r.date)}</td>
                        <td className="px-4 py-3 font-bold">{r.student_name || 'Anirban Das'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">#{r.roll_number || '01'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                              r.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTICES TAB */}
        {activeTab === 'notices' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-foreground">Teacher Announcements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notices.map((n) => (
                <div key={n.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3">
                  <h3 className="text-base font-bold text-foreground">{n.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                  <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    Posted on: {formatDateDDMMYYYY(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MY PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Profile Banner */}
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative group">
                    {teacherAvatarFile ? (
                      <img
                        src={URL.createObjectURL(teacherAvatarFile)}
                        alt="Preview"
                        className="size-20 rounded-3xl object-cover border-2 border-primary/30 shadow-md"
                      />
                    ) : profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="size-20 rounded-3xl object-cover border-2 border-primary/30 shadow-md"
                      />
                    ) : (
                      <div className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary font-bold text-2xl border border-primary/20 shadow-soft">
                        {profile?.full_name ? profile.full_name.charAt(0) : 'T'}
                      </div>
                    )}
                    <label
                      className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-md hover:bg-primary-dark transition-transform active:scale-90 cursor-pointer"
                      title="Update Profile Photo"
                    >
                      <Camera className="size-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setTeacherAvatarFile(e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                        {profile?.full_name || 'Teacher Profile'}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-extrabold uppercase">
                        <ShieldCheck className="size-3.5" />
                        Teacher Account
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold uppercase">
                        <CheckCircle2 className="size-3.5" />
                        Active
                      </span>
                    </div>

                    <p className="text-sm font-bold text-primary">
                      {assignedClasses.length > 0 && (
                        <span>{assignedClasses[0]?.class_name} — {assignedClasses[0]?.section_name} • </span>
                      )}Faculty ID: <span className="font-mono text-foreground font-extrabold">#{profile?.id}</span>
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Mobile: <strong className="text-foreground font-mono">{profile?.phone || 'Not set'}</strong> • Email: <span className="font-mono text-foreground">{formatDisplayEmail(profile?.email, profile?.phone)}</span> • Specialization: <strong className="text-foreground">{profile?.specialized_subject || 'General'}</strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-5 text-left sm:text-right shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Staff Identity
                  </span>
                  <span className="text-lg font-bold text-primary block mt-1">
                    Verified Educator
                  </span>
                  <span className="text-xs text-muted-foreground font-medium block">
                    RKVM Teacher Directory
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveTeacherProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <User className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Personal Details & Contact</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherProfileForm.full_name}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, full_name: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Mobile Number (Login Phone) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={teacherProfileForm.phone}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={teacherProfileForm.email}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, email: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none font-mono"
                        placeholder="e.g. teacher@example.com (or leave blank for NA)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Aadhar Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="12-digit Aadhar number"
                          value={teacherProfileForm.aadhar_number}
                          onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, aadhar_number: e.target.value })}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none font-mono pl-8"
                        />
                        <ShieldCheck className="size-4 text-emerald-600 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Residential Address
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter your complete residential address"
                        value={teacherProfileForm.address}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, address: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Qualifications & Credentials Card */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <GraduationCap className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Academic & Teaching Credentials</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Highest Qualification
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc (Mathematics), B.Ed, M.A"
                        value={teacherProfileForm.qualification}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, qualification: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Specialized Subject
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mathematics, Bengali, Physical Science"
                        value={teacherProfileForm.specialized_subject}
                        onChange={(e) => setTeacherProfileForm({ ...teacherProfileForm, specialized_subject: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    {/* Assigned Classes Preview */}
                    <div className="rounded-2xl bg-muted/20 p-4 border border-border/60 space-y-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                        Assigned Teaching Classes
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {assignedClasses.map((ac) => (
                          <span
                            key={`${ac.class_id}_${ac.section_id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-1 text-xs font-bold"
                          >
                            <BookOpen className="size-3" />
                            {ac.class_name} — {ac.section_name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Portal Password Info */}
                    <div className="rounded-2xl bg-muted/20 p-4 border border-border/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                        Portal Login Password
                      </span>
                      <p className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="size-3.5 text-primary" />
                        {profile?.portal_password || generateTeacherDefaultPassword(profile?.full_name || 'Teacher')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Managed by School Administrator
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONFIRM DELETE EXAM MODAL */}
        <ConfirmDialog
          isOpen={Boolean(deleteExamModal)}
          title="Confirm Exam Schedule Deletion"
          description={`WARNING: You are about to remove the scheduled exam "${deleteExamModal?.name}". Are you sure you want to proceed?`}
          confirmLabel="Yes, Delete Exam"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmDeleteExam}
          onCancel={() => setDeleteExamModal(null)}
        />
      </main>
    </div>
  );
}

function CheckSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
