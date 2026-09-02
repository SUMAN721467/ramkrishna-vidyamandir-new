import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProfiles, fetchStudents, store, addProfile, generateDefaultPassword } from '../lib/portal-db';
import type { Profile, Student, UserRole } from '../types/portal';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signUp: (email: string, pass: string, fullName: string, role: 'teacher' | 'parent') => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  signOut: () => Promise<void>;
  switchDemoUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session & user profile with persistent storage
  useEffect(() => {
    async function initSession() {
      try {
        let restored = false;

        // Check local stored persistent active session
        if (typeof window !== 'undefined') {
          const savedSession = localStorage.getItem('rkvm_demo_user');
          if (savedSession) {
            try {
              const p: Profile = JSON.parse(savedSession);
              if (p && p.id) {
                setUser({ id: p.id, email: p.email });
                setProfile(p);
                restored = true;

                // If Supabase is configured, refresh the latest profile from DB in background
                if (isSupabaseConfigured) {
                  loadProfile(p.id, p.email).catch((e) => {
                    console.warn('[Auth] Background profile refresh error:', e);
                  });
                }
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Error initializing session:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  async function loadProfile(userId: string, email: string) {
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'rkvmschool.in@gmail.com')
      .split(',')
      .map((e: string) => e.trim().toLowerCase());
    const isDesignatedAdmin = adminEmails.includes(email.toLowerCase());

    if (isDesignatedAdmin) {
      const adminProf: Profile = {
        id: userId || 'u-admin-rkvm',
        email: email || 'rkvmschool.in@gmail.com',
        full_name: 'RKVM School Administrator',
        role: 'admin',
      };
      setProfile(adminProf);
      localStorage.setItem('rkvm_demo_user', JSON.stringify(adminProf));
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          const finalRole = isDesignatedAdmin ? 'admin' : data.role;
          const fullProf = { ...data, role: finalRole };
          setProfile(fullProf);
          localStorage.setItem('rkvm_demo_user', JSON.stringify(fullProf));
          return;
        }

        // Check students table if not found in profiles
        const { data: stData, error: stError } = await supabase
          .from('students')
          .select('*')
          .eq('id', userId)
          .single();

        if (!stError && stData) {
          const studentProf: Profile = {
            id: stData.id,
            email: stData.email || email,
            full_name: `${stData.first_name} ${stData.last_name}`.trim(),
            phone: stData.phone,
            role: 'parent',
            avatar_url: stData.avatar_url,
            pending_avatar_url: stData.pending_avatar_url,
            pending_avatar_status: stData.pending_avatar_status,
          };
          setProfile(studentProf);
          localStorage.setItem('rkvm_demo_user', JSON.stringify(studentProf));
          return;
        }
      } catch (e) {
        console.warn('[Auth] Supabase loadProfile error:', e);
      }
    }

    // Fallback search profile by email or ID
    try {
      const [profiles, students] = await Promise.all([fetchProfiles(), fetchStudents()]);
      const foundProf = profiles.find((p) => p.id === userId || p.email.toLowerCase() === email.toLowerCase());
      if (foundProf) {
        const finalRole = isDesignatedAdmin ? 'admin' : foundProf.role;
        const fullProf = { ...foundProf, role: finalRole };
        setProfile(fullProf);
        localStorage.setItem('rkvm_demo_user', JSON.stringify(fullProf));
        return;
      }

      const foundStudent = students.find((s) => s.id === userId || (s.email && s.email.toLowerCase() === email.toLowerCase()));
      if (foundStudent) {
        const studentProf: Profile = {
          id: foundStudent.id,
          email: foundStudent.email || email,
          full_name: `${foundStudent.first_name} ${foundStudent.last_name}`.trim(),
          phone: foundStudent.phone,
          role: 'parent',
          avatar_url: foundStudent.avatar_url,
          pending_avatar_url: foundStudent.pending_avatar_url,
          pending_avatar_status: foundStudent.pending_avatar_status,
        };
        setProfile(studentProf);
        localStorage.setItem('rkvm_demo_user', JSON.stringify(studentProf));
        return;
      }
    } catch (fetchErr) {
      console.warn('[Auth] Fallback profile fetch error:', fetchErr);
    }

    const finalRole: UserRole = isDesignatedAdmin ? 'admin' : 'parent';
    const fallbackProf: Profile = {
      id: userId,
      email,
      full_name: email.split('@')[0],
      role: finalRole,
    };
    setProfile(fallbackProf);
    localStorage.setItem('rkvm_demo_user', JSON.stringify(fallbackProf));
  }

  const signIn = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const cleanInput = identifier.trim().toLowerCase();
      const cleanPhoneDigits = cleanInput.replace(/\D/g, '');

      // Helper to check phone match
      const isPhoneMatch = (storedPhone?: string) => {
        if (!storedPhone || !cleanPhoneDigits) return false;
        const storedDigits = storedPhone.replace(/\D/g, '');
        return (
          storedDigits.length >= 7 &&
          cleanPhoneDigits.length >= 7 &&
          (storedDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(storedDigits))
        );
      };

      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'rkvmschool.in@gmail.com')
        .split(',')
        .map((e: string) => e.trim().toLowerCase());
      const isDesignatedAdmin = adminEmails.includes(cleanInput) || cleanPhoneDigits === '9732640068';

      // Designated Admin Check
      if (isDesignatedAdmin) {
        if (pass !== 'Rkvm@12345') {
          setLoading(false);
          return { success: false, error: 'Invalid admin password.' };
        }
        const adminProf: Profile = {
          id: 'u-admin-rkvm',
          email: 'rkvmschool.in@gmail.com',
          full_name: 'RKVM School Administrator',
          role: 'admin',
        };
        setUser({ id: adminProf.id, email: adminProf.email });
        setProfile(adminProf);
        localStorage.setItem('rkvm_demo_user', JSON.stringify(adminProf));
        setLoading(false);
        return { success: true, role: 'admin' };
      }

      // Fetch latest profiles and students (from Supabase in production, or store in demo)
      const profiles = await fetchProfiles();
      const dbStudents = await fetchStudents();

      const candidateStudents = dbStudents.filter(
        (s) => (s.email && s.email.toLowerCase() === cleanInput) || isPhoneMatch(s.phone)
      );

      const matchedProfile = profiles.find(
        (p) => p.email.toLowerCase() === cleanInput || isPhoneMatch(p.phone)
      );

      // Teacher / Staff Profile Check
      if (matchedProfile) {
        const expectedPass = matchedProfile.portal_password;
        if (expectedPass && pass === expectedPass) {
          const role: UserRole = matchedProfile.role;
          setUser({ id: matchedProfile.id, email: matchedProfile.email });
          setProfile(matchedProfile);
          localStorage.setItem('rkvm_demo_user', JSON.stringify(matchedProfile));
          setLoading(false);
          return { success: true, role };
        }
      }

      // Student Account Check (Supports multiple students sharing the same phone number/email with unique passwords)
      if (candidateStudents.length > 0) {
        const matchedStudent = candidateStudents.find((s) => {
          const defaultStudentPass = generateDefaultPassword(s.first_name, s.date_of_birth);
          const expectedPass = s.portal_password || defaultStudentPass;
          return pass === expectedPass;
        });

        if (matchedStudent) {
          const studentProfile: Profile = {
            id: matchedStudent.id,
            email: matchedStudent.email || cleanInput,
            full_name: `${matchedStudent.first_name} ${matchedStudent.last_name}`.trim(),
            role: 'parent',
            phone: matchedStudent.phone,
            avatar_url: matchedStudent.avatar_url,
            pending_avatar_url: matchedStudent.pending_avatar_url,
            pending_avatar_status: matchedStudent.pending_avatar_status,
            portal_password: matchedStudent.portal_password,
          };

          setUser({ id: studentProfile.id, email: studentProfile.email });
          setProfile(studentProfile);
          localStorage.setItem('rkvm_demo_user', JSON.stringify(studentProfile));
          setLoading(false);
          return { success: true, role: 'parent' };
        }

        setLoading(false);
        if (candidateStudents.length > 1) {
          const names = candidateStudents.map((s) => s.first_name).join(', ');
          return {
            success: false,
            error: `Multiple student accounts are registered with this Mobile Number (${names}). Please enter the specific password for the student you wish to access.`,
          };
        }

        return {
          success: false,
          error: 'Invalid password for this student account. Please verify your password or contact School Admin.',
        };
      }

      // If matchedProfile was found but password was wrong
      if (matchedProfile) {
        setLoading(false);
        return { success: false, error: 'Invalid password. Please check your credentials or contact School Admin.' };
      }

      setLoading(false);
      return { success: false, error: 'Account not found. Please verify your Mobile Number or Email Address.' };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, requestedRole: 'teacher' | 'parent') => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const assignedRole: UserRole = cleanEmail === 'rkvmschool.in@gmail.com' ? 'admin' : requestedRole;

    try {
      const newProf = await addProfile({
        email: cleanEmail,
        full_name: fullName,
        role: assignedRole,
        portal_password: pass,
      });

      setUser({ id: newProf.id, email: newProf.email });
      setProfile(newProf);
      localStorage.setItem('rkvm_demo_user', JSON.stringify(newProf));
      setLoading(false);
      return { success: true, role: assignedRole };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Account registration failed.' };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('[Auth] Sign out error:', e);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('rkvm_demo_user');
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }
    setLoading(false);
  };

  const switchDemoUser = (role: UserRole) => {
    if (role === 'admin') {
      const adminProf: Profile = {
        id: 'u-admin-rkvm',
        email: 'rkvmschool.in@gmail.com',
        full_name: 'RKVM Administrator',
        role: 'admin',
      };
      setUser({ id: adminProf.id, email: adminProf.email });
      setProfile(adminProf);
      localStorage.setItem('rkvm_demo_user', JSON.stringify(adminProf));
      return;
    }

    const matchedProfile = store.profiles.find((p) => p.role === role);
    if (matchedProfile) {
      setUser({ id: matchedProfile.id, email: matchedProfile.email });
      setProfile(matchedProfile);
      localStorage.setItem('rkvm_demo_user', JSON.stringify(matchedProfile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        loading,
        signIn,
        signUp,
        signOut,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
