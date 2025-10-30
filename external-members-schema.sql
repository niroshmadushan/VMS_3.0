-- ============================================
-- EXTERNAL MEMBERS MANAGEMENT SYSTEM
-- Database: MySQL (XAMPP Compatible)
-- ============================================

-- Drop existing tables if needed
DROP TABLE IF EXISTS `external_member_history`;
DROP TABLE IF EXISTS `external_members`;

-- ============================================
-- 1. EXTERNAL MEMBERS TABLE
-- ============================================
CREATE TABLE `external_members` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `company_name` VARCHAR(255) NULL,
  `designation` VARCHAR(255) NULL,
  `reference_type` ENUM('NIC', 'Passport', 'Driving License', 'Employee ID', 'Other') NOT NULL DEFAULT 'NIC',
  `reference_value` VARCHAR(100) NOT NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL DEFAULT 'Sri Lanka',
  `profile_image` VARCHAR(500) NULL,
  `notes` TEXT NULL,
  `is_blacklisted` TINYINT(1) NOT NULL DEFAULT 0,
  `blacklist_reason` TEXT NULL,
  `visit_count` INT NOT NULL DEFAULT 0,
  `last_visit_date` DATETIME NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` CHAR(36) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` CHAR(36) NULL,
  `deleted_at` DATETIME NULL,
  `deleted_by` CHAR(36) NULL,
  
  -- Unique constraints to prevent duplicates
  UNIQUE KEY `unique_email` (`email`),
  UNIQUE KEY `unique_phone` (`phone`),
  UNIQUE KEY `unique_company_email` (`company_name`, `email`),
  
  -- Indexes for faster searching
  INDEX `idx_full_name` (`full_name`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_company_name` (`company_name`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_blacklisted` (`is_blacklisted`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. EXTERNAL MEMBER HISTORY TABLE
-- ============================================
CREATE TABLE `external_member_history` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `member_id` CHAR(36) NOT NULL,
  `action` ENUM('created', 'updated', 'blacklisted', 'unblacklisted', 'deleted', 'restored') NOT NULL,
  `field_name` VARCHAR(100) NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `reason` TEXT NULL,
  `performed_by` CHAR(36) NULL,
  `performed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_member_id` (`member_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_performed_at` (`performed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. UPDATE BOOKINGS TABLE
-- Add external participant ID reference
-- ============================================
ALTER TABLE `bookings` 
ADD COLUMN `has_external_participants` TINYINT(1) NOT NULL DEFAULT 0 AFTER `total_participants`;

-- ============================================
-- 4. UPDATE EXTERNAL_PARTICIPANTS TABLE
-- Add member_id reference to link with external_members
-- ============================================
ALTER TABLE `external_participants` 
ADD COLUMN `member_id` CHAR(36) NULL AFTER `booking_id`,
ADD INDEX `idx_member_id` (`member_id`);

-- ============================================
-- 5. VIEWS FOR REPORTING
-- ============================================

-- Active External Members
CREATE OR REPLACE VIEW `v_active_external_members` AS
SELECT 
  `id`,
  `full_name`,
  `email`,
  `phone`,
  `company_name`,
  `designation`,
  `visit_count`,
  `last_visit_date`,
  `created_at`
FROM `external_members`
WHERE `is_active` = 1 
  AND `is_deleted` = 0 
  AND `is_blacklisted` = 0
ORDER BY `full_name`;

-- Blacklisted Members
CREATE OR REPLACE VIEW `v_blacklisted_members` AS
SELECT 
  `id`,
  `full_name`,
  `email`,
  `phone`,
  `company_name`,
  `blacklist_reason`,
  `updated_at` AS `blacklisted_at`
FROM `external_members`
WHERE `is_blacklisted` = 1 
  AND `is_deleted` = 0
ORDER BY `updated_at` DESC;

-- Member Statistics
CREATE OR REPLACE VIEW `v_member_statistics` AS
SELECT 
  `company_name`,
  COUNT(*) AS `total_members`,
  SUM(`visit_count`) AS `total_visits`,
  MAX(`last_visit_date`) AS `last_visit`,
  AVG(`visit_count`) AS `avg_visits_per_member`
FROM `external_members`
WHERE `is_active` = 1 
  AND `is_deleted` = 0 
  AND `is_blacklisted` = 0
GROUP BY `company_name`
ORDER BY `total_members` DESC;

-- ============================================
-- 6. STORED PROCEDURES
-- ============================================

-- Check if member exists by email or phone
DELIMITER $$
CREATE PROCEDURE `sp_check_member_exists`(
  IN p_email VARCHAR(255),
  IN p_phone VARCHAR(20),
  OUT p_exists TINYINT,
  OUT p_member_id CHAR(36)
)
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 1 
      ELSE 0 
    END,
    MAX(`id`)
  INTO p_exists, p_member_id
  FROM `external_members`
  WHERE (`email` = p_email OR `phone` = p_phone)
    AND `is_deleted` = 0;
END$$
DELIMITER ;

-- Get member by email or phone
DELIMITER $$
CREATE PROCEDURE `sp_get_member_by_contact`(
  IN p_search VARCHAR(255)
)
BEGIN
  SELECT 
    `id`,
    `full_name`,
    `email`,
    `phone`,
    `company_name`,
    `designation`,
    `reference_type`,
    `reference_value`,
    `visit_count`,
    `is_blacklisted`,
    `blacklist_reason`
  FROM `external_members`
  WHERE (`email` LIKE CONCAT('%', p_search, '%') 
    OR `phone` LIKE CONCAT('%', p_search, '%')
    OR `full_name` LIKE CONCAT('%', p_search, '%'))
    AND `is_deleted` = 0
  LIMIT 10;
END$$
DELIMITER ;

-- ============================================
-- 7. TRIGGERS FOR AUDIT TRAIL
-- ============================================

-- Trigger: After Insert
DELIMITER $$
CREATE TRIGGER `trg_external_members_after_insert`
AFTER INSERT ON `external_members`
FOR EACH ROW
BEGIN
  INSERT INTO `external_member_history` (
    `id`,
    `member_id`,
    `action`,
    `reason`,
    `performed_by`,
    `performed_at`
  ) VALUES (
    UUID(),
    NEW.`id`,
    'created',
    'New member added',
    NEW.`created_by`,
    NOW()
  );
END$$
DELIMITER ;

-- Trigger: After Update
DELIMITER $$
CREATE TRIGGER `trg_external_members_after_update`
AFTER UPDATE ON `external_members`
FOR EACH ROW
BEGIN
  -- Log blacklist changes
  IF OLD.`is_blacklisted` != NEW.`is_blacklisted` THEN
    INSERT INTO `external_member_history` (
      `id`,
      `member_id`,
      `action`,
      `field_name`,
      `old_value`,
      `new_value`,
      `reason`,
      `performed_by`,
      `performed_at`
    ) VALUES (
      UUID(),
      NEW.`id`,
      IF(NEW.`is_blacklisted` = 1, 'blacklisted', 'unblacklisted'),
      'is_blacklisted',
      OLD.`is_blacklisted`,
      NEW.`is_blacklisted`,
      NEW.`blacklist_reason`,
      NEW.`updated_by`,
      NOW()
    );
  END IF;
  
  -- Log general updates
  IF OLD.`updated_at` != NEW.`updated_at` THEN
    INSERT INTO `external_member_history` (
      `id`,
      `member_id`,
      `action`,
      `performed_by`,
      `performed_at`
    ) VALUES (
      UUID(),
      NEW.`id`,
      'updated',
      NEW.`updated_by`,
      NOW()
    );
  END IF;
END$$
DELIMITER ;

-- ============================================
-- 8. SAMPLE DATA (Optional)
-- ============================================

INSERT INTO `external_members` (
  `id`,
  `full_name`,
  `email`,
  `phone`,
  `company_name`,
  `designation`,
  `reference_type`,
  `reference_value`,
  `city`,
  `country`
) VALUES
(UUID(), 'John Doe', 'john.doe@techcorp.com', '+94771234567', 'Tech Corp', 'Manager', 'NIC', '199012345678', 'Colombo', 'Sri Lanka'),
(UUID(), 'Jane Smith', 'jane.smith@bizsoft.com', '+94772345678', 'Biz Soft Solutions', 'Director', 'Passport', 'N1234567', 'Kandy', 'Sri Lanka'),
(UUID(), 'Michael Brown', 'michael@innovate.lk', '+94773456789', 'Innovate Labs', 'CEO', 'NIC', '198512345678', 'Galle', 'Sri Lanka');

-- ============================================
-- END OF SCRIPT
-- ============================================

