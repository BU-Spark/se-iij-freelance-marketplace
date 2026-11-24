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
  -- When that flag stops counting on its own; NULL means it has no timer
  available_until TIMESTAMPTZ,
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
  beats TEXT[] NOT NULL DEFAULT '{}',
  -- The free-text answer when beats contains "Other/Not listed here"
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
  -- The freelancer who took it on; set when an editor assigns someone, cleared if that account goes
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One slug per organization; COALESCE so organization-less posts also stay unique
CREATE UNIQUE INDEX IF NOT EXISTS assignments_org_slug_key ON assignments (COALESCE(organization_id, ''), slug);
CREATE INDEX IF NOT EXISTS assignments_created_by_idx ON assignments (created_by_user_id);

-- In-place migration for databases created before assignments remembered who took them
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS assignments_status_deadline_idx ON assignments (status, deadline);

-- Columns added after the initial release; CREATE TABLE IF NOT EXISTS skips existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS long_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_now BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ;
-- Admins suspend accounts from the Accounts tab; the Clerk ban stops the sign-in, these record why
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE editors ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS beat_other TEXT;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';

-- freelancers.reporting_beats became beats, so the column reads like the BEATS list the app collects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'freelancers'
       AND column_name = 'reporting_beats'
  ) AND NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'freelancers'
       AND column_name = 'beats'
  ) THEN
    ALTER TABLE freelancers RENAME COLUMN reporting_beats TO beats;
  END IF;
END $$;

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

-- The beats onboarding offers. The Story Match team adds and removes them from the Beats tab, so
-- the list is data rather than a constant. Removing a beat only stops it being offered: people who
-- already picked it keep the name in their profile.
CREATE TABLE IF NOT EXISTS beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Where the beat sits in the picker; new beats are appended
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Names are unique regardless of case, so "Local" and "local" cannot both be offered
CREATE UNIQUE INDEX IF NOT EXISTS beats_name_key ON beats (LOWER(name));

-- Seed the original list once, on the first migration that creates the table. Guarding on an empty
-- table means a beat the team removes is not brought back by a later migration run.
INSERT INTO beats (name, sort_order)
SELECT seeded.name, seeded.sort_order
  FROM (VALUES
    ('Politics', 0),
    ('Government Accountability', 1),
    ('Law/Legal Issues', 2),
    ('Foreign Policy', 3),
    ('National Security', 4),
    ('Military', 5),
    ('Policy', 6),
    ('Finance/Economics', 7),
    ('Tech', 8),
    ('Business', 9),
    ('Personal Finance', 10),
    ('Real Estate', 11),
    ('Careers', 12),
    ('Labor/Workers Rights', 13),
    ('Culture', 14),
    ('Internet Culture', 15),
    ('Media/Power', 16),
    ('Entertainment/Hollywood', 17),
    ('Music', 18),
    ('Film/Movies', 19),
    ('Books/Writing', 20),
    ('Art', 21),
    ('History', 22),
    ('Comedy', 23),
    ('Design', 24),
    ('Photography', 25),
    ('Games/Gaming', 26),
    ('Architecture', 27),
    ('Museums', 28),
    ('Climate/Environment', 29),
    ('Health/Wellness', 30),
    ('Science', 31),
    ('Energy', 32),
    ('Mental Health', 33),
    ('Cancer', 34),
    ('Weather', 35),
    ('Food', 36),
    ('Travel', 37),
    ('Lifestyle', 38),
    ('Fashion', 39),
    ('Fitness', 40),
    ('Parenting', 41),
    ('Home', 42),
    ('Restaurants and bars', 43),
    ('Recipes', 44),
    ('Sports', 45),
    ('Outdoors', 46),
    ('Dating/Romance', 47),
    ('Things to do', 48),
    ('Self-Help', 49),
    ('Beauty', 50),
    ('Local', 51),
    ('Education', 52),
    ('Housing', 53),
    ('Urban Planning', 54),
    ('Transportation', 55),
    ('Crime', 56),
    ('Construction', 57),
    ('Agriculture', 58),
    ('LGBTQIA', 59),
    ('Identity/Belonging', 60),
    ('Gender', 61),
    ('Immigration', 62),
    ('Human Rights', 63),
    ('Criminal Justice', 64),
    ('Faith/Religion', 65),
    ('Activism', 66),
    ('Inequality', 67),
    ('General News', 68)
  ) AS seeded(name, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM beats);

-- A suspended person can ask the team to look again. The form is public because a ban blocks sign-in,
-- so the account is matched by email rather than by whoever is calling.
CREATE TABLE IF NOT EXISTS account_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Kept even if the account is later deleted, so the team can still read what was sent
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_appeals_status_created_idx ON account_appeals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS account_appeals_user_idx ON account_appeals (user_id);

-- A flag is a report someone raised about an account, an assignment, or a pitch. The three targets
-- live in different tables, so the row keeps (type, id) instead of a foreign key; the label is copied
-- at report time, which keeps the queue readable if the target is later edited or deleted.
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('account', 'assignment', 'pitch')),
  target_id UUID NOT NULL,
  target_label TEXT NOT NULL,
  reason TEXT NOT NULL,
  -- Kept even if the reporter's account goes, so the team can still read what was sent
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_flags_status_created_idx ON content_flags (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_flags_target_idx ON content_flags (target_type, target_id);
-- The repeat-report check looks up one person's active flags on the same target
CREATE INDEX IF NOT EXISTS content_flags_reporter_target_idx
  ON content_flags (reporter_user_id, target_type, target_id, status);

-- An editor's roster: the freelancers they have saved to work with them. The row *is* the favorite,
-- so saving again is a no-op and removing someone deletes it. A favorite is on the roster straight
-- away; `status` only records the freelancer's answer to an optional notification, so it never
-- gates pitches or assignments. Asking again after a decline re-opens the same row.
CREATE TABLE IF NOT EXISTS roster_invites (
  editor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMPTZ,
  PRIMARY KEY (editor_user_id, freelancer_user_id),
  CONSTRAINT roster_invites_not_self CHECK (editor_user_id <> freelancer_user_id)
);

CREATE INDEX IF NOT EXISTS roster_invites_freelancer_idx ON roster_invites (freelancer_user_id);

-- Columns added after roster_invites shipped: the invite used to count as accepted on creation
ALTER TABLE roster_invites ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE roster_invites ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
-- Whether the freelancer was told they were saved. A silent favorite stays private; a notified one
-- can be answered, but either way the row itself is the roster membership. Existing rows predate
-- the favorites model, so they were notifications and default to true.
ALTER TABLE roster_invites ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roster_invites_status_allowed'
  ) THEN
    ALTER TABLE roster_invites
      ADD CONSTRAINT roster_invites_status_allowed CHECK (status IN ('pending', 'accepted', 'declined'));
  END IF;
END $$;

-- A freelancer's story idea, sent to one editor. The composer asks for the editor's email, so a
-- pitch points at a person rather than an organization. The editor's feedback is stored on the
-- pitch itself, because the freelancer reads the same row from their own workspace.
CREATE TABLE IF NOT EXISTS pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- The editor whose inbox the pitch lands in; chosen by email in the composer
  target_editor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  -- Extra labels the inbox shows as grey tags, e.g. {"City Hall", "Investigative feature"}
  tags TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  length TEXT NOT NULL DEFAULT '',
  -- Free text, because freelancers write "two weeks after greenlight", not always a date
  deadline TEXT NOT NULL DEFAULT '',
  compensation TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'negotiating', 'accepted', 'declined')),
  -- { decision, comments, strengths, improvements }; set when the editor shares a decision
  feedback JSONB,
  feedback_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One slug per freelancer per editor, so re-sending the same idea is a conflict, not a duplicate
CREATE UNIQUE INDEX IF NOT EXISTS pitches_freelancer_editor_slug_key
  ON pitches (freelancer_user_id, target_editor_user_id, slug);
-- The editor's inbox reads newest first; "My pitches" reads one freelancer's own list
CREATE INDEX IF NOT EXISTS pitches_target_editor_idx ON pitches (target_editor_user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS pitches_freelancer_idx ON pitches (freelancer_user_id, submitted_at DESC);
