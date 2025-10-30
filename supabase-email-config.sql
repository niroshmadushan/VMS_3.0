-- =====================================================
-- Supabase Email Configuration & Authentication Settings
-- =====================================================
-- This script configures email confirmation and authentication settings
-- for your VM Supabase instance

-- =====================================================
-- 1. EMAIL CONFIRMATION SETTINGS
-- =====================================================

-- Enable email confirmation (this should be done in Supabase Dashboard)
-- Go to Authentication > Settings > Email Templates
-- But we can also set some defaults here

-- =====================================================
-- 2. CREATE EMAIL TEMPLATES CONFIGURATION TABLE
-- =====================================================

-- Create a table to store email template configurations
CREATE TABLE IF NOT EXISTS public.email_templates (
    id SERIAL PRIMARY KEY,
    template_type TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage email templates
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 3. INSERT DEFAULT EMAIL TEMPLATES
-- =====================================================

-- Confirmation email template
INSERT INTO public.email_templates (template_type, subject, body_html, body_text) VALUES (
    'confirmation',
    'Confirm your email address - {{ .SiteName }}',
    '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirm your email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to {{ .SiteName }}!</h1>
            </div>
            <div class="content">
                <h2>Confirm your email address</h2>
                <p>Hi {{ .Email }},</p>
                <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
                <p style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
                </p>
                <p>If the button doesn''t work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                    {{ .ConfirmationURL }}
                </p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn''t create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 {{ .SiteName }}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ',
    '
    Welcome to {{ .SiteName }}!
    
    Hi {{ .Email }},
    
    Thank you for signing up! Please confirm your email address by visiting this link:
    
    {{ .ConfirmationURL }}
    
    This link will expire in 24 hours.
    
    If you didn''t create an account, you can safely ignore this email.
    
    © 2024 {{ .SiteName }}. All rights reserved.
    '
) ON CONFLICT (template_type) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    updated_at = NOW();

-- Password reset email template
INSERT INTO public.email_templates (template_type, subject, body_html, body_text) VALUES (
    'recovery',
    'Reset your password - {{ .SiteName }}',
    '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Reset your password</h2>
                <p>Hi {{ .Email }},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <p style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
                </p>
                <p>If the button doesn''t work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                    {{ .ConfirmationURL }}
                </p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn''t request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2024 {{ .SiteName }}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ',
    '
    Password Reset Request
    
    Hi {{ .Email }},
    
    We received a request to reset your password. Visit this link to create a new password:
    
    {{ .ConfirmationURL }}
    
    This link will expire in 1 hour.
    
    If you didn''t request a password reset, you can safely ignore this email.
    
    © 2024 {{ .SiteName }}. All rights reserved.
    '
) ON CONFLICT (template_type) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    body_text = EXCLUDED.body_text,
    updated_at = NOW();

-- =====================================================
-- 4. CREATE EMAIL SENDING FUNCTION
-- =====================================================

-- Function to send custom emails (if you want to use custom email service)
CREATE OR REPLACE FUNCTION public.send_custom_email(
    to_email TEXT,
    template_type TEXT,
    template_vars JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    template_record RECORD;
    subject_text TEXT;
    body_html_text TEXT;
    body_text_text TEXT;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM public.email_templates
    WHERE template_type = $2 AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email template not found: %', $2;
    END IF;
    
    -- Replace template variables
    subject_text := template_record.subject;
    body_html_text := template_record.body_html;
    body_text_text := template_record.body_text;
    
    -- Simple variable replacement (you might want to use a more sophisticated templating system)
    subject_text := replace(subject_text, '{{ .SiteName }}', COALESCE(template_vars->>'site_name', 'Your App'));
    subject_text := replace(subject_text, '{{ .Email }}', to_email);
    
    body_html_text := replace(body_html_text, '{{ .SiteName }}', COALESCE(template_vars->>'site_name', 'Your App'));
    body_html_text := replace(body_html_text, '{{ .Email }}', to_email);
    body_html_text := replace(body_html_text, '{{ .ConfirmationURL }}', COALESCE(template_vars->>'confirmation_url', '#'));
    
    body_text_text := replace(body_text_text, '{{ .SiteName }}', COALESCE(template_vars->>'site_name', 'Your App'));
    body_text_text := replace(body_text_text, '{{ .Email }}', to_email);
    body_text_text := replace(body_text_text, '{{ .ConfirmationURL }}', COALESCE(template_vars->>'confirmation_url', '#'));
    
    -- Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    -- For now, we'll just log the email
    RAISE NOTICE 'Email would be sent to: %, Subject: %, Body: %', to_email, subject_text, body_text_text;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE AUTHENTICATION AUDIT LOG
-- =====================================================

-- Create audit log table for authentication events
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login', 'logout', 'email_confirmed', 'password_reset', 'profile_updated')),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit log
DROP POLICY IF EXISTS "Users can view own audit log" ON public.auth_audit_log;
CREATE POLICY "Users can view own audit log" ON public.auth_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.auth_audit_log;
CREATE POLICY "Admins can view all audit logs" ON public.auth_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
    event_type TEXT,
    user_id UUID DEFAULT auth.uid(),
    event_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_audit_log (
        user_id,
        event_type,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        $2,
        $1,
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent',
        $3
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE INDEXES FOR AUDIT LOG
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_event_type ON public.auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Email configuration and audit logging setup completed successfully!' as status;
