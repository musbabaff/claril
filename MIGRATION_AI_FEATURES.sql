-- MIGRATION_AI_FEATURES.sql
-- Run this SQL in your Supabase SQL Editor to enable All AI Features for Claril.

-- 1. Create ANALYSES table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 100),
    recommendation TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analyses for their own cases" ON analyses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = analyses.case_id 
            AND cases.user_id = auth.uid()
        )
    );

-- 2. Create AGENT_RUNS table
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL CHECK (agent_name IN ('Extraction Auditor', 'Risk Analyst', 'Compliance Checker', 'Synthesizer')),
    status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'completed', 'failed')),
    reasoning_log TEXT DEFAULT '',
    output JSONB,
    score NUMERIC,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for agent_runs
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agent runs for their own cases" ON agent_runs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = agent_runs.case_id 
            AND cases.user_id = auth.uid()
        )
    );

-- 3. Create CASE_MESSAGES table for AI Chat / Copilot
CREATE TABLE IF NOT EXISTS case_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for case_messages
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages for their own cases" ON case_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = case_messages.case_id 
            AND cases.user_id = auth.uid()
        )
    );

-- 4. Enable Realtime on analyses, agent_runs, and case_messages tables
-- Note: Supabase requires adding tables to the publication for Realtime
alter publication supabase_realtime add table analyses;
alter publication supabase_realtime add table agent_runs;
alter publication supabase_realtime add table case_messages;
