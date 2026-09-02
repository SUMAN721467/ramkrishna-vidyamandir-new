-- ==========================================
-- RAMKRISHNA VIDYAMANDIR - SUPABASE SCHEMA
-- ==========================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'parent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.student_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'parent',
    phone TEXT,
    avatar_url TEXT,
    portal_password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Sections Table
CREATE TABLE IF NOT EXISTS public.sections (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    roll_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    alt_phone TEXT,
    email TEXT,
    date_of_birth DATE,
    gender TEXT,
    class_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    father_name TEXT,
    father_occupation TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    address TEXT,
    portal_password TEXT,
    avatar_url TEXT,
    pending_avatar_url TEXT,
    pending_avatar_status TEXT,
    pending_avatar_requested_at TIMESTAMPTZ,
    status public.student_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure alt_phone and pending_avatar columns exist if table was already created
DO $$ BEGIN
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS alt_phone TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pending_avatar_requested_at TIMESTAMPTZ;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_status TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_requested_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN null;
END $$;

-- 6. Teacher Classes Table
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Parent Student Links Table
CREATE TABLE IF NOT EXISTS public.parent_students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'Parent/Guardian',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL,
    marked_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 9. Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT NOT NULL DEFAULT 'all',
    created_by TEXT,
    author_name TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SEED INITIAL CLASSES & SECTIONS
-- ==========================================
INSERT INTO public.classes (id, name) VALUES
    ('c1', 'LKG'),
    ('c2', 'UKG'),
    ('c3', 'Class 1'),
    ('c4', 'Class 2'),
    ('c5', 'Class 3'),
    ('c6', 'Class 4'),
    ('c7', 'Class 5'),
    ('c8', 'Class 6'),
    ('c9', 'Class 7'),
    ('c10', 'Class 8'),
    ('c11', 'Class 9'),
    ('c12', 'Class 10')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.sections (id, class_id, name) VALUES
    ('s-a', 'all', 'Section A'),
    ('s-b', 'all', 'Section B')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- SEED ADMIN PROFILE
INSERT INTO public.profiles (id, email, full_name, role, phone, portal_password) VALUES
    ('u-admin-1', 'rkvmschool.in@gmail.com', 'RKVM School Administrator', 'admin', '+91 97326 40068', 'Rkvm@12345')
ON CONFLICT (id) DO UPDATE SET portal_password = EXCLUDED.portal_password;

-- SEED NOTICE
INSERT INTO public.notices (id, title, content, target_role, author_name, is_pinned) VALUES
    ('n-1', 'Welcome to RKVM Management Portal', 'The school management and attendance portal is now live. School administrators can add teachers and enroll students.', 'all', 'Headmaster', true)
ON CONFLICT (id) DO NOTHING;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE RLS POLICIES FOR PORTAL OPERATIONS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to profiles" ON public.profiles;
    CREATE POLICY "Public access to profiles" ON public.profiles FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to classes" ON public.classes;
    CREATE POLICY "Public access to classes" ON public.classes FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to sections" ON public.sections;
    CREATE POLICY "Public access to sections" ON public.sections FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to students" ON public.students;
    CREATE POLICY "Public access to students" ON public.students FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to teacher_classes" ON public.teacher_classes;
    CREATE POLICY "Public access to teacher_classes" ON public.teacher_classes FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to parent_students" ON public.parent_students;
    CREATE POLICY "Public access to parent_students" ON public.parent_students FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to attendance" ON public.attendance;
    CREATE POLICY "Public access to attendance" ON public.attendance FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to notices" ON public.notices;
    CREATE POLICY "Public access to notices" ON public.notices FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

-- 10. Student Marks Table
CREATE TABLE IF NOT EXISTS public.student_marks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    full_marks NUMERIC NOT NULL DEFAULT 100,
    marks_obtained NUMERIC NOT NULL DEFAULT 0,
    grade TEXT,
    remarks TEXT,
    teacher_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to student_marks" ON public.student_marks;
    CREATE POLICY "Public access to student_marks" ON public.student_marks FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

-- 11. Scheduled Exams Table
CREATE TABLE IF NOT EXISTS public.scheduled_exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    full_marks NUMERIC NOT NULL DEFAULT 100,
    room_number TEXT,
    instructions TEXT,
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scheduled_exams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to scheduled_exams" ON public.scheduled_exams;
    CREATE POLICY "Public access to scheduled_exams" ON public.scheduled_exams FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

-- 12. Class Timetables & Daily Routine Table
CREATE TABLE IF NOT EXISTS public.class_timetables (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    class_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    period_number INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    time_slot TEXT,
    subject TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    teacher_id TEXT,
    room_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.class_timetables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to class_timetables" ON public.class_timetables;
    CREATE POLICY "Public access to class_timetables" ON public.class_timetables FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

-- STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
    CREATE POLICY "Public avatar access" ON storage.objects FOR ALL USING (bucket_id = 'avatars');
EXCEPTION WHEN others THEN null; END $$;
