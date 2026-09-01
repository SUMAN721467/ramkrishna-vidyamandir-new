import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import { fetchParentChildren, fetchAttendance, fetchNotices } from '../../lib/portal-db';
import { toast } from 'sonner';
import type { Student, AttendanceRecord, Notice } from '../../types/portal';

export const Route = createFileRoute('/portal/parent')({
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Student profile state
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Student sub-tabs: 'profile' | 'academic' | 'attendance' | 'notices'
  const [subTab, setSubTab] = useState<'profile' | 'academic' | 'attendance' | 'notices'>('profile');

  // Attendance history & notices
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

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
        const childList = await fetchParentChildren(user.id);

        let studentObj: Student;

        if (childList.length > 0) {
          studentObj = childList[0];
        } else {
          // Construct default student profile for logged in user
          studentObj = {
            id: user.id || 'st-logged-in',
            roll_number: '01',
            first_name: profile?.full_name?.split(' ')[0] || 'Student',
            last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'User',
            class_id: 'c5',
            section_id: 's1',
            class_name: 'Class 5',
            section_name: 'Section A',
            date_of_birth: '2014-05-12',
            gender: 'Male',
            status: 'active',
            avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          };
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

  // Calculate attendance stats
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter((a) => a.status === 'present').length;
  const absentDays = attendanceHistory.filter((a) => a.status === 'absent').length;
  const lateDays = attendanceHistory.filter((a) => a.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 92;

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
    avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <PortalHeader title="Student Portal" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-300">
        {/* ALWAYS-VISIBLE FIXED STUDENT PROFILE BANNER */}
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold uppercase">
                    <ShieldCheck className="size-3.5" />
                    Enrolled Student
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
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              Student Profile & Guardian Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
              <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Guardian / Parent Name</span>
                <p className="text-sm font-bold text-foreground">Shri Rajesh Kumar Das</p>
                <span className="text-xs text-primary font-semibold block">Relationship: Father</span>
              </div>

              <div className="rounded-2xl bg-muted/30 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Emergency Contact</span>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-emerald-600" />
                  +91 94340 98765
                </p>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-primary" />
                  {profile?.email || 'parent@rkvm.edu.in'}
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
                <span className="text-2xl font-bold text-foreground">{totalDays || 15}</span>
              </div>

              <div className="rounded-2xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 p-4 text-center">
                <span className="text-[10px] font-bold uppercase block">Days Present</span>
                <span className="text-2xl font-bold">{presentDays || 14}</span>
              </div>

              <div className="rounded-2xl bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 p-4 text-center">
                <span className="text-[10px] font-bold uppercase block">Days Absent</span>
                <span className="text-2xl font-bold">{absentDays || 1}</span>
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
                    [
                      { date: '2026-08-31', status: 'present', marked: 'Smt. Sunita Mukhopadhyay' },
                      { date: '2026-08-30', status: 'present', marked: 'Smt. Sunita Mukhopadhyay' },
                      { date: '2026-08-29', status: 'present', marked: 'Smt. Sunita Mukhopadhyay' },
                      { date: '2026-08-28', status: 'present', marked: 'Smt. Sunita Mukhopadhyay' },
                      { date: '2026-08-27', status: 'absent', marked: 'Smt. Sunita Mukhopadhyay' },
                    ].map((att, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
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
                        <td className="px-4 py-3 text-muted-foreground">{att.marked}</td>
                      </tr>
                    ))
                  ) : (
                    attendanceHistory.map((att) => (
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
                    Posted on: {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
