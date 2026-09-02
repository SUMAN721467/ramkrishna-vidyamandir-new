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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import {
  fetchStudents,
  fetchParentChildren,
  fetchAttendance,
  fetchNotices,
  requestStudentPhotoChange,
  rejectStudentPhotoChange,
  updateStudent,
} from '../../lib/portal-db';
import { formatDateDDMMYYYY } from '../../lib/format';
import { uploadProfilePhoto } from '../../lib/storage';
import { toast } from 'sonner';
import type { Student, AttendanceRecord, Notice } from '../../types/portal';

export const Route = createFileRoute('/portal/parent')({
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
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

  // Student sub-tabs: 'profile' | 'academic' | 'attendance' | 'notices'
  const [subTab, setSubTab] = useState<'profile' | 'academic' | 'attendance' | 'notices'>('profile');

  // Attendance history & notices
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  // Derived Attendance Stats
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter((a) => a.status === 'present' || a.status === 'late').length;
  const absentDays = attendanceHistory.filter((a) => a.status === 'absent').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Protected route check
  useEffect(() => {
    if (!authLoading) {
      if (!role) {
        navigate({ to: '/portal/login' });
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

        // Fetch school notices
        const nots = await fetchNotices('parent');
        setNotices(nots);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load student portal info');
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
        pending_avatar_requested_at: new Date().toISOString(),
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

  // Handle Save Parent & Contact Details
  const handleSaveParentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    try {
      const updated = await updateStudent(activeStudent.id, parentForm);
      setActiveStudent(updated);
      setShowEditParentModal(false);
      toast.success('Parent & contact details updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update details');
    }
  };

  if (authLoading || (loading && !activeStudent)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Loading Student Portal...</p>
        </div>
      </div>
    );
  }

  const st = activeStudent || {
    id: 'st-logged-in',
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
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <PortalHeader title="Student Portal" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-300">
        {/* Hidden File Input for Student Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelected}
        />

        {/* ALWAYS-VISIBLE FIXED STUDENT PROFILE BANNER */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                {st.avatar_url ? (
                  <img
                    src={st.avatar_url}
                    alt={st.first_name}
                    className="size-24 rounded-3xl object-cover border-2 border-primary shadow-soft"
                  />
                ) : (
                  <div className="grid size-24 place-items-center rounded-3xl bg-primary/10 text-primary font-extrabold text-3xl border-2 border-primary">
                    {st.first_name.charAt(0)}
                  </div>
                )}

                {/* Upload / Change Photo Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 grid place-items-center bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                  title="Change Profile Photo (Subject to Admin Approval)"
                >
                  <div className="flex flex-col items-center gap-1 text-[10px] font-bold">
                    <Camera className="size-5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Change'}</span>
                  </div>
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {st.first_name} {st.last_name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold uppercase">
                    <ShieldCheck className="size-3.5" />
                    Enrolled Student
                  </span>
                </div>

                <p className="text-sm font-bold text-primary">
                  {st.class_name || 'Class 5'} — {st.section_name || 'Section A'} • Roll Number: <span className="font-mono text-foreground font-extrabold">#{st.roll_number}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
              <span className="text-2xl font-extrabold text-emerald-600 block mt-1">
                Grade A+ (91.4%)
              </span>
              <span className="text-xs text-muted-foreground font-medium block">
                Attendance Rate: {attendancePercentage}% • Class Rank: #02
              </span>
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
            { id: 'academic', label: 'Academic Marks & Grades', icon: BookOpen },
            { id: 'attendance', label: 'Attendance Record', icon: Calendar },
            { id: 'notices', label: `School Notices (${notices.length})`, icon: Megaphone },
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

              {/* Contact Information */}
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
        )}

        {/* SUB-TAB 2: ACADEMIC MARKS & REPORT CARD */}
        {subTab === 'academic' && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                Academic Performance & Assessment Report
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

        {/* SUB-TAB 4: SCHOOL NOTICES */}
        {subTab === 'notices' && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Megaphone className="size-5 text-primary" />
              School Announcements & Official Notices
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {notices.map((n) => (
                <div key={n.id} className="rounded-2xl border border-border bg-muted/20 p-5 space-y-2">
                  <h4 className="font-bold text-foreground text-sm">{n.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.content}</p>
                  <p className="text-[10px] font-semibold text-primary pt-1">
                    Posted on: {formatDateDDMMYYYY(n.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT PARENT & CONTACT DETAILS MODAL */}
        {showEditParentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift text-card-foreground space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="size-5 text-emerald-600" />
                  Update Parent & Contact Details
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditParentModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveParentDetails} className="space-y-4">
                {/* Father Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Father's Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Father's Name"
                        value={parentForm.father_name}
                        onChange={(e) => setParentForm({ ...parentForm, father_name: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Father's Occupation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Farmer / Business / Teacher"
                        value={parentForm.father_occupation}
                        onChange={(e) => setParentForm({ ...parentForm, father_occupation: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Details */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Mother's Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Mother's Name"
                        value={parentForm.mother_name}
                        onChange={(e) => setParentForm({ ...parentForm, mother_name: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Mother's Occupation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Homemaker / Service"
                        value={parentForm.mother_occupation}
                        onChange={(e) => setParentForm({ ...parentForm, mother_occupation: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Numbers & Email */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Contact & Communication
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Primary Mobile (Login ID)
                      </label>
                      <input
                        type="tel"
                        placeholder="Primary Mobile Number"
                        value={parentForm.phone}
                        onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Alternative Mobile (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="Secondary / Guardian Mobile"
                        value={parentForm.alt_phone}
                        onChange={(e) => setParentForm({ ...parentForm, alt_phone: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. parent@gmail.com"
                      value={parentForm.email}
                      onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Residential Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Village / Post / District / PIN"
                      value={parentForm.address}
                      onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditParentModal(false)}
                    className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary-dark transition-colors"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
