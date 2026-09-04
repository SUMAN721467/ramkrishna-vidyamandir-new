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

-- Ensure alt_phone, aadhar_number, and teacher profile columns exist if tables were already created
DO $$ BEGIN
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS alt_phone TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS aadhar_number TEXT;
    ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pending_avatar_requested_at TIMESTAMPTZ;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualification TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialized_subject TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhar_number TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_status TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_avatar_requested_at TIMESTAMPTZ;
EXCEPTION WHEN others THEN null;
END $$;

-- 6. Teachers Table (Without class)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    qualification TEXT,
    specialized_subject TEXT,
    address TEXT,
    aadhar_number TEXT,
    avatar_url TEXT,
    portal_password TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    is_late BOOLEAN NOT NULL DEFAULT false,
    timetable_id TEXT,
    marked_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Ensure is_late and timetable_id columns exist if table was already created
DO $$ BEGIN
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS timetable_id TEXT;
EXCEPTION WHEN others THEN null;
END $$;

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
    ('c0', 'Play'),
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
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
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
    DROP POLICY IF EXISTS "Public access to teachers" ON public.teachers;
    CREATE POLICY "Public access to teachers" ON public.teachers FOR ALL USING (true);
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
    start_time TEXT DEFAULT '10:30 AM',
    end_time TEXT DEFAULT '11:15 AM',
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

-- Safe migration for start_time & end_time defaults if table already exists
DO $$ BEGIN
    ALTER TABLE public.class_timetables ALTER COLUMN start_time DROP NOT NULL;
    ALTER TABLE public.class_timetables ALTER COLUMN end_time DROP NOT NULL;
    ALTER TABLE public.class_timetables ALTER COLUMN start_time SET DEFAULT '10:30 AM';
    ALTER TABLE public.class_timetables ALTER COLUMN end_time SET DEFAULT '11:15 AM';
EXCEPTION WHEN others THEN null; END $$;

-- 13. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT,
    class_id TEXT DEFAULT 'all',
    category TEXT DEFAULT 'Core Academic',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to subjects" ON public.subjects;
    CREATE POLICY "Public access to subjects" ON public.subjects FOR ALL USING (true);
EXCEPTION WHEN others THEN null; END $$;

-- SEED CURRICULUM SUBJECTS (Academic & Co-curricular)
INSERT INTO public.subjects (id, name, code, class_id, category, description) VALUES
    ('sub-1', 'Bengali (বাংলা)', 'BEN', 'all', 'Academic', 'Bengali language, literature, reading, and grammar.'),
    ('sub-2', 'English (ইংরেজি)', 'ENG', 'all', 'Academic', 'English grammar, vocabulary, reading comprehension, and writing.'),
    ('sub-3', 'Mathematics (গণিত)', 'MATH', 'all', 'Academic', 'Arithmetic, numerical logic, geometry, and mental math.'),
    ('sub-4', 'Environmental Studies / EVS (পরিবেশ শিক্ষা)', 'EVS', 'all', 'Academic', 'Environmental awareness, social living, and hygiene.'),
    ('sub-5', 'Science (বিজ্ঞান)', 'SCI', 'all', 'Academic', 'General science, nature observation, physical and life sciences.'),
    ('sub-6', 'General Knowledge / G.K. (সাধারণ জ্ঞান)', 'GK', 'all', 'Academic', 'General awareness, current events, heritage, and quiz.'),
    ('sub-7', 'History (ইতিহাস)', 'HIST', 'all', 'Academic', 'Indian and world history, civilisation, and cultural heritage.'),
    ('sub-8', 'Geography (ভূগোল)', 'GEO', 'all', 'Academic', 'Physical geography, environment, and world geography.'),
    ('sub-9', 'Computer', 'COMP', 'all', 'Academic', 'Computer fundamentals, practical usage, and typing skills.'),
    ('sub-10', 'Sanskrit (সংস্কৃত)', 'SANS', 'all', 'Academic', 'Classical Sanskrit language, grammar, shlokas, and pronunciation.'),
    ('sub-11', 'Drawing', 'DRAW', 'all', 'Co-curricular / Activity', 'Freehand sketching, colouring, crafts, and visual art.'),
    ('sub-12', 'Physical Training / P.T.', 'PT', 'all', 'Co-curricular / Activity', 'Drill, physical exercise, athletics, yoga, and games.'),
    ('sub-13', 'Music / Song', 'MUSIC', 'all', 'Co-curricular / Activity', 'Devotional songs, Rabindra Sangeet, prayer hymns, and choir.'),
    ('sub-14', 'Rhymes', 'RHY', 'all', 'Co-curricular / Activity', 'Rhythmic recitation, phonics, and expressive action rhymes.'),
    ('sub-15', 'Spoken English', 'SPOKEN', 'all', 'Co-curricular / Activity', 'Conversational fluency, phonetics, dialogue practice, and speech.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    class_id = EXCLUDED.class_id,
    category = EXCLUDED.category,
    description = EXCLUDED.description;

-- STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
    CREATE POLICY "Public avatar access" ON storage.objects FOR ALL USING (bucket_id = 'avatars');
EXCEPTION WHEN others THEN null; END $$;

-- ==========================================
-- AUTO-SYNC: TEACHERS <-> PROFILES
-- ==========================================

-- When teacher is added/updated in teachers table, sync to profiles table for portal auth
CREATE OR REPLACE FUNCTION public.sync_teacher_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite trigger loop with sync_profile_to_teacher
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.profiles (
        id, full_name, email, phone, role, qualification,
        specialized_subject, address, aadhar_number, avatar_url, portal_password, created_at, updated_at
    )
    VALUES (
        NEW.id,
        NEW.full_name,
        COALESCE(NEW.email, 'NA'),
        NEW.phone,
        'teacher',
        NEW.qualification,
        NEW.specialized_subject,
        NEW.address,
        NEW.aadhar_number,
        NEW.avatar_url,
        NEW.portal_password,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.profiles.email END,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = 'teacher',
        qualification = COALESCE(EXCLUDED.qualification, public.profiles.qualification),
        specialized_subject = COALESCE(EXCLUDED.specialized_subject, public.profiles.specialized_subject),
        address = COALESCE(EXCLUDED.address, public.profiles.address),
        aadhar_number = COALESCE(EXCLUDED.aadhar_number, public.profiles.aadhar_number),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        portal_password = COALESCE(EXCLUDED.portal_password, public.profiles.portal_password),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_teacher_to_profile ON public.teachers;
CREATE TRIGGER trg_sync_teacher_to_profile
AFTER INSERT OR UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.sync_teacher_to_profile();

-- When teacher is deleted from teachers table, remove from profiles table
CREATE OR REPLACE FUNCTION public.sync_delete_teacher_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = OLD.id AND role = 'teacher';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_delete_teacher_from_profile ON public.teachers;
CREATE TRIGGER trg_sync_delete_teacher_from_profile
AFTER DELETE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.sync_delete_teacher_from_profile();

-- When teacher is added/updated in profiles table, sync to teachers table
CREATE OR REPLACE FUNCTION public.sync_profile_to_teacher()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent infinite trigger loop with sync_teacher_to_profile
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.role = 'teacher' THEN
        INSERT INTO public.teachers (
            id, full_name, email, phone, qualification,
            specialized_subject, address, aadhar_number, avatar_url, portal_password, status, created_at, updated_at
        )
        VALUES (
            NEW.id,
            NEW.full_name,
            NEW.email,
            NEW.phone,
            NEW.qualification,
            NEW.specialized_subject,
            NEW.address,
            NEW.aadhar_number,
            NEW.avatar_url,
            NEW.portal_password,
            'active',
            COALESCE(NEW.created_at, NOW()),
            COALESCE(NEW.updated_at, NOW())
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            qualification = EXCLUDED.qualification,
            specialized_subject = EXCLUDED.specialized_subject,
            address = EXCLUDED.address,
            aadhar_number = EXCLUDED.aadhar_number,
            avatar_url = EXCLUDED.avatar_url,
            portal_password = EXCLUDED.portal_password,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_profile_to_teacher ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_teacher
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_teacher();


