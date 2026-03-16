-- Migration: Enable RLS on nocte_chat_histories
-- Date: 2026-03-14
-- Reason: Table had RLS disabled, exposing all conversations to anyone with the anon key
-- Supabase project: qapqhhyfzmgkvzvtoluq

ALTER TABLE nocte_chat_histories ENABLE ROW LEVEL SECURITY;

-- Only the service_role (backend/n8n) should access chat histories.
-- The anon key gets zero access.
CREATE POLICY "Service role full access"
  ON nocte_chat_histories
  FOR ALL
  USING (auth.role() = 'service_role');
