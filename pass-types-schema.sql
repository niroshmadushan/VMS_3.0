-- =====================================================
-- PASS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This schema manages different types of passes and their assignments
-- Features: Pass types, pass ranges, pass assignments, and tracking
-- =====================================================

-- =====================================================
-- 1. PASS TYPES TABLE
-- =====================================================
-- Stores different categories of passes (e.g., Visitor Pass, VIP Pass)
CREATE TABLE IF NOT EXISTS `pass_types` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `color` VARCHAR(20) DEFAULT '#3B82F6', -- Hex color for UI display
  `prefix` VARCHAR(10), -- Optional prefix for pass numbers (e.g., 'V' for Visitor, 'VIP' for VIP)
  `min_number` INT NOT NULL DEFAULT 1,
  `max_number` INT NOT NULL,
  `total_passes` INT GENERATED ALWAYS AS (`max_number` - `min_number` + 1) STORED,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_by` VARCHAR(36),
  `updated_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT `chk_pass_range` CHECK (`max_number` >= `min_number`),
  CONSTRAINT `chk_min_positive` CHECK (`min_number` > 0),
  
  -- Indexes
  INDEX `idx_pass_types_active` (`is_active`, `is_deleted`),
  INDEX `idx_pass_types_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. PASSES TABLE
-- =====================================================
-- Individual pass instances within each pass type
CREATE TABLE IF NOT EXISTS `passes` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `pass_type_id` VARCHAR(36) NOT NULL,
  `pass_number` INT NOT NULL,
  `pass_display_name` VARCHAR(50), -- e.g., "V-001", "VIP-05"
  `status` ENUM('available', 'assigned', 'lost', 'damaged', 'retired') DEFAULT 'available',
  `current_holder_name` VARCHAR(200),
  `current_holder_contact` VARCHAR(50),
  `current_holder_type` ENUM('internal', 'external', 'visitor'),
  `assigned_at` TIMESTAMP NULL,
  `returned_at` TIMESTAMP NULL,
  `notes` TEXT,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_by` VARCHAR(36),
  `updated_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`pass_type_id`) REFERENCES `pass_types`(`id`) ON DELETE CASCADE,
  
  -- Constraints
  UNIQUE KEY `unique_pass_per_type` (`pass_type_id`, `pass_number`),
  
  -- Indexes
  INDEX `idx_passes_status` (`status`, `is_deleted`),
  INDEX `idx_passes_type` (`pass_type_id`),
  INDEX `idx_passes_number` (`pass_number`),
  INDEX `idx_passes_holder` (`current_holder_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. PASS ASSIGNMENTS HISTORY TABLE
-- =====================================================
-- Tracks all pass assignments and returns over time
CREATE TABLE IF NOT EXISTS `pass_assignments` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `pass_id` VARCHAR(36) NOT NULL,
  `pass_type_id` VARCHAR(36) NOT NULL,
  `pass_number` INT NOT NULL,
  `action_type` ENUM('assigned', 'returned', 'lost', 'damaged', 'found', 'repaired') NOT NULL,
  `holder_name` VARCHAR(200),
  `holder_contact` VARCHAR(50),
  `holder_type` ENUM('internal', 'external', 'visitor'),
  `holder_reference_id` VARCHAR(36), -- Link to user/member/visitor ID
  `booking_id` VARCHAR(36), -- Optional: Link to booking if pass was assigned for a booking
  `assigned_by` VARCHAR(36),
  `assigned_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expected_return_date` DATE,
  `actual_return_date` TIMESTAMP NULL,
  `duration_hours` INT GENERATED ALWAYS AS (
    CASE 
      WHEN `actual_return_date` IS NOT NULL 
      THEN TIMESTAMPDIFF(HOUR, `assigned_date`, `actual_return_date`)
      ELSE NULL 
    END
  ) STORED,
  `notes` TEXT,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`pass_id`) REFERENCES `passes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pass_type_id`) REFERENCES `pass_types`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_assignments_pass` (`pass_id`),
  INDEX `idx_assignments_type` (`pass_type_id`),
  INDEX `idx_assignments_action` (`action_type`),
  INDEX `idx_assignments_holder` (`holder_name`),
  INDEX `idx_assignments_date` (`assigned_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. PASS STATISTICS VIEW
-- =====================================================
-- Real-time statistics for each pass type
CREATE OR REPLACE VIEW `v_pass_type_statistics` AS
SELECT 
  pt.id AS pass_type_id,
  pt.name AS pass_type_name,
  pt.prefix,
  pt.min_number,
  pt.max_number,
  pt.total_passes,
  pt.color,
  pt.is_active,
  COUNT(p.id) AS total_created_passes,
  SUM(CASE WHEN p.status = 'available' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) AS available_count,
  SUM(CASE WHEN p.status = 'assigned' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) AS assigned_count,
  SUM(CASE WHEN p.status = 'lost' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) AS lost_count,
  SUM(CASE WHEN p.status = 'damaged' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) AS damaged_count,
  SUM(CASE WHEN p.status = 'retired' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) AS retired_count,
  ROUND(
    (SUM(CASE WHEN p.status = 'assigned' AND p.is_deleted = FALSE THEN 1 ELSE 0 END) * 100.0) / 
    NULLIF(COUNT(p.id), 0), 
    2
  ) AS utilization_percentage,
  pt.created_at,
  pt.updated_at
FROM pass_types pt
LEFT JOIN passes p ON pt.id = p.pass_type_id AND p.is_deleted = FALSE
WHERE pt.is_deleted = FALSE
GROUP BY pt.id, pt.name, pt.prefix, pt.min_number, pt.max_number, pt.total_passes, pt.color, pt.is_active, pt.created_at, pt.updated_at;

-- =====================================================
-- 5. ACTIVE PASS ASSIGNMENTS VIEW
-- =====================================================
-- Shows currently assigned passes
CREATE OR REPLACE VIEW `v_active_pass_assignments` AS
SELECT 
  p.id AS pass_id,
  p.pass_number,
  p.pass_display_name,
  pt.name AS pass_type_name,
  pt.color AS pass_type_color,
  p.status,
  p.current_holder_name,
  p.current_holder_contact,
  p.current_holder_type,
  p.assigned_at,
  pa.expected_return_date,
  DATEDIFF(CURRENT_DATE, p.assigned_at) AS days_assigned,
  CASE 
    WHEN pa.expected_return_date < CURRENT_DATE THEN 'overdue'
    WHEN DATEDIFF(pa.expected_return_date, CURRENT_DATE) <= 1 THEN 'due_soon'
    ELSE 'active'
  END AS assignment_status,
  pa.notes,
  pa.booking_id
FROM passes p
INNER JOIN pass_types pt ON p.pass_type_id = pt.id
LEFT JOIN pass_assignments pa ON p.id = pa.pass_id 
  AND pa.action_type = 'assigned' 
  AND pa.actual_return_date IS NULL
  AND pa.is_deleted = FALSE
WHERE p.status = 'assigned' 
  AND p.is_deleted = FALSE 
  AND pt.is_deleted = FALSE;

-- =====================================================
-- 6. PASS HISTORY VIEW
-- =====================================================
-- Complete audit trail for all pass activities
CREATE OR REPLACE VIEW `v_pass_history` AS
SELECT 
  pa.id AS assignment_id,
  p.pass_display_name,
  pt.name AS pass_type_name,
  pa.action_type,
  pa.holder_name,
  pa.holder_contact,
  pa.holder_type,
  pa.assigned_date,
  pa.actual_return_date,
  pa.duration_hours,
  CASE 
    WHEN pa.expected_return_date IS NOT NULL AND pa.actual_return_date IS NULL AND pa.expected_return_date < CURRENT_DATE 
    THEN 'overdue'
    WHEN pa.actual_return_date IS NOT NULL AND pa.actual_return_date > pa.expected_return_date 
    THEN 'returned_late'
    WHEN pa.actual_return_date IS NOT NULL 
    THEN 'returned_on_time'
    ELSE 'ongoing'
  END AS return_status,
  pa.notes,
  pa.created_at
FROM pass_assignments pa
INNER JOIN passes p ON pa.pass_id = p.id
INNER JOIN pass_types pt ON pa.pass_type_id = pt.id
WHERE pa.is_deleted = FALSE
ORDER BY pa.created_at DESC;

-- =====================================================
-- 7. STORED PROCEDURES
-- =====================================================

-- Procedure to create a new pass type and auto-generate passes
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_create_pass_type_with_passes`(
  IN p_name VARCHAR(100),
  IN p_description TEXT,
  IN p_color VARCHAR(20),
  IN p_prefix VARCHAR(10),
  IN p_min_number INT,
  IN p_max_number INT,
  IN p_created_by VARCHAR(36),
  OUT p_pass_type_id VARCHAR(36),
  OUT p_passes_created INT
)
BEGIN
  DECLARE v_current_number INT;
  DECLARE v_display_name VARCHAR(50);
  
  -- Create the pass type
  INSERT INTO pass_types (name, description, color, prefix, min_number, max_number, created_by)
  VALUES (p_name, p_description, p_color, p_prefix, p_min_number, p_max_number, p_created_by);
  
  SET p_pass_type_id = LAST_INSERT_ID();
  SET v_current_number = p_min_number;
  SET p_passes_created = 0;
  
  -- Generate individual passes
  WHILE v_current_number <= p_max_number DO
    IF p_prefix IS NOT NULL AND p_prefix != '' THEN
      SET v_display_name = CONCAT(p_prefix, '-', LPAD(v_current_number, 3, '0'));
    ELSE
      SET v_display_name = LPAD(v_current_number, 3, '0');
    END IF;
    
    INSERT INTO passes (pass_type_id, pass_number, pass_display_name, status, created_by)
    VALUES (p_pass_type_id, v_current_number, v_display_name, 'available', p_created_by);
    
    SET v_current_number = v_current_number + 1;
    SET p_passes_created = p_passes_created + 1;
  END WHILE;
END //
DELIMITER ;

-- Procedure to assign a pass
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_assign_pass`(
  IN p_pass_id VARCHAR(36),
  IN p_holder_name VARCHAR(200),
  IN p_holder_contact VARCHAR(50),
  IN p_holder_type ENUM('internal', 'external', 'visitor'),
  IN p_holder_reference_id VARCHAR(36),
  IN p_expected_return_date DATE,
  IN p_assigned_by VARCHAR(36),
  IN p_booking_id VARCHAR(36),
  IN p_notes TEXT
)
BEGIN
  DECLARE v_pass_type_id VARCHAR(36);
  DECLARE v_pass_number INT;
  
  -- Get pass details
  SELECT pass_type_id, pass_number INTO v_pass_type_id, v_pass_number
  FROM passes WHERE id = p_pass_id;
  
  -- Update pass status
  UPDATE passes 
  SET 
    status = 'assigned',
    current_holder_name = p_holder_name,
    current_holder_contact = p_holder_contact,
    current_holder_type = p_holder_type,
    assigned_at = CURRENT_TIMESTAMP,
    returned_at = NULL,
    updated_by = p_assigned_by
  WHERE id = p_pass_id;
  
  -- Record assignment
  INSERT INTO pass_assignments (
    pass_id, pass_type_id, pass_number, action_type,
    holder_name, holder_contact, holder_type, holder_reference_id,
    assigned_by, expected_return_date, booking_id, notes
  )
  VALUES (
    p_pass_id, v_pass_type_id, v_pass_number, 'assigned',
    p_holder_name, p_holder_contact, p_holder_type, p_holder_reference_id,
    p_assigned_by, p_expected_return_date, p_booking_id, p_notes
  );
END //
DELIMITER ;

-- Procedure to return a pass
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_return_pass`(
  IN p_pass_id VARCHAR(36),
  IN p_returned_by VARCHAR(36),
  IN p_notes TEXT
)
BEGIN
  -- Update pass status
  UPDATE passes 
  SET 
    status = 'available',
    current_holder_name = NULL,
    current_holder_contact = NULL,
    current_holder_type = NULL,
    returned_at = CURRENT_TIMESTAMP,
    updated_by = p_returned_by
  WHERE id = p_pass_id;
  
  -- Update assignment record
  UPDATE pass_assignments 
  SET 
    action_type = 'returned',
    actual_return_date = CURRENT_TIMESTAMP,
    notes = CONCAT(COALESCE(notes, ''), ' | Returned: ', COALESCE(p_notes, ''))
  WHERE pass_id = p_pass_id 
    AND action_type = 'assigned' 
    AND actual_return_date IS NULL
    AND is_deleted = FALSE
  ORDER BY assigned_date DESC
  LIMIT 1;
END //
DELIMITER ;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger: Auto-update pass display name when pass type prefix changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `trg_update_pass_display_names`
AFTER UPDATE ON `pass_types`
FOR EACH ROW
BEGIN
  IF OLD.prefix != NEW.prefix THEN
    UPDATE passes 
    SET pass_display_name = CASE 
      WHEN NEW.prefix IS NOT NULL AND NEW.prefix != '' 
      THEN CONCAT(NEW.prefix, '-', LPAD(pass_number, 3, '0'))
      ELSE LPAD(pass_number, 3, '0')
    END
    WHERE pass_type_id = NEW.id;
  END IF;
END //
DELIMITER ;

-- =====================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample pass types
INSERT INTO pass_types (name, description, color, prefix, min_number, max_number, created_by) 
VALUES 
  ('Visitor Pass', 'Standard visitor passes for guests and temporary visitors', '#3B82F6', 'V', 1, 20, 'system'),
  ('VIP Pass', 'Exclusive passes for VIP guests and executives', '#F59E0B', 'VIP', 1, 5, 'system'),
  ('Contractor Pass', 'Passes for contractors and temporary workers', '#10B981', 'C', 1, 15, 'system'),
  ('Vendor Pass', 'Passes for vendors and suppliers', '#8B5CF6', 'VEN', 1, 10, ' 'system')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Auto-generate passes for each pass type
INSERT INTO passes (pass_type_id, pass_number, pass_display_name, status)
SELECT 
  pt.id,
  numbers.n,
  CONCAT(pt.prefix, '-', LPAD(numbers.n, 3, '0')),
  'available'
FROM pass_types pt
CROSS JOIN (
  SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
  SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION 
  SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION 
  SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
) AS numbers
WHERE numbers.n BETWEEN pt.min_number AND pt.max_number
  AND NOT EXISTS (
    SELECT 1 FROM passes p 
    WHERE p.pass_type_id = pt.id AND p.pass_number = numbers.n
  );

-- =====================================================
-- END OF SCHEMA
-- =====================================================

