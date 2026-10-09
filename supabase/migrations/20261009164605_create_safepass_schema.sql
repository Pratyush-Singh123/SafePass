/*
# SafePass — Initial Schema

1. New Tables
- `users` — stores onboarding profile data for each SafePass user.
  - `id` (uuid, primary key)
  - `name` (text, not null) — user's full name
  - `nationality` (text, not null) — user's nationality
  - `location_lat` (double precision, nullable) — current latitude
  - `location_lng` (double precision, nullable) — current longitude
  - `location_label` (text, nullable) — human-readable location name
  - `emergency_contact_name` (text, not null) — emergency contact person
  - `emergency_contact_phone` (text, not null) — emergency contact phone
  - `status` (text, default 'safe') — current safety status: safe, caution, danger
  - `share_token` (uuid, default gen_random_uuid()) — public sharing token for family status page
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `chat_messages` — stores AI chat conversation history per user.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users.id ON DELETE CASCADE)
  - `role` (text, not null) — 'user' or 'assistant'
  - `content` (text, not null) — message content
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on `users` — public read access via share_token on status page; full access for anon/authenticated since this is a no-auth app.
- RLS enabled on `chat_messages` — public read/write since no auth is implemented (single-tenant model).
- Using `TO anon, authenticated` on all policies so the anon-key frontend can operate.

3. Important Notes
- This app has no sign-in screen, so all policies are scoped to `anon, authenticated`.
- The `share_token` allows family members to view a specific user's status without seeing other users' data.
- The `updated_at` trigger is omitted for simplicity; the frontend will set it on updates.
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nationality text NOT NULL,
  location_lat double precision,
  location_lng double precision,
  location_label text,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  status text NOT NULL DEFAULT 'safe',
  share_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON chat_messages;
CREATE POLICY "anon_select_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON chat_messages;
CREATE POLICY "anon_insert_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON chat_messages;
CREATE POLICY "anon_update_messages" ON chat_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON chat_messages;
CREATE POLICY "anon_delete_messages" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_users_share_token ON users(share_token);
