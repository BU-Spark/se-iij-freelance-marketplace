CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  -- A person can work both sides of the desk, so roles is a set, not a single value
  roles TEXT[] NOT NULL DEFAULT '{}',
  short_bio TEXT,
  long_bio TEXT,
  -- S3 object key for the profile photo; the bucket is private, so URLs are signed on read
  photo_key TEXT,
  -- Notification + display preferences collected during onboarding
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- The person's own "I'm free right now" flag, shown as the dot on their avatar
  available_now BOOLEAN NOT NULL DEFAULT FALSE,
  -- Set by the Story Match team when an account may no longer sign in
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_roles_allowed CHECK (roles <@ ARRAY['editor', 'freelancer']::TEXT[])
);

CREATE TABLE IF NOT EXISTS editors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  desks TEXT[] NOT NULL DEFAULT '{}',
  job_title TEXT NOT NULL,
  years_at_desk INTEGER NOT NULL DEFAULT 0 CHECK (years_at_desk >= 0),
  location TEXT,
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
  -- The free-text answer when reporting_beats contains "Other/Not listed here"
  beat_other TEXT,
  -- Craft, e.g. "Investigative Journalism" or "Data Visualization"
  skills TEXT[] NOT NULL DEFAULT '{}',
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

-- Columns added after the initial release; CREATE TABLE IF NOT EXISTS skips existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS long_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_now BOOLEAN NOT NULL DEFAULT FALSE;
-- Admins suspend accounts from the Accounts tab; the Clerk ban stops the sign-in, these record why
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE editors ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS beat_other TEXT;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';

-- users.role (single value) became users.roles (array) so one person can be both
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  -- Carry the old single role over, then retire the column
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'users'
       AND column_name = 'role'
  ) THEN
    UPDATE users
       SET roles = ARRAY[role]::TEXT[]
     WHERE roles = '{}'::TEXT[];

    ALTER TABLE users DROP COLUMN role;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_roles_allowed'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_roles_allowed CHECK (roles <@ ARRAY['editor', 'freelancer']::TEXT[]);
  END IF;
END $$;
