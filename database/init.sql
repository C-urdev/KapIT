CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'company')),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('developer', 'company')),
    is_premium BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,

    -- Shared profile fields
    bio TEXT,
    socials TEXT,
    profile_image TEXT,
    phone VARCHAR(40),
    address TEXT,

    -- Employee profile fields
    name VARCHAR(120),
    education VARCHAR(120),
    vocational_course VARCHAR(160),
    desired_job VARCHAR(120),
    birthday DATE,
    age INTEGER,
    sex VARCHAR(12),

    -- Company profile fields
    company_name VARCHAR(160),
    industry VARCHAR(160),
    company_size VARCHAR(40),
    website TEXT,
    hiring_for TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_account_type ON users(account_type);
CREATE INDEX idx_users_profile_completed ON users(profile_completed);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(120) NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('me', 'them')),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_user_contact_time
ON messages(user_id, contact_name, created_at);

-- Company & hiring tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    logo TEXT,
    description TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    salary VARCHAR(120),
    location VARCHAR(200),
    type VARCHAR(60),
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(40) NOT NULL DEFAULT 'open',
    closed_reason VARCHAR(80),
    pay_per_use_fee INTEGER NOT NULL DEFAULT 1599,
    pay_per_use_status VARCHAR(40) NOT NULL DEFAULT 'not_due',
    reopened_from_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    filled_application_id BIGINT,
    filled_candidate_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    posting_payment_status VARCHAR(40) NOT NULL DEFAULT 'paid',
    posting_payment_id UUID,
    posting_plan_id VARCHAR(40),
    posting_plan_duration VARCHAR(60),
    posting_plan_duration_days INTEGER,
    posting_plan_price INTEGER NOT NULL DEFAULT 1599,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active_until TIMESTAMP,
    closed_at TIMESTAMP,
    hired_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_post_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    provider VARCHAR(20) NOT NULL,
    payment_context VARCHAR(40) NOT NULL DEFAULT 'job_post',
    currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
    amount INTEGER NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    plan_id VARCHAR(40) NOT NULL,
    plan_label VARCHAR(80) NOT NULL,
    plan_duration VARCHAR(60) NOT NULL,
    plan_duration_days INTEGER NOT NULL,
    provider_checkout_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    payer_email VARCHAR(255),
    draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider_payload JSONB,
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(40) DEFAULT 'pending',
    resume_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Separate onboarding profile tables
CREATE TABLE IF NOT EXISTS developer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(160),
    username VARCHAR(50),
    location TEXT,
    phone_number VARCHAR(40),
    email VARCHAR(255),
    job_title VARCHAR(160),
    experience_years INTEGER,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_it_role VARCHAR(160),
    preferred_it_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
    education TEXT,
    bio TEXT,
    github_link TEXT,
    portfolio_link TEXT,
    linkedin_link TEXT,
    resume_url TEXT,
    profile_photo_url TEXT,
    other_links TEXT,
    work_preference VARCHAR(20),
    actively_looking BOOLEAN DEFAULT false,
    role_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    job_priorities TEXT[] DEFAULT ARRAY[]::TEXT[],
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    job_search_goal VARCHAR(80),
    experience_level VARCHAR(40),
    certifications TEXT,
    school_university TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(160),
    industry VARCHAR(160),
    company_size VARCHAR(40),
    website TEXT,
    description TEXT,
    location TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    project_id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget VARCHAR(120),
    timeline VARCHAR(120),
    status VARCHAR(40) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id_created ON jobs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status_created ON jobs(posting_payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_post_payments_company_created ON job_post_payments(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_post_payments_status_created ON job_post_payments(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_post_payments_provider_checkout
ON job_post_payments(provider, provider_checkout_id)
WHERE provider_checkout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_apps_job_id_created ON applications(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_user_id_created ON applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_profiles_experience ON developer_profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_dev_profiles_location ON developer_profiles(location);
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_projects_company_id_created ON projects(company_id, created_at DESC);
