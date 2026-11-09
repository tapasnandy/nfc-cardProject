-- Migration: Add LEADS Table for Lead Capture & Sales Team Tracking
-- Copy and run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    job_title TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    source TEXT DEFAULT 'visitor' CHECK (source IN ('visitor', 'salesperson')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ensure job_title column exists if table was created in an earlier session
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Indexing for quick lookups
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_card ON public.leads(card_id);
CREATE INDEX IF NOT EXISTS idx_leads_profile ON public.leads(profile_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Users can view leads in own org" ON public.leads;
CREATE POLICY "Users can view leads in own org" ON public.leads FOR SELECT USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update leads in own org" ON public.leads;
CREATE POLICY "Users can update leads in own org" ON public.leads FOR UPDATE USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete leads in own org" ON public.leads;
CREATE POLICY "Users can delete leads in own org" ON public.leads FOR DELETE USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

-- Public / anyone can submit an enquiry / lead from digital cards
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
