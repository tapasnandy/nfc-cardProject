-- Migration: Add LEADS Table for Lead Capture & Sales Team Tracking

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    source TEXT DEFAULT 'visitor' CHECK (source IN ('visitor', 'salesperson')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'lost')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexing for quick lookups
CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_card ON public.leads(card_id);
CREATE INDEX IF NOT EXISTS idx_leads_profile ON public.leads(profile_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Organization members can view and manage their leads
CREATE POLICY "Users can view leads in own org" ON public.leads FOR SELECT USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update leads in own org" ON public.leads FOR UPDATE USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Users can delete leads in own org" ON public.leads FOR DELETE USING (
    organization_id IN (
        SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
);

-- Public / anyone can submit an enquiry / lead for a card
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
