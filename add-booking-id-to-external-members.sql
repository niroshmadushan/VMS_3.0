-- ============================================
-- ADD booking_id TO external_members TABLE
-- ============================================
ALTER TABLE `external_members` 
ADD COLUMN `booking_id` CHAR(36) NULL AFTER `id`,
ADD COLUMN `participation_status` ENUM('invited', 'confirmed', 'checked_in', 'checked_out', 'no_show') DEFAULT 'invited' AFTER `booking_id`,
ADD COLUMN `checked_in_at` DATETIME NULL AFTER `participation_status`,
ADD COLUMN `checked_out_at` DATETIME NULL AFTER `checked_in_at`,
ADD COLUMN `visitor_pass_id` VARCHAR(100) NULL AFTER `checked_out_at`,
ADD INDEX `idx_booking_id` (`booking_id`);












