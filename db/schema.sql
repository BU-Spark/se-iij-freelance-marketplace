CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  roles TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  short_bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  desks TEXT[] NOT NULL DEFAULT '{}',
  job_title TEXT NOT NULL,
  years_at_desk INTEGER NOT NULL DEFAULT 0 CHECK (years_at_desk >= 0),
  pitch_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  availability JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS freelancers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  location TEXT,
  rate TEXT,
  community_covered TEXT,
  reporting_beats TEXT[] NOT NULL DEFAULT '{}',
  beat_tags TEXT[] NOT NULL DEFAULT '{}',
  work_mediums TEXT[] NOT NULL DEFAULT '{}',
  tools TEXT[] NOT NULL DEFAULT '{}',
  portfolio JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
