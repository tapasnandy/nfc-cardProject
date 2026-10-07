-- Initial Database Schema for NFC Business Card Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS Table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ORGANIZATIONS Table
CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- PROFILES Table
CREATE TABLE public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Optional: assigned user
    name TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    bio TEXT,
    profile_photo TEXT,
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    website TEXT,
    linkedin TEXT,
    facebook TEXT,
    instagram TEXT,
    address TEXT,
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- CARDS Table
CREATE TABLE public.cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- A card can be unassigned initially
    card_uid TEXT UNIQUE, -- Optional: hardware UID of the card
    short_code TEXT UNIQUE NOT NULL, -- e.g. AB12XZ used in URL /c/AB12XZ
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ANALYTICS_EVENTS Table
CREATE TABLE public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT DEFAULT 'tap',
    device_type TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    ip_hash TEXT, -- Anonymized IP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can view their own organizations
CREATE POLICY "Users can view own organizations" ON public.organizations FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own organizations" ON public.organizations FOR UPDATE USING (auth.uid() = owner_id);

-- Profiles: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in own org" ON public.profiles FOR SELECT USING (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can create profiles in own org" ON public.profiles FOR INSERT WITH CHECK (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can update profiles in own org" ON public.profiles FOR UPDATE USING (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);

-- Profiles: Public access for active cards (anyone can view a profile if they have the link)
-- We will handle this by a server-side fetch bypassing RLS using service_role, OR we can allow public read:
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
-- Note: We might want to restrict this more in production, but for MVP, public profiles are meant to be public.

-- Cards: Users can view cards in their organization
CREATE POLICY "Users can view cards in own org" ON public.cards FOR SELECT USING (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can create cards in own org" ON public.cards FOR INSERT WITH CHECK (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can update cards in own org" ON public.cards FOR UPDATE USING (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);

-- Cards: Public can read active cards to resolve short_code
CREATE POLICY "Public can view active cards" ON public.cards FOR SELECT USING (status = 'active');

-- Analytics: Users can view analytics for cards in their organization
CREATE POLICY "Users can view analytics for own cards" ON public.analytics_events FOR SELECT USING (
    card_id IN (
        SELECT id FROM public.cards WHERE organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
    )
);
-- Analytics: Anyone (or the server) can insert analytics events
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- TRIGGER to automatically create a public.users row on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
