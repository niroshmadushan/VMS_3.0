-- =====================================================
-- Fix Email Normalization Issue
-- =====================================================
-- This script fixes the issue where Supabase Auth normalizes emails
-- (e.g., removes dots from Gmail addresses), causing the profile to
-- store the normalized email instead of the original email.
--
-- Solution: Store original email in user_metadata and use it in the trigger

-- =====================================================
-- 1. UPDATE TRIGGER FUNCTION TO USE ORIGINAL EMAIL
-- =====================================================

-- Function to handle new user signup - FIXED to preserve original email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new profile record
    -- Use original_email from user_metadata if available, otherwise use NEW.email
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'original_email', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'original_email', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Email normalization fix applied successfully! The trigger will now preserve the original email format.' as status;

