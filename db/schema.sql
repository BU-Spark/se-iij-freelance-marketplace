CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'freelancer')),
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

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- TEXT until an organizations table exists, matching editors.organization_id
  organization_id TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  length TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ,
  compensation TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'invited', 'assigned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One slug per organization; COALESCE so organization-less posts also stay unique
CREATE UNIQUE INDEX IF NOT EXISTS assignments_org_slug_key ON assignments (COALESCE(organization_id, ''), slug);
CREATE INDEX IF NOT EXISTS assignments_created_by_idx ON assignments (created_by_user_id);
CREATE INDEX IF NOT EXISTS assignments_status_deadline_idx ON assignments (status, deadline);
