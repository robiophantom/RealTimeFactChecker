CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default global limits
INSERT INTO public.system_settings (setting_key, setting_value) VALUES 
('limits', '{"max_text_size_mb": 10, "max_media_size_mb": 50, "max_text_length": 100000, "max_transcript_tokens": 7000, "user_monthly_token_limit": 10000}')
ON CONFLICT (setting_key) DO NOTHING;

-- Allow read access to all authenticated users
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system settings" ON public.system_settings FOR SELECT USING (true);
-- Only admins can update
CREATE POLICY "Admins can update system settings" ON public.system_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert system settings" ON public.system_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
