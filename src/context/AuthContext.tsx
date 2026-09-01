import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProfiles, store, addProfile } from '../lib/portal-db';
import type { Profile, UserRole } from '../types/portal';

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

  // Initialize session & user profile
  useEffect(() => {
    async function initSession() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser({ id: data.session.user.id, email: data.session.user.email || '' });
            await loadProfile(data.session.user.id, data.session.user.email || '');
          } else {
            setUser(null);
            setProfile(null);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser({ id: session.user.id, email: session.user.email || '' });
              await loadProfile(session.user.id, session.user.email || '');
            } else {
              setUser(null);
              setProfile(null);
            }
          });

          return () => {
            listener.subscription.unsubscribe();
          };
        } else {
          // Check local stored demo user
          const savedDemoUser = localStorage.getItem('rkvm_demo_user');
          if (savedDemoUser) {
            try {
              const p: Profile = JSON.parse(savedDemoUser);
              setUser({ id: p.id, email: p.email });
              setProfile(p);
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  async function loadProfile(userId: string, email: string) {
    const isDesignatedAdmin = email.toLowerCase() === 'rkvmschool.in@gmail.com';

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        // Enforce Admin role for rkvmschool.in@gmail.com
        const finalRole = isDesignatedAdmin ? 'admin' : data.role;
        setProfile({ ...data, role: finalRole });
        return;
      }
    }

    // Fallback search profile by email or ID in store
    const profiles = await fetchProfiles();
    const found = profiles.find((p) => p.id === userId || p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      const finalRole = isDesignatedAdmin ? 'admin' : found.role;
      setProfile({ ...found, role: finalRole });
    } else {
      const finalRole: UserRole = isDesignatedAdmin ? 'admin' : 'parent';
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: finalRole,
      });
    }
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

      const isDesignatedAdmin = cleanInput === 'rkvmschool.in@gmail.com' || cleanPhoneDigits === '9732640068';

      // Supabase authentication if configured
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanInput,
          password: pass,
        });

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          const profiles = await fetchProfiles();
          const prof = profiles.find((p) => p.id === data.user.id || p.email.toLowerCase() === cleanInput);
          const role: UserRole = isDesignatedAdmin ? 'admin' : prof?.role || 'parent';
          if (prof) setProfile({ ...prof, role });
          else setProfile({ id: data.user.id, email: cleanInput, full_name: cleanInput.split('@')[0], role });
          setLoading(false);
          return { success: true, role };
        }
      }

      // Local / Demo Store Authentication logic
      const profiles = await fetchProfiles();
      const matchedProfile = profiles.find(
        (p) => p.email.toLowerCase() === cleanInput || isPhoneMatch(p.phone)
      );

      const matchedStudent = store.students.find(
        (s) =>
          s.email?.toLowerCase() === cleanInput ||
          s.id.toLowerCase() === cleanInput ||
          s.roll_number === cleanInput
      );

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

      // Teacher / Staff Profile Check
      if (matchedProfile) {
        const expectedPass = matchedProfile.portal_password;
        if (expectedPass && pass !== expectedPass) {
          setLoading(false);
          return { success: false, error: 'Invalid password. Please check your password or contact School Admin.' };
        }

        const role: UserRole = matchedProfile.role;
        setUser({ id: matchedProfile.id, email: matchedProfile.email });
        setProfile(matchedProfile);
        localStorage.setItem('rkvm_demo_user', JSON.stringify(matchedProfile));
        setLoading(false);
        return { success: true, role };
      }

      // Student Account Check
      if (matchedStudent) {
        const expectedPass = matchedStudent.portal_password;
        if (expectedPass && pass !== expectedPass) {
          setLoading(false);
          return { success: false, error: 'Invalid password for student account. Please contact School Admin.' };
        }

        const studentProfile: Profile = {
          id: matchedStudent.id,
          email: matchedStudent.email || cleanInput,
          full_name: `${matchedStudent.first_name} ${matchedStudent.last_name}`,
          role: 'parent',
        };

        setUser({ id: studentProfile.id, email: studentProfile.email });
        setProfile(studentProfile);
        localStorage.setItem('rkvm_demo_user', JSON.stringify(studentProfile));
        setLoading(false);
        return { success: true, role: 'parent' };
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
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: fullName,
              role: assignedRole,
            },
          },
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, email: cleanEmail });
          const newProf: Profile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName,
            role: assignedRole,
          };
          setProfile(newProf);
          setLoading(false);
          return { success: true, role: assignedRole };
        }
      }

      // Local / Fallback Sign Up
      const newProf = await addProfile({
        email: cleanEmail,
        full_name: fullName,
        role: assignedRole,
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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('rkvm_demo_user');
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
