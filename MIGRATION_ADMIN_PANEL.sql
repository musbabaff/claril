-- MIGRATION_ADMIN_PANEL.sql
-- Run this SQL in your Supabase SQL Editor to establish the settings table, add RLS policies, and promote your development account.

-- 1. Create the platform settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users
);

-- Seed some platform defaults
INSERT INTO public.platform_settings (key, value) VALUES
  ('default_ai_provider', '"gemini"'),
  ('max_file_size_mb', '25'),
  ('registration_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- 2. Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settings" ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 3. Enable admin cross-user read override RLS policies as a database safeguard on all tables
-- This ensures that standard users only see their own rows, while administrators bypass standard filters.

-- Profiles
CREATE POLICY "Admins see all profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Cases
CREATE POLICY "Admins see all cases" ON public.cases FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins update all cases" ON public.cases FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Documents
CREATE POLICY "Admins see all documents" ON public.documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Extractions
CREATE POLICY "Admins see all extractions" ON public.extractions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Analyses
CREATE POLICY "Admins see all analyses" ON public.analyses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Agent Runs
CREATE POLICY "Admins see all agent_runs" ON public.agent_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Case Messages (Chat)
CREATE POLICY "Admins see all case_messages" ON public.case_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Audit Logs
CREATE POLICY "Admins see all audit_logs" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
