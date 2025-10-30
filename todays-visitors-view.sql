-- =====================================================
-- TODAY'S VISITORS VIEW - Real-time Daily Visitor Tracking
-- =====================================================
-- This view automatically shows all visitors for the current date
-- Updates in real-time based on CURRENT_DATE
-- =====================================================

-- =====================================================
-- 1. TODAY'S VISITORS COMPREHENSIVE VIEW
-- =====================================================
-- Shows all external participants with bookings scheduled for today
-- Updated to use actual database field names
CREATE OR REPLACE VIEW `v_todays_visitors` AS
SELECT 
  -- External Member Information
  em.id AS member_id,
  em.full_name AS visitor_name,
  em.email AS visitor_email,
  em.phone AS visitor_phone,
  em.company_name AS visitor_company,
  em.designation AS visitor_designation,
  em.reference_type,
  em.reference_value,
  em.address,
  em.city,
  em.country,
  em.is_blacklisted,
  em.blacklist_reason,
  em.visit_count,
  em.last_visit_date,
  em.notes AS visitor_notes,
  
  -- Booking Information (using actual field names)
  b.id AS booking_id,
  b.booking_ref_id,
  b.title AS booking_title,
  b.description AS booking_description,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.status AS booking_status,
  b.booking_type,
  
  -- Place Information (bookings table has place_name directly)
  b.place_id,
  b.place_name,
  p.address AS place_address,
  p.city AS place_city,
  
  -- Responsible Person Information
  b.responsible_person_id,
  u.full_name AS responsible_person_name,
  u.email AS responsible_person_email,
  u.phone AS responsible_person_phone,
  
  -- Time Calculations
  TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time_formatted,
  TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time_formatted,
  CONCAT(
    TIME_FORMAT(b.start_time, '%h:%i %p'), 
    ' - ', 
    TIME_FORMAT(b.end_time, '%h:%i %p')
  ) AS time_slot,
  
  -- Status Indicators
  CASE 
    WHEN b.status = 'completed' THEN 'completed'
    WHEN b.status = 'cancelled' THEN 'cancelled'
    WHEN b.booking_date < CURRENT_DATE THEN 'missed'
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME < b.start_time THEN 'upcoming'
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME BETWEEN b.start_time AND b.end_time THEN 'ongoing'
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME > b.end_time THEN 'completed'
    ELSE 'upcoming'
  END AS current_status,
  
  -- Time Until/Since
  CASE 
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME < b.start_time 
    THEN CONCAT('In ', TIMESTAMPDIFF(MINUTE, CURRENT_TIME, b.start_time), ' mins')
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME BETWEEN b.start_time AND b.end_time 
    THEN CONCAT('Started ', TIMESTAMPDIFF(MINUTE, b.start_time, CURRENT_TIME), ' mins ago')
    WHEN b.booking_date = CURRENT_DATE AND CURRENT_TIME > b.end_time 
    THEN CONCAT('Ended ', TIMESTAMPDIFF(MINUTE, b.end_time, CURRENT_TIME), ' mins ago')
    ELSE NULL
  END AS time_status,
  
  -- Duration
  TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time) AS duration_minutes,
  
  -- Check-in Status (for future use)
  NULL AS checked_in_at,
  NULL AS checked_out_at,
  
  -- Timestamps
  ep.created_at AS participant_added_at,
  b.created_at AS booking_created_at

FROM external_participants ep
INNER JOIN external_members em ON ep.member_id = em.id
INNER JOIN bookings b ON ep.booking_id = b.id
LEFT JOIN places p ON b.place_id = p.id
LEFT JOIN users u ON b.responsible_person_id = u.id

WHERE 
  -- Only today's bookings
  DATE(b.booking_date) = CURRENT_DATE
  -- Not deleted
  AND ep.is_deleted = FALSE
  AND em.is_deleted = FALSE
  AND b.is_deleted = FALSE
  -- Active participants
  AND em.is_active = TRUE

ORDER BY 
  b.start_time ASC,
  em.full_name ASC;

-- =====================================================
-- 2. TODAY'S VISITORS SUMMARY VIEW
-- =====================================================
-- Aggregated statistics for today
CREATE OR REPLACE VIEW `v_todays_visitors_summary` AS
SELECT 
  CURRENT_DATE AS report_date,
  COUNT(DISTINCT em.id) AS total_unique_visitors,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(*) AS total_visitor_entries,
  
  -- By Status
  SUM(CASE WHEN b.status = 'upcoming' THEN 1 ELSE 0 END) AS upcoming_count,
  SUM(CASE WHEN b.status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing_count,
  SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
  
  -- By Company
  COUNT(DISTINCT em.company_name) AS total_companies,
  
  -- Blacklisted Warnings
  SUM(CASE WHEN em.is_blacklisted = TRUE THEN 1 ELSE 0 END) AS blacklisted_visitors_count,
  
  -- Time Ranges
  MIN(b.start_time) AS earliest_visit,
  MAX(b.end_time) AS latest_visit,
  
  -- VIP/Important Visitors (based on visit count)
  SUM(CASE WHEN em.visit_count >= 10 THEN 1 ELSE 0 END) AS frequent_visitors_count

FROM external_participants ep
INNER JOIN external_members em ON ep.member_id = em.id
INNER JOIN bookings b ON ep.booking_id = b.id

WHERE 
  DATE(b.booking_date) = CURRENT_DATE
  AND ep.is_deleted = FALSE
  AND em.is_deleted = FALSE
  AND b.is_deleted = FALSE;

-- =====================================================
-- 3. TODAY'S VISITORS BY PLACE VIEW
-- =====================================================
-- Grouped by location for security checkpoints
CREATE OR REPLACE VIEW `v_todays_visitors_by_place` AS
SELECT 
  p.id AS place_id,
  p.name AS place_name,
  p.city AS place_city,
  COUNT(DISTINCT em.id) AS unique_visitors,
  COUNT(DISTINCT b.id) AS total_bookings,
  
  -- Current Status
  SUM(CASE 
    WHEN b.booking_date = CURRENT_DATE 
    AND CURRENT_TIME BETWEEN b.start_time AND b.end_time 
    AND b.status = 'ongoing'
    THEN 1 ELSE 0 
  END) AS currently_active,
  
  SUM(CASE 
    WHEN b.booking_date = CURRENT_DATE 
    AND CURRENT_TIME < b.start_time 
    AND b.status NOT IN ('cancelled', 'completed')
    THEN 1 ELSE 0 
  END) AS expected_arrivals,
  
  -- Time Slots
  MIN(b.start_time) AS first_visit_time,
  MAX(b.end_time) AS last_visit_time,
  
  -- Visitor Details (comma-separated)
  GROUP_CONCAT(
    DISTINCT em.full_name 
    ORDER BY b.start_time 
    SEPARATOR ', '
  ) AS visitor_names

FROM bookings b
INNER JOIN external_participants ep ON b.id = ep.booking_id
INNER JOIN external_members em ON ep.member_id = em.id
INNER JOIN places p ON b.place_id = p.id

WHERE 
  DATE(b.booking_date) = CURRENT_DATE
  AND ep.is_deleted = FALSE
  AND em.is_deleted = FALSE
  AND b.is_deleted = FALSE
  AND p.is_deleted = FALSE

GROUP BY p.id, p.name, p.city
ORDER BY first_visit_time ASC;

-- =====================================================
-- 4. TODAY'S VISITORS BY TIME SLOT VIEW
-- =====================================================
-- Hourly breakdown for capacity planning
CREATE OR REPLACE VIEW `v_todays_visitors_by_hour` AS
SELECT 
  HOUR(b.start_time) AS hour_slot,
  CONCAT(
    LPAD(HOUR(b.start_time), 2, '0'), ':00 - ',
    LPAD(HOUR(b.start_time) + 1, 2, '0'), ':00'
  ) AS time_range,
  COUNT(DISTINCT em.id) AS unique_visitors,
  COUNT(DISTINCT b.id) AS total_bookings,
  
  -- Status Breakdown
  SUM(CASE WHEN b.status = 'upcoming' THEN 1 ELSE 0 END) AS upcoming,
  SUM(CASE WHEN b.status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing,
  SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed,
  
  GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS places

FROM bookings b
INNER JOIN external_participants ep ON b.id = ep.booking_id
INNER JOIN external_members em ON ep.member_id = em.id
LEFT JOIN places p ON b.place_id = p.id

WHERE 
  DATE(b.booking_date) = CURRENT_DATE
  AND ep.is_deleted = FALSE
  AND em.is_deleted = FALSE
  AND b.is_deleted = FALSE

GROUP BY HOUR(b.start_time)
ORDER BY HOUR(b.start_time) ASC;

-- =====================================================
-- 5. VISITOR CHECK-IN TABLE (Future Enhancement)
-- =====================================================
-- Track actual arrival and departure times
CREATE TABLE IF NOT EXISTS `visitor_check_ins` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `booking_id` VARCHAR(36) NOT NULL,
  `member_id` VARCHAR(36) NOT NULL,
  `check_in_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `check_out_time` TIMESTAMP NULL,
  `checked_in_by` VARCHAR(36), -- Security personnel
  `checked_out_by` VARCHAR(36),
  `actual_arrival_status` ENUM('early', 'on_time', 'late') DEFAULT 'on_time',
  `minutes_difference` INT, -- Negative = early, Positive = late
  `notes` TEXT,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `external_members`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_checkins_booking` (`booking_id`),
  INDEX `idx_checkins_member` (`member_id`),
  INDEX `idx_checkins_date` (`check_in_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. STORED PROCEDURE - Check In Visitor
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_check_in_visitor`(
  IN p_booking_id VARCHAR(36),
  IN p_member_id VARCHAR(36),
  IN p_checked_in_by VARCHAR(36),
  IN p_notes TEXT,
  OUT p_status VARCHAR(20),
  OUT p_minutes_diff INT
)
BEGIN
  DECLARE v_expected_time TIME;
  DECLARE v_actual_time TIME;
  
  -- Get expected start time
  SELECT start_time INTO v_expected_time
  FROM bookings
  WHERE id = p_booking_id;
  
  SET v_actual_time = CURRENT_TIME;
  SET p_minutes_diff = TIMESTAMPDIFF(MINUTE, v_expected_time, v_actual_time);
  
  -- Determine status
  IF p_minutes_diff < -10 THEN
    SET p_status = 'early';
  ELSEIF p_minutes_diff > 10 THEN
    SET p_status = 'late';
  ELSE
    SET p_status = 'on_time';
  END IF;
  
  -- Insert check-in record
  INSERT INTO visitor_check_ins (
    booking_id, member_id, checked_in_by, 
    actual_arrival_status, minutes_difference, notes
  )
  VALUES (
    p_booking_id, p_member_id, p_checked_in_by,
    p_status, p_minutes_diff, p_notes
  );
  
  -- Update booking status to ongoing
  UPDATE bookings 
  SET status = 'ongoing'
  WHERE id = p_booking_id;
END //
DELIMITER ;

-- =====================================================
-- 7. STORED PROCEDURE - Check Out Visitor
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_check_out_visitor`(
  IN p_booking_id VARCHAR(36),
  IN p_member_id VARCHAR(36),
  IN p_checked_out_by VARCHAR(36),
  IN p_notes TEXT
)
BEGIN
  -- Update check-in record with checkout time
  UPDATE visitor_check_ins
  SET 
    check_out_time = CURRENT_TIMESTAMP,
    checked_out_by = p_checked_out_by,
    notes = CONCAT(COALESCE(notes, ''), ' | Checkout: ', COALESCE(p_notes, ''))
  WHERE booking_id = p_booking_id 
    AND member_id = p_member_id
    AND check_out_time IS NULL
    AND is_deleted = FALSE
  ORDER BY check_in_time DESC
  LIMIT 1;
  
  -- Update booking status to completed if all visitors checked out
  UPDATE bookings b
  SET status = 'completed'
  WHERE id = p_booking_id
    AND NOT EXISTS (
      SELECT 1 FROM visitor_check_ins vci
      WHERE vci.booking_id = p_booking_id
        AND vci.check_out_time IS NULL
        AND vci.is_deleted = FALSE
    );
END //
DELIMITER ;

-- =====================================================
-- 8. ENHANCED VIEW WITH CHECK-IN STATUS
-- =====================================================
CREATE OR REPLACE VIEW `v_todays_visitors_with_checkin` AS
SELECT 
  tv.*,
  vci.id AS checkin_id,
  vci.check_in_time,
  vci.check_out_time,
  vci.actual_arrival_status,
  vci.minutes_difference,
  vci.checked_in_by,
  vci.checked_out_by,
  
  -- Check-in Status
  CASE 
    WHEN vci.check_out_time IS NOT NULL THEN 'checked_out'
    WHEN vci.check_in_time IS NOT NULL THEN 'checked_in'
    WHEN tv.current_status = 'ongoing' OR tv.current_status = 'upcoming' THEN 'expected'
    ELSE 'no_show'
  END AS checkin_status,
  
  -- Duration on premises (if checked in but not out)
  CASE 
    WHEN vci.check_in_time IS NOT NULL AND vci.check_out_time IS NULL
    THEN TIMESTAMPDIFF(MINUTE, vci.check_in_time, CURRENT_TIMESTAMP)
    WHEN vci.check_in_time IS NOT NULL AND vci.check_out_time IS NOT NULL
    THEN TIMESTAMPDIFF(MINUTE, vci.check_in_time, vci.check_out_time)
    ELSE NULL
  END AS actual_duration_minutes

FROM v_todays_visitors tv
LEFT JOIN visitor_check_ins vci ON tv.booking_id = vci.booking_id 
  AND tv.member_id = vci.member_id
  AND vci.is_deleted = FALSE;

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================
-- Ensure fast queries on today's data
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
  ON bookings(booking_date, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_external_participants_booking 
  ON external_participants(booking_id, is_deleted);

CREATE INDEX IF NOT EXISTS idx_external_members_active 
  ON external_members(is_active, is_deleted, is_blacklisted);

-- =====================================================
-- END OF TODAY'S VISITORS SQL SCHEMA
-- =====================================================

