-- =====================================================
-- Update Role Schema Migration
-- =====================================================
-- This script updates the role CHECK constraint to use:
-- admin, staff, assistant, user (instead of admin, employee, reception, user)
-- Also migrates existing data from old roles to new roles

-- =====================================================
-- 1. UPDATE ROLE CHECK CONSTRAINT
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with updated roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'staff', 'assistant', 'user'));

-- =====================================================
-- 2. MIGRATE EXISTING DATA
-- =====================================================

-- Update existing 'employee' roles to 'staff'
UPDATE public.profiles 
SET role = 'staff' 
WHERE role = 'employee';

-- Update existing 'reception' roles to 'assistant'
UPDATE public.profiles 
SET role = 'assistant' 
WHERE role = 'reception';

-- =====================================================
-- 3. VERIFY CHANGES
-- =====================================================

-- Check role distribution after migration
SELECT role, COUNT(*) as count 
FROM public.profiles 
GROUP BY role 
ORDER BY count DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Role schema updated successfully! Migrated employee->staff and reception->assistant.' as status;

