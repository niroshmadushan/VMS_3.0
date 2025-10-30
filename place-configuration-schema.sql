-- =====================================================
-- PLACE CONFIGURATION TABLE
-- Manages available days and operating hours for each place
-- =====================================================

-- Create place_configuration table
CREATE TABLE IF NOT EXISTS place_configuration (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    place_id CHAR(36) NOT NULL,
    
    -- Available Days Configuration
    available_monday BOOLEAN DEFAULT true,
    available_tuesday BOOLEAN DEFAULT true,
    available_wednesday BOOLEAN DEFAULT true,
    available_thursday BOOLEAN DEFAULT true,
    available_friday BOOLEAN DEFAULT true,
    available_saturday BOOLEAN DEFAULT false,
    available_sunday BOOLEAN DEFAULT false,
    
    -- Operating Hours
    start_time TIME NOT NULL DEFAULT '08:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    
    -- Additional Settings
    allow_bookings BOOLEAN DEFAULT true,
    max_bookings_per_day INT DEFAULT 10,
    booking_slot_duration INT DEFAULT 60, -- in minutes
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign Key
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    
    -- Unique constraint - one configuration per place
    UNIQUE KEY unique_place_config (place_id),
    
    -- Indexes for better performance
    INDEX idx_place_id (place_id),
    INDEX idx_allow_bookings (allow_bookings),
    INDEX idx_operating_hours (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DUMMY DATA FOR PLACE ID: 7cd9142f-9dad-11f0-9b48-00ff3d223740
-- =====================================================

-- Configuration 1: Regular Office Hours (Mon-Fri, 8 AM - 5 PM)
INSERT INTO place_configuration (
    id,
    place_id,
    available_monday,
    available_tuesday,
    available_wednesday,
    available_thursday,
    available_friday,
    available_saturday,
    available_sunday,
    start_time,
    end_time,
    allow_bookings,
    max_bookings_per_day,
    booking_slot_duration,
    created_by
) VALUES (
    UUID(),
    '7cd9142f-9dad-11f0-9b48-00ff3d223740',
    true,   -- Monday
    true,   -- Tuesday
    true,   -- Wednesday
    true,   -- Thursday
    true,   -- Friday
    false,  -- Saturday
    false,  -- Sunday
    '08:00:00',  -- Start time (8:00 AM)
    '17:00:00',  -- End time (5:00 PM)
    true,   -- Allow bookings
    10,     -- Max 10 bookings per day
    60,     -- 60 minute slots
    'admin'
);

-- =====================================================
-- ADDITIONAL DUMMY CONFIGURATIONS (OPTIONAL)
-- =====================================================

-- Configuration 2: Extended Hours (Mon-Sat, 7 AM - 8 PM)
INSERT INTO place_configuration (
    id,
    place_id,
    available_monday,
    available_tuesday,
    available_wednesday,
    available_thursday,
    available_friday,
    available_saturday,
    available_sunday,
    start_time,
    end_time,
    allow_bookings,
    max_bookings_per_day,
    booking_slot_duration,
    created_by
) VALUES (
    UUID(),
    UUID(), -- Replace with actual place_id if you have another place
    true,   -- Monday
    true,   -- Tuesday
    true,   -- Wednesday
    true,   -- Thursday
    true,   -- Friday
    true,   -- Saturday (available on Saturday)
    false,  -- Sunday
    '07:00:00',  -- Start time (7:00 AM)
    '20:00:00',  -- End time (8:00 PM)
    true,   -- Allow bookings
    15,     -- Max 15 bookings per day
    30,     -- 30 minute slots
    'admin'
);

-- Configuration 3: 24/7 Availability
INSERT INTO place_configuration (
    id,
    place_id,
    available_monday,
    available_tuesday,
    available_wednesday,
    available_thursday,
    available_friday,
    available_saturday,
    available_sunday,
    start_time,
    end_time,
    allow_bookings,
    max_bookings_per_day,
    booking_slot_duration,
    created_by
) VALUES (
    UUID(),
    UUID(), -- Replace with actual place_id if you have another place
    true,   -- Monday
    true,   -- Tuesday
    true,   -- Wednesday
    true,   -- Thursday
    true,   -- Friday
    true,   -- Saturday
    true,   -- Sunday (available 7 days)
    '00:00:00',  -- Start time (midnight)
    '23:59:59',  -- End time (11:59 PM)
    true,   -- Allow bookings
    20,     -- Max 20 bookings per day
    120,    -- 2 hour slots
    'admin'
);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View to get places with their configuration
CREATE OR REPLACE VIEW places_with_config AS
SELECT 
    p.id as place_id,
    p.name as place_name,
    p.description,
    p.city,
    p.state,
    p.place_type,
    p.capacity,
    p.is_active,
    
    -- Configuration details
    pc.available_monday,
    pc.available_tuesday,
    pc.available_wednesday,
    pc.available_thursday,
    pc.available_friday,
    pc.available_saturday,
    pc.available_sunday,
    pc.start_time,
    pc.end_time,
    pc.allow_bookings,
    pc.max_bookings_per_day,
    pc.booking_slot_duration,
    
    -- Calculated fields
    CONCAT(
        TIME_FORMAT(pc.start_time, '%h:%i %p'), 
        ' - ', 
        TIME_FORMAT(pc.end_time, '%h:%i %p')
    ) as operating_hours,
    
    CASE 
        WHEN pc.available_monday AND pc.available_tuesday AND pc.available_wednesday 
             AND pc.available_thursday AND pc.available_friday 
             AND NOT pc.available_saturday AND NOT pc.available_sunday 
        THEN 'Weekdays Only'
        WHEN pc.available_monday AND pc.available_tuesday AND pc.available_wednesday 
             AND pc.available_thursday AND pc.available_friday 
             AND pc.available_saturday AND pc.available_sunday 
        THEN '24/7 Available'
        ELSE 'Custom Schedule'
    END as schedule_type
    
FROM places p
LEFT JOIN place_configuration pc ON p.id = pc.place_id
WHERE p.is_active = true;

-- =====================================================
-- FUNCTION: Get Available Days as Array
-- =====================================================

DELIMITER $$

CREATE FUNCTION get_available_days(config_id CHAR(36))
RETURNS JSON
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_ARRAYAGG(day_name) INTO result
    FROM (
        SELECT 'Monday' as day_name FROM place_configuration 
        WHERE id = config_id AND available_monday = true
        UNION ALL
        SELECT 'Tuesday' FROM place_configuration 
        WHERE id = config_id AND available_tuesday = true
        UNION ALL
        SELECT 'Wednesday' FROM place_configuration 
        WHERE id = config_id AND available_wednesday = true
        UNION ALL
        SELECT 'Thursday' FROM place_configuration 
        WHERE id = config_id AND available_thursday = true
        UNION ALL
        SELECT 'Friday' FROM place_configuration 
        WHERE id = config_id AND available_friday = true
        UNION ALL
        SELECT 'Saturday' FROM place_configuration 
        WHERE id = config_id AND available_saturday = true
        UNION ALL
        SELECT 'Sunday' FROM place_configuration 
        WHERE id = config_id AND available_sunday = true
    ) as days;
    
    RETURN result;
END$$

DELIMITER ;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all places with their configuration
-- SELECT * FROM places_with_config;

-- Get configuration for specific place
-- SELECT * FROM place_configuration WHERE place_id = '7cd9142f-9dad-11f0-9b48-00ff3d223740';

-- Get available days for a place
-- SELECT get_available_days(id) as available_days FROM place_configuration WHERE place_id = '7cd9142f-9dad-11f0-9b48-00ff3d223740';

-- Update configuration
-- UPDATE place_configuration 
-- SET available_saturday = true, end_time = '18:00:00'
-- WHERE place_id = '7cd9142f-9dad-11f0-9b48-00ff3d223740';

-- =====================================================
-- NOTES
-- =====================================================

/*
1. Each place can have ONE configuration
2. Available days are stored as individual boolean columns for easy filtering
3. Operating hours define when bookings can be made (e.g., 8:00 AM to 5:00 PM)
4. Booking slot duration defines how long each meeting slot is
5. max_bookings_per_day limits total bookings per day
6. The view 'places_with_config' joins places with their configuration for easy access
7. The function 'get_available_days' returns available days as a JSON array
*/
