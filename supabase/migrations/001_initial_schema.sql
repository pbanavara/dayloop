-- DayLoop Initial Schema

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id       UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email    TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks table
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  plan_date    DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planned'
               CHECK (status IN ('planned','done','skipped')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX tasks_user_plan_date ON tasks(user_id, plan_date);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Action tokens table (for one-click email buttons)
CREATE TABLE action_tokens (
  token      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action     TEXT NOT NULL CHECK (action IN ('complete','skip','carry_forward')),
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

-- No RLS on action_tokens — accessed via service role only
-- But disable RLS so service role always bypasses anyway
ALTER TABLE action_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; anon/auth roles cannot access tokens
-- (no policies means no access for non-service roles)

-- Postgres function for timezone-aware cron queries
CREATE OR REPLACE FUNCTION get_users_for_timeslot(p_hour INT, p_minute INT)
RETURNS TABLE(id UUID, email TEXT, timezone TEXT)
LANGUAGE sql STABLE AS $$
  SELECT id, email, timezone FROM profiles
  WHERE EXTRACT(HOUR   FROM now() AT TIME ZONE timezone)::int = p_hour
    AND EXTRACT(MINUTE FROM now() AT TIME ZONE timezone)::int >= p_minute
    AND EXTRACT(MINUTE FROM now() AT TIME ZONE timezone)::int < p_minute + 60;
$$;
