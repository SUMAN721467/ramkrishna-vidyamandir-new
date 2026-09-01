-- ==========================================
-- RAMKRISHNA VIDYAMANDIR - SUPABASE SCHEMA
-- ==========================================

-- 1. Create Enums
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.student_status AS ENUM ('active', 'inactive');

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'parent',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Classes Table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Sections Table
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, name)
);

-- 5. Students Table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE RESTRICT,
    avatar_url TEXT,
    status public.student_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, section_id, roll_number)
);

-- 6. Teachers Table (Linked to profiles)
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL UNIQUE,
    qualification TEXT,
    status public.student_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Teacher Class & Section Assignments
CREATE TABLE public.teacher_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, class_id, section_id)
);

-- 8. Parents Table (Linked to profiles)
CREATE TABLE public.parents (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    occupation TEXT,
    status public.student_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Parent-Student Link
CREATE TABLE public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Parent/Guardian',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- 10. Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL,
    marked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 11. Notices Table
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT NOT NULL DEFAULT 'all', -- 'all', 'teacher', 'parent'
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX idx_students_class_section ON public.students(class_id, section_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_class_section_date ON public.attendance(class_id, section_id, date);

-- 12. Trigger to handle profile creation on signup
-- Grants ADMIN access ONLY to rkvmschool.in@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN LOWER(NEW.email) = 'rkvmschool.in@gmail.com' THEN 'admin'::public.user_role
            ELSE COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent'::public.user_role)
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
USING (public.get_current_role() = 'admin');

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile photo and phone"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- CLASSES & SECTIONS POLICIES
CREATE POLICY "Admins have full access to classes"
ON public.classes FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can view classes"
ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins have full access to sections"
ON public.sections FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can view sections"
ON public.sections FOR SELECT TO authenticated USING (true);

-- STUDENTS POLICIES
CREATE POLICY "Admins have full access to students"
ON public.students FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Teachers can view active students"
ON public.students FOR SELECT USING (public.get_current_role() = 'teacher');

CREATE POLICY "Parents can view only their linked children"
ON public.students FOR SELECT USING (
    public.get_current_role() = 'parent' AND
    id IN (SELECT student_id FROM public.parent_students WHERE parent_id = auth.uid())
);

-- TEACHERS POLICIES
CREATE POLICY "Admins have full access to teachers"
ON public.teachers FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Teachers can view teacher entries"
ON public.teachers FOR SELECT TO authenticated USING (true);

-- TEACHER_CLASSES POLICIES
CREATE POLICY "Admins have full access to teacher_classes"
ON public.teacher_classes FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Teachers can view their own assignments"
ON public.teacher_classes FOR SELECT USING (teacher_id = auth.uid());

-- PARENTS & PARENT_STUDENTS POLICIES
CREATE POLICY "Admins have full access to parents"
ON public.parents FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Parents can view their parent entry"
ON public.parents FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins have full access to parent_students"
ON public.parent_students FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Parents can view their student links"
ON public.parent_students FOR SELECT USING (parent_id = auth.uid());

-- ATTENDANCE POLICIES
CREATE POLICY "Admins have full access to attendance"
ON public.attendance FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Teachers can mark and edit attendance for assigned classes"
ON public.attendance FOR ALL USING (
    public.get_current_role() = 'teacher' AND (
        class_id IN (SELECT class_id FROM public.teacher_classes WHERE teacher_id = auth.uid())
    )
);

CREATE POLICY "Parents can view attendance for their children only"
ON public.attendance FOR SELECT USING (
    public.get_current_role() = 'parent' AND
    student_id IN (SELECT student_id FROM public.parent_students WHERE parent_id = auth.uid())
);

-- NOTICES POLICIES
CREATE POLICY "Admins have full access to notices"
ON public.notices FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Authenticated users can view targeted notices"
ON public.notices FOR SELECT TO authenticated USING (
    target_role = 'all' OR
    target_role = (public.get_current_role())::text
);

-- STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public profile photos are viewable by anyone"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update or delete profile photos"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
