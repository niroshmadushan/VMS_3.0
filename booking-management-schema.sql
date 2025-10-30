-- =====================================================
-- BOOKING MANAGEMENT SYSTEM - COMPLETE SQL SCHEMA
-- MySQL Database Schema for Meeting/Session Bookings
-- =====================================================

-- Set database collation to ensure consistency

-- =====================================================
-- 1. PLACES TABLE (Meeting locations)
-- =====================================================

CREATE TABLE IF NOT EXISTS places (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    place_type ENUM('conference_room', 'office', 'hall', 'virtual') NOT NULL,
    capacity INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. PLACE CONFIGURATION TABLE (Operating hours and availability)
-- =====================================================

CREATE TABLE IF NOT EXISTS place_configuration (
    id CHAR(36) PRIMARY KEY,
    place_id CHAR(36) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    allow_bookings TINYINT(1) DEFAULT 1,
    available_monday TINYINT(1) DEFAULT 1,
    available_tuesday TINYINT(1) DEFAULT 1,
    available_wednesday TINYINT(1) DEFAULT 1,
    available_thursday TINYINT(1) DEFAULT 1,
    available_friday TINYINT(1) DEFAULT 1,
    available_saturday TINYINT(1) DEFAULT 0,
    available_sunday TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_place_id (place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. BOOKINGS TABLE (Main booking records)
-- =====================================================

CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    place_id CHAR(36) NOT NULL,
    place_name VARCHAR(255),
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'in_progress') DEFAULT 'pending',
    responsible_person_id VARCHAR(255),
    responsible_person_name VARCHAR(255),
    responsible_person_email VARCHAR(255),
    total_participants INT DEFAULT 0,
    internal_participants INT DEFAULT 0,
    external_participants INT DEFAULT 0,
    refreshments_required TINYINT(1) DEFAULT 0,
    refreshments_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(255),
    cancelled_at TIMESTAMP NULL,
    cancelled_by VARCHAR(255),
    cancellation_reason TEXT,
    INDEX idx_booking_date (booking_date),
    INDEX idx_place_id (place_id),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_date_time (booking_date, start_time, end_time),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. BOOKING PARTICIPANTS TABLE (Internal Employees)
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_participants (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    employee_id VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255),
    employee_department VARCHAR(255),
    employee_role VARCHAR(255),
    employee_phone VARCHAR(255),
    participation_status ENUM('invited', 'confirmed', 'declined', 'attended', 'absent') DEFAULT 'invited',
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_participation_status (participation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. EXTERNAL PARTICIPANTS TABLE (Visitors/Guests)
-- =====================================================

CREATE TABLE IF NOT EXISTS external_participants (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    reference_type ENUM('NIC', 'Passport', 'Employee ID', 'Driver License', 'Other') NOT NULL,
    reference_value VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    company_position VARCHAR(255),
    participation_status ENUM('invited', 'confirmed', 'checked_in', 'checked_out', 'no_show') DEFAULT 'invited',
    checked_in_at TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    visitor_pass_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_reference (reference_type, reference_value),
    INDEX idx_email (email),
    INDEX idx_participation_status (participation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. BOOKING REFRESHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_refreshments (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    refreshment_type ENUM('beverages', 'snacks', 'meals', 'full_catering', 'custom') NOT NULL,
    items JSON NOT NULL,
    serving_time TIME,
    estimated_count INT,
    special_requests TEXT,
    status ENUM('pending', 'confirmed', 'prepared', 'served', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. BOOKING HISTORY/AUDIT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_history (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    action ENUM('created', 'updated', 'cancelled', 'confirmed', 'completed', 'deleted') NOT NULL,
    changed_field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_description TEXT,
    changed_by VARCHAR(255),
    changed_by_role VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_action (action),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View: Bookings with full details
CREATE OR REPLACE VIEW bookings_with_details AS
SELECT 
    b.id,
    b.title,
    b.description,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.place_id,
    b.place_name,
    b.status,
    b.responsible_person_name,
    b.responsible_person_email,
    b.total_participants,
    b.internal_participants,
    b.external_participants,
    b.refreshments_required,
    b.created_at,
    b.created_by,
    p.name AS current_place_name,
    p.city AS place_city,
    p.place_type,
    p.capacity AS place_capacity,
    p.is_active AS place_is_active,
    pc.start_time AS place_start_time,
    pc.end_time AS place_end_time,
    pc.allow_bookings AS place_allow_bookings,
    CONCAT(DATE_FORMAT(b.start_time, '%h:%i %p'), ' - ', DATE_FORMAT(b.end_time, '%h:%i %p')) AS time_range,
    TIMEDIFF(b.end_time, b.start_time) AS duration,
    DAYNAME(b.booking_date) AS day_of_week
FROM bookings b
LEFT JOIN places p ON b.place_id = p.id
LEFT JOIN place_configuration pc ON p.id = pc.place_id
WHERE b.is_deleted = FALSE;

-- View: Today's bookings
CREATE OR REPLACE VIEW todays_bookings AS
SELECT *
FROM bookings_with_details
WHERE booking_date = CURDATE()
ORDER BY start_time;

-- View: Upcoming bookings
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT *
FROM bookings_with_details
WHERE booking_date >= CURDATE()
  AND status NOT IN ('cancelled', 'completed')
ORDER BY booking_date, start_time;

-- View: Active bookings (currently in progress)
CREATE OR REPLACE VIEW active_bookings AS
SELECT *
FROM bookings_with_details
WHERE booking_date = CURDATE()
  AND status = 'in_progress'
  AND CURTIME() BETWEEN start_time AND end_time;

-- =====================================================
-- 9. STORED PROCEDURES
-- =====================================================

DELIMITER $$

-- Check if a place is available for booking
CREATE PROCEDURE check_place_availability(
    IN p_place_id CHAR(36),
    IN p_booking_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    OUT p_is_available BOOLEAN,
    OUT p_conflict_message VARCHAR(500)
)
BEGIN
    DECLARE v_day_of_week VARCHAR(20);
    DECLARE v_is_active BOOLEAN;
    DECLARE v_allow_bookings BOOLEAN;
    DECLARE v_day_available BOOLEAN;
    DECLARE v_config_start TIME;
    DECLARE v_config_end TIME;
    DECLARE v_conflict_count INT;
    
    -- Get day of week
    SET v_day_of_week = LOWER(DAYNAME(p_booking_date));
    
    -- Check if place is active
    SELECT is_active INTO v_is_active FROM places WHERE id = p_place_id;
    IF v_is_active IS NULL OR v_is_active = FALSE THEN
        SET p_is_available = FALSE;
        SET p_conflict_message = 'Place is not active';
        SELECT p_is_available, p_conflict_message;
    ELSE
        -- Check configuration
        SELECT 
            allow_bookings,
            start_time,
            end_time,
            CASE v_day_of_week
                WHEN 'monday' THEN available_monday
                WHEN 'tuesday' THEN available_tuesday
                WHEN 'wednesday' THEN available_wednesday
                WHEN 'thursday' THEN available_thursday
                WHEN 'friday' THEN available_friday
                WHEN 'saturday' THEN available_saturday
                WHEN 'sunday' THEN available_sunday
            END
        INTO v_allow_bookings, v_config_start, v_config_end, v_day_available
        FROM place_configuration
        WHERE place_id = p_place_id;
        
        IF v_allow_bookings IS NULL OR v_allow_bookings = FALSE THEN
            SET p_is_available = FALSE;
            SET p_conflict_message = 'Bookings are not allowed for this place';
            SELECT p_is_available, p_conflict_message;
        ELSEIF v_day_available IS NULL OR v_day_available = FALSE THEN
            SET p_is_available = FALSE;
            SET p_conflict_message = CONCAT('Place is not available on ', DAYNAME(p_booking_date));
            SELECT p_is_available, p_conflict_message;
        ELSEIF p_start_time < v_config_start OR p_end_time > v_config_end THEN
            SET p_is_available = FALSE;
            SET p_conflict_message = CONCAT('Time must be between ', v_config_start, ' and ', v_config_end);
            SELECT p_is_available, p_conflict_message;
        ELSE
            -- Check for time conflicts with existing bookings
            SELECT COUNT(*) INTO v_conflict_count
            FROM bookings
            WHERE place_id = p_place_id
              AND booking_date = p_booking_date
              AND is_deleted = FALSE
              AND status NOT IN ('cancelled')
              AND (
                  (p_start_time >= start_time AND p_start_time < end_time) OR
                  (p_end_time > start_time AND p_end_time <= end_time) OR
                  (p_start_time <= start_time AND p_end_time >= end_time)
              );
            
            IF v_conflict_count > 0 THEN
                SET p_is_available = FALSE;
                SET p_conflict_message = 'This time slot conflicts with an existing booking';
                SELECT p_is_available, p_conflict_message;
            ELSE
                -- All checks passed
                SET p_is_available = TRUE;
                SET p_conflict_message = 'Place is available';
                SELECT p_is_available, p_conflict_message;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

DELIMITER $$

-- Trigger: Update total_participants count (Internal Participants)
CREATE TRIGGER update_participant_count_insert
AFTER INSERT ON booking_participants
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET internal_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = NEW.booking_id
    ),
    total_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = NEW.booking_id
    ) + (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = NEW.booking_id
    )
    WHERE id = NEW.booking_id;
END$$

CREATE TRIGGER update_participant_count_delete
AFTER DELETE ON booking_participants
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET internal_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = OLD.booking_id
    ),
    total_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = OLD.booking_id
    ) + (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = OLD.booking_id
    )
    WHERE id = OLD.booking_id;
END$$

-- Trigger: Update total_participants count (External Participants)
CREATE TRIGGER update_external_participant_count_insert
AFTER INSERT ON external_participants
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET external_participants = (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = NEW.booking_id
    ),
    total_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = NEW.booking_id
    ) + (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = NEW.booking_id
    )
    WHERE id = NEW.booking_id;
END$$

CREATE TRIGGER update_external_participant_count_delete
AFTER DELETE ON external_participants
FOR EACH ROW
BEGIN
    UPDATE bookings
    SET external_participants = (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = OLD.booking_id
    ),
    total_participants = (
        SELECT COUNT(*) FROM booking_participants WHERE booking_id = OLD.booking_id
    ) + (
        SELECT COUNT(*) FROM external_participants WHERE booking_id = OLD.booking_id
    )
    WHERE id = OLD.booking_id;
END$$

-- Trigger: Log booking history on update
CREATE TRIGGER booking_history_on_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO booking_history (
            id, booking_id, action, changed_field, old_value, new_value, 
            change_description, changed_by, changed_by_role
        ) VALUES (
            UUID(), NEW.id, 'updated', 'status', OLD.status, NEW.status,
            CONCAT('Status changed from ', OLD.status, ' to ', NEW.status),
            NEW.updated_by, 'system'
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 11. DUMMY DATA FOR TESTING
-- =====================================================

-- Insert sample places
INSERT INTO places (
    id, name, city, place_type, capacity, is_active
) VALUES 
(
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    'Main Office',
    'New York',
    'conference_room',
    20,
    1
);

-- Insert sample place configuration
INSERT INTO place_configuration (
    id, place_id, start_time, end_time, allow_bookings,
    available_monday, available_tuesday, available_wednesday,
    available_thursday, available_friday, available_saturday, available_sunday
) VALUES 
(
    '8de9253g-0ebe-12g1-0c59-11gg4e334851',
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    '08:00:00',
    '18:00:00',
    1,
    1, 1, 1, 1, 1, 0, 0
);

-- Insert sample bookings
INSERT INTO bookings (
    id, title, description, booking_date, start_time, end_time,
    place_id, place_name, status, responsible_person_id,
    responsible_person_name, responsible_person_email,
    refreshments_required, created_by
) VALUES 
(
    'booking-001-2024-01-15-001',
    'Weekly Team Meeting',
    'Regular team sync and updates',
    CURDATE() + INTERVAL 1 DAY,
    '09:00:00',
    '10:00:00',
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    'Main Office',
    'confirmed',
    'emp-001',
    'John Manager',
    'john.manager@company.com',
    1,
    'admin'
),
(
    'booking-002-2024-01-16-001',
    'Client Presentation',
    'Product demo for potential client',
    CURDATE() + INTERVAL 2 DAY,
    '14:00:00',
    '16:00:00',
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    'Main Office',
    'pending',
    'emp-002',
    'Sarah Sales',
    'sarah.sales@company.com',
    1,
    'admin'
),
(
    'booking-003-2024-01-22-001',
    'Project Review',
    'Monthly project status review',
    CURDATE() + INTERVAL 7 DAY,
    '10:00:00',
    '12:00:00',
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    'Main Office',
    'confirmed',
    'emp-003',
    'Mike Director',
    'mike.director@company.com',
    0,
    'admin'
);

-- =====================================================
-- 12. USEFUL QUERIES
-- =====================================================

-- Get all bookings for a specific date
-- SELECT * FROM bookings_with_details WHERE booking_date = '2024-01-15';

-- Get all bookings for a specific place
-- SELECT * FROM bookings_with_details WHERE place_id = '7cd9142f-9dad-11f0-9b48-00ff3d223740';

-- Check place availability
-- CALL check_place_availability('7cd9142f-9dad-11f0-9b48-00ff3d223740', '2024-01-15', '09:00:00', '10:00:00', @available, @message);
-- SELECT @available, @message;

-- Get bookings with participant counts
-- SELECT b.*, 
--        (SELECT COUNT(*) FROM booking_participants WHERE booking_id = b.id) AS internal_count,
--        (SELECT COUNT(*) FROM external_participants WHERE booking_id = b.id) AS external_count
-- FROM bookings b WHERE b.is_deleted = FALSE;

-- Get today's active bookings
-- SELECT * FROM active_bookings;

-- Get upcoming bookings
-- SELECT * FROM upcoming_bookings LIMIT 10;

-- =====================================================
-- 13. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_booking_date_status ON bookings(booking_date, status);
CREATE INDEX idx_place_date ON bookings(place_id, booking_date);
CREATE INDEX idx_status_date ON bookings(status, booking_date);

-- =====================================================
-- NOTES
-- =====================================================

/*
1. SOFT DELETE: Records are never physically deleted, only marked with is_deleted = TRUE
2. AUDIT TRAIL: All changes tracked in booking_history table
3. PARTICIPANT COUNTS: Automatically updated via triggers
4. TIME CONFLICT DETECTION: Stored procedure checks for overlapping bookings
5. PLACE VALIDATION: Checks place is active, allows bookings, and available on selected day
6. REFRESHMENTS: Stored as JSON in bookings table and detailed in booking_refreshments table
7. STATUS FLOW: pending → confirmed → in_progress → completed
8. CANCELLATION: Preserves data with cancellation reason and timestamp

TABLES CREATED:
- places (meeting locations)
- place_configuration (operating hours and availability)
- bookings (main booking records)
- booking_participants (internal employees)
- external_participants (visitors/guests)
- booking_refreshments (refreshment details)
- booking_history (audit log)

VIEWS CREATED:
- bookings_with_details (complete booking information)
- todays_bookings (today's schedule)
- upcoming_bookings (future bookings)
- active_bookings (currently in progress)

STORED PROCEDURES:
- check_place_availability() (validates booking possibility)

TRIGGERS:
- Auto-update participant counts
- Log status changes
*/