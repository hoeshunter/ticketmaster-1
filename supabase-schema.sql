-- Supabase Database Schema for Ticketmaster Multi-Admin System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, store hashed passwords only
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    stadium VARCHAR(255) NOT NULL,
    day VARCHAR(10) NOT NULL, -- MON, TUE, WED, etc.
    date VARCHAR(20) NOT NULL, -- JUN 28, 2026 format
    time VARCHAR(20) NOT NULL, -- 7:00 PM format
    order_num VARCHAR(50) NOT NULL,
    tickets JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_admin_id ON events(admin_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
-- Allow anyone to read admins (for event attribution)
CREATE POLICY "Allow public read access to admins"
    ON admins FOR SELECT
    TO public
    USING (true);

-- Allow service role to insert admins (registration)
CREATE POLICY "Allow service role to insert admins"
    ON admins FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow admins to update their own profile
CREATE POLICY "Allow admins to update own profile"
    ON admins FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for events table
-- Allow public to read all events (for main app)
CREATE POLICY "Allow public read access to events"
    ON events FOR SELECT
    TO public
    USING (true);

-- Allow authenticated admins to create events
CREATE POLICY "Allow admins to create events"
    ON events FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id::text = auth.uid()::text
    );

-- Allow admins to update their own events
CREATE POLICY "Allow admins to update own events"
    ON events FOR UPDATE
    TO authenticated
    USING (admin_id::text = auth.uid()::text)
    WITH CHECK (admin_id::text = auth.uid()::text);

-- Allow admins to delete their own events
CREATE POLICY "Allow admins to delete own events"
    ON events FOR DELETE
    TO authenticated
    USING (admin_id::text = auth.uid()::text);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- NOTE: Do NOT seed admin accounts directly here.
-- The backend stores bcrypt-hashed passwords, so a plaintext INSERT would
-- create an admin that can never log in (bcrypt.compareSync would always fail).
-- Create the first admin via the registration endpoint instead, which hashes
-- the password correctly:
--   POST /api/admin/register  { "username": "...", "password": "..." }

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE admins TO anon, authenticated;
GRANT ALL ON TABLE events TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;