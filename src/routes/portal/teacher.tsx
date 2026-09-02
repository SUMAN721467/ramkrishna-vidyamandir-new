import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalHeader } from '../../components/portal/PortalHeader';
import {
  fetchTeacherClasses,
  fetchStudents,
  fetchAttendance,
  submitAttendanceBatch,
  fetchNotices,
} from '../../lib/portal-db';
import { formatDateDDMMYYYY } from '../../lib/format';
import { toast } from 'sonner';
import type { Student, AttendanceRecord, Notice, AttendanceStatus } from '../../types/portal';

export const Route = createFileRoute('/portal/teacher')({
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Active Tab: 'take' | 'history' | 'notices'
  const [activeTab, setActiveTab] = useState<'take' | 'history' | 'notices'>('take');

  // Protected route check
  useEffect(() => {
    if (!authLoading) {
      if (!role) {
        navigate({ to: '/portal/login' });
      } else if (role === 'parent') {
        toast.error('Access Restricted: Teacher clearance required.');
        navigate({ to: '/portal/parent' });
      }
    }
  }, [role, authLoading, navigate]);

  // Load Teacher Classes
  useEffect(() => {
    async function loadTeacherClasses() {
      if (!user) return;
      setLoading(true);
      try {
        const classes = await fetchTeacherClasses(user.id);
        setAssignedClasses(classes);
        if (classes.length > 0) {
          setSelectedClassId(classes[0].class_id);
          setSelectedSectionId(classes[0].section_id);
        }

        const nots = await fetchNotices('teacher');
        setNotices(nots);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load teacher class assignments');
      } finally {
        setLoading(false);
      }
    }
    loadTeacherClasses();
  }, [user]);

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
          date: selectedDate,
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
      } catch (err) {
        console.error(err);
        toast.error('Error loading class attendance sheet');
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [selectedClassId, selectedSectionId, selectedDate]);

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
        date: selectedDate,
        status: attendanceMap[st.id] || 'present',
        marked_by: user?.id || 'u-teacher-1',
      }));

      await submitAttendanceBatch(recordsToInsert);
      toast.success(`Attendance for ${students.length} students submitted successfully!`);

      // Refresh recent records
      const updatedAtt = await fetchAttendance({
        date: selectedDate,
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
      <PortalHeader title="Teacher Class Dashboard" />

      {/* Subnav Tabs */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs sticky top-[57px] z-30">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <div className="flex space-x-2 py-2">
            <button
              onClick={() => setActiveTab('take')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'take'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CheckSquare className="size-4" />
              Take Attendance
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'notices'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Megaphone className="size-4" />
              Staff Notices ({notices.length})
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
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
