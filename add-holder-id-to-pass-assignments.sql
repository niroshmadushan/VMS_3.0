-- Migration: Add holder_id column to pass_assignments table
-- This column stores the external member ID when a pass is assigned to a visitor
-- and gets cleared when the pass is returned

ALTER TABLE pass_assignments ADD COLUMN holder_id VARCHAR(36) NULL AFTER holder_reference_id;

-- Add index for better performance when querying by holder_id
CREATE INDEX idx_pass_assignments_holder_id ON pass_assignments(holder_id);

-- Add foreign key constraint to external_members table (optional)
-- ALTER TABLE pass_assignments ADD CONSTRAINT fk_pass_assignments_holder_id 
-- FOREIGN KEY (holder_id) REFERENCES external_members(id) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing pass_assignments to set holder_id based on holder_reference_id
-- This is a one-time migration for existing data
UPDATE pass_assignments pa 
SET holder_id = pa.holder_reference_id
WHERE pa.holder_reference_id IS NOT NULL
AND pa.holder_type = 'external'
AND pa.is_deleted = 0;

-- Verify the migration
SELECT 
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN holder_id IS NOT NULL THEN 1 END) as assignments_with_holder_id,
    COUNT(CASE WHEN holder_reference_id IS NOT NULL AND holder_id IS NULL THEN 1 END) as missing_holder_id
FROM pass_assignments 
WHERE is_deleted = 0;
