CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    level INT NOT NULL DEFAULT 2,
    semester INT NOT NULL DEFAULT 1,
    code VARCHAR(20) UNIQUE NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    track VARCHAR(20) CHECK (track IN ('theoretical', 'practical')) NOT NULL,
    lab_environment VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    lecture_number INT NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('draft', 'published')) DEFAULT 'published',
    original_file_url TEXT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    summary_ar TEXT,
    objectives JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    original_content JSONB NOT NULL,
    ai_simplified_content JSONB NOT NULL,
    external_additions JSONB DEFAULT '[]',
    terminology JSONB DEFAULT '[]',
    practical_lab JSONB DEFAULT NULL,
    simulation_config JSONB DEFAULT NULL,
    quiz JSONB DEFAULT '[]',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    quiz_score INT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lecture_id)
);

INSERT INTO courses (code, title_ar, title_en, track, lab_environment) VALUES
('AI201', 'الذكاء الاصطناعي (نظري)', 'Artificial Intelligence', 'theoretical', NULL),
('AI201L', 'الذكاء الاصطناعي (عملي)', 'AI Lab', 'practical', 'Python'),
('DB202', 'قواعد البيانات (نظري)', 'Database Systems', 'theoretical', NULL),
('DB202L', 'قواعد البيانات (عملي)', 'Database Lab', 'practical', 'Oracle SQL Developer'),
('OS203', 'نظم التشغيل (نظري)', 'Operating Systems', 'theoretical', NULL),
('OS203L', 'نظم التشغيل (عملي)', 'OS Lab', 'practical', 'Linux'),
('WEB204', 'تطوير الويب (نظري)', 'Web Development', 'theoretical', NULL),
('WEB204L', 'تطوير الويب (عملي)', 'Web Lab', 'practical', 'PHP'),
('NET205', 'التوجيه والتبديل (نظري)', 'Routing & Switching', 'theoretical', NULL),
('NET205L', 'التوجيه والتبديل (عملي)', 'Networking Lab', 'practical', 'Cisco Packet Tracer'),
('DS206', 'هياكل البيانات (نظري)', 'Data Structures', 'theoretical', NULL),
('DS206L', 'هياكل البيانات (عملي)', 'Data Structures Lab', 'practical', 'C++')
ON CONFLICT (code) DO NOTHING;
