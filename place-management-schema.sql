-- =====================================================
-- PLACE MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This script creates a comprehensive place management system
-- with visitor tracking, deactivation reasons, and audit trails

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PLACES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Place Details
    place_type VARCHAR(50) NOT NULL DEFAULT 'office', -- office, warehouse, factory, retail, etc.
    capacity INTEGER,
    area_sqft DECIMAL(10, 2),
    
    -- Status Management
    is_active BOOLEAN NOT NULL DEFAULT true,
    deactivation_reason TEXT,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT chk_place_type CHECK (place_type IN ('office', 'warehouse', 'factory', 'retail', 'hospital', 'school', 'government', 'other')),
    CONSTRAINT chk_capacity CHECK (capacity > 0),
    CONSTRAINT chk_area CHECK (area_sqft > 0),
    CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 2. PLACE DEACTIVATION REASONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS place_deactivation_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    reason_type VARCHAR(50) NOT NULL,
    reason_description TEXT NOT NULL,
    deactivated_by UUID NOT NULL,
    deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Details
    estimated_reactivation_date DATE,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_reason_type CHECK (reason_type IN (
        'maintenance', 'renovation', 'safety_concern', 'legal_issue', 
        'financial', 'operational', 'emergency', 'scheduled_closure', 
        'equipment_failure', 'staff_shortage', 'other'
    )),
    CONSTRAINT chk_contact_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL)
);

-- =====================================================
-- 3. VISITORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    designation VARCHAR(255),
    
    -- Identification
    id_type VARCHAR(50), -- passport, driver_license, national_id, etc.
    id_number VARCHAR(100),
    id_issuing_authority VARCHAR(255),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(100),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMP WITH TIME ZONE,
    blacklisted_by UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_visitor_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
    CONSTRAINT chk_id_type CHECK (id_type IN ('passport', 'driver_license', 'national_id', 'company_id', 'other') OR id_type IS NULL)
);

-- =====================================================
-- 4. VISITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    
    -- Visit Details
    visit_purpose VARCHAR(255) NOT NULL,
    host_employee_id UUID, -- Reference to employee who is hosting
    host_name VARCHAR(255),
    host_department VARCHAR(100),
    host_phone VARCHAR(20),
    host_email VARCHAR(255),
    
    -- Timing
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Status
    visit_status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Security
    badge_number VARCHAR(50),
    access_level VARCHAR(50) DEFAULT 'standard', -- standard, restricted, vip, contractor
    security_clearance_level VARCHAR(50),
    
    -- Additional Information
    notes TEXT,
    special_requirements TEXT,
    vehicle_plate VARCHAR(20),
    vehicle_model VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT chk_visit_status CHECK (visit_status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT chk_access_level CHECK (access_level IN ('standard', 'restricted', 'vip', 'contractor', 'emergency')),
    CONSTRAINT chk_host_email CHECK (host_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR host_email IS NULL),
    CONSTRAINT chk_scheduled_times CHECK (scheduled_end_time > scheduled_start_time),
    CONSTRAINT chk_actual_times CHECK (actual_end_time IS NULL OR actual_end_time > actual_start_time)
);

-- =====================================================
-- 5. VISIT CANCELLATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS visit_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    
    -- Cancellation Details
    cancellation_reason VARCHAR(100) NOT NULL,
    cancellation_description TEXT,
    cancelled_by UUID NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Notification
    visitor_notified BOOLEAN DEFAULT false,
    host_notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Rescheduling
    can_be_rescheduled BOOLEAN DEFAULT true,
    rescheduled_to TIMESTAMP WITH TIME ZONE,
    rescheduled_by UUID,
    
    -- Constraints
    CONSTRAINT chk_cancellation_reason CHECK (cancellation_reason IN (
        'visitor_cancelled', 'host_cancelled', 'place_unavailable', 'security_concern',
        'emergency', 'weather', 'transportation', 'health_issue', 'other'
    ))
);

-- =====================================================
-- 6. PLACE ACCESS LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS place_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    
    -- Access Details
    access_type VARCHAR(50) NOT NULL, -- entry, exit, restricted_area, emergency_exit
    access_point VARCHAR(100), -- main_entrance, side_door, parking, etc.
    access_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Security
    badge_scanned BOOLEAN DEFAULT false,
    security_verified BOOLEAN DEFAULT false,
    security_officer_id UUID,
    
    -- Additional Info
    notes TEXT,
    temperature_check DECIMAL(4, 1), -- For health screening
    health_screening_passed BOOLEAN,
    
    -- Constraints
    CONSTRAINT chk_access_type CHECK (access_type IN ('entry', 'exit', 'restricted_area', 'emergency_exit', 'maintenance')),
    CONSTRAINT chk_temperature CHECK (temperature_check BETWEEN 35.0 AND 42.0 OR temperature_check IS NULL)
);

-- =====================================================
-- 7. PLACE NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS place_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Recipients
    target_audience VARCHAR(50) NOT NULL, -- all, employees, visitors, security, management
    recipient_emails TEXT[], -- Array of email addresses
    
    -- Status
    is_sent BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_notification_type CHECK (notification_type IN (
        'place_closure', 'maintenance', 'security_alert', 'emergency', 
        'scheduled_event', 'policy_update', 'system_maintenance', 'other'
    )),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT chk_target_audience CHECK (target_audience IN ('all', 'employees', 'visitors', 'security', 'management'))
);

-- =====================================================
-- 8. PLACE STATISTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS place_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    
    -- Date Range
    date DATE NOT NULL,
    
    -- Visitor Statistics
    total_visitors INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    completed_visits INTEGER DEFAULT 0,
    cancelled_visits INTEGER DEFAULT 0,
    no_show_visits INTEGER DEFAULT 0,
    
    -- Time Statistics
    avg_visit_duration_minutes INTEGER DEFAULT 0,
    peak_hour INTEGER, -- Hour of day (0-23)
    
    -- Capacity Statistics
    max_capacity_used INTEGER DEFAULT 0,
    avg_capacity_used INTEGER DEFAULT 0,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_peak_hour CHECK (peak_hour BETWEEN 0 AND 23 OR peak_hour IS NULL),
    CONSTRAINT chk_visitor_counts CHECK (total_visitors >= 0 AND unique_visitors >= 0),
    CONSTRAINT chk_visit_counts CHECK (completed_visits >= 0 AND cancelled_visits >= 0 AND no_show_visits >= 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Places indexes
CREATE INDEX IF NOT EXISTS idx_places_active ON places(is_active);
CREATE INDEX IF NOT EXISTS idx_places_type ON places(place_type);
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at);

-- Visitors indexes
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_company ON visitors(company);
CREATE INDEX IF NOT EXISTS idx_visitors_active ON visitors(is_active);
CREATE INDEX IF NOT EXISTS idx_visitors_blacklisted ON visitors(is_blacklisted);

-- Visits indexes
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_place_id ON visits(place_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_start ON visits(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_visits_check_in ON visits(check_in_time);
CREATE INDEX IF NOT EXISTS idx_visits_check_out ON visits(check_out_time);

-- Access logs indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_visit_id ON place_access_logs(visit_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_place_id ON place_access_logs(place_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_time ON place_access_logs(access_time);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_type ON place_access_logs(access_type);

-- Statistics indexes
CREATE INDEX IF NOT EXISTS idx_place_stats_place_id ON place_statistics(place_id);
CREATE INDEX IF NOT EXISTS idx_place_stats_date ON place_statistics(date);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to deactivate a place with reason
CREATE OR REPLACE FUNCTION deactivate_place(
    p_place_id UUID,
    p_reason_type VARCHAR(50),
    p_reason_description TEXT,
    p_deactivated_by UUID,
    p_estimated_reactivation_date DATE DEFAULT NULL,
    p_contact_person VARCHAR(255) DEFAULT NULL,
    p_contact_phone VARCHAR(20) DEFAULT NULL,
    p_contact_email VARCHAR(255) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update place status
    UPDATE places 
    SET 
        is_active = false,
        deactivated_at = CURRENT_TIMESTAMP,
        deactivated_by = p_deactivated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_place_id;
    
    -- Insert deactivation reason
    INSERT INTO place_deactivation_reasons (
        place_id, reason_type, reason_description, deactivated_by,
        estimated_reactivation_date, contact_person, contact_phone, contact_email
    ) VALUES (
        p_place_id, p_reason_type, p_reason_description, p_deactivated_by,
        p_estimated_reactivation_date, p_contact_person, p_contact_phone, p_contact_email
    );
    
    -- Cancel all future visits to this place
    UPDATE visits 
    SET 
        visit_status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE place_id = p_place_id 
    AND visit_status IN ('scheduled', 'in_progress')
    AND scheduled_start_time > CURRENT_TIMESTAMP;
    
    -- Insert cancellation records
    INSERT INTO visit_cancellations (visit_id, cancellation_reason, cancellation_description, cancelled_by)
    SELECT 
        id, 
        'place_unavailable', 
        'Place deactivated: ' || p_reason_description,
        p_deactivated_by
    FROM visits 
    WHERE place_id = p_place_id 
    AND visit_status = 'cancelled'
    AND scheduled_start_time > CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reactivate a place
CREATE OR REPLACE FUNCTION reactivate_place(
    p_place_id UUID,
    p_reactivated_by UUID,
    p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update place status
    UPDATE places 
    SET 
        is_active = true,
        deactivation_reason = NULL,
        deactivated_at = NULL,
        deactivated_by = NULL,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_reactivated_by
    WHERE id = p_place_id;
    
    -- Update deactivation reason as resolved
    UPDATE place_deactivation_reasons 
    SET 
        is_resolved = true,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = p_reactivated_by,
        resolution_notes = p_resolution_notes
    WHERE place_id = p_place_id 
    AND is_resolved = false;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get place status with deactivation info
CREATE OR REPLACE FUNCTION get_place_status(p_place_id UUID)
RETURNS TABLE (
    place_id UUID,
    place_name VARCHAR(255),
    is_active BOOLEAN,
    deactivation_reason TEXT,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by UUID,
    reason_type VARCHAR(50),
    reason_description TEXT,
    estimated_reactivation_date DATE,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.is_active,
        p.deactivation_reason,
        p.deactivated_at,
        p.deactivated_by,
        pdr.reason_type,
        pdr.reason_description,
        pdr.estimated_reactivation_date,
        pdr.contact_person,
        pdr.contact_phone,
        pdr.contact_email
    FROM places p
    LEFT JOIN place_deactivation_reasons pdr ON p.id = pdr.place_id AND pdr.is_resolved = false
    WHERE p.id = p_place_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active places with basic info
CREATE OR REPLACE VIEW active_places AS
SELECT 
    id,
    name,
    description,
    address,
    city,
    state,
    country,
    place_type,
    capacity,
    area_sqft,
    phone,
    email,
    created_at
FROM places 
WHERE is_active = true;

-- View for deactivated places with reasons
CREATE OR REPLACE VIEW deactivated_places AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.address,
    p.city,
    p.state,
    p.place_type,
    p.deactivated_at,
    p.deactivated_by,
    pdr.reason_type,
    pdr.reason_description,
    pdr.estimated_reactivation_date,
    pdr.contact_person,
    pdr.contact_phone,
    pdr.contact_email,
    pdr.is_resolved
FROM places p
JOIN place_deactivation_reasons pdr ON p.id = pdr.place_id
WHERE p.is_active = false;

-- View for today's visits
CREATE OR REPLACE VIEW todays_visits AS
SELECT 
    v.id,
    v.visitor_id,
    vis.first_name,
    vis.last_name,
    vis.company,
    v.place_id,
    p.name as place_name,
    v.visit_purpose,
    v.host_name,
    v.scheduled_start_time,
    v.scheduled_end_time,
    v.actual_start_time,
    v.actual_end_time,
    v.visit_status,
    v.check_in_time,
    v.check_out_time
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN places p ON v.place_id = p.id
WHERE DATE(v.scheduled_start_time) = CURRENT_DATE
ORDER BY v.scheduled_start_time;

-- View for place statistics summary
CREATE OR REPLACE VIEW place_statistics_summary AS
SELECT 
    p.id as place_id,
    p.name as place_name,
    p.place_type,
    p.capacity,
    COUNT(DISTINCT v.id) as total_visits,
    COUNT(DISTINCT CASE WHEN v.visit_status = 'completed' THEN v.id END) as completed_visits,
    COUNT(DISTINCT CASE WHEN v.visit_status = 'cancelled' THEN v.id END) as cancelled_visits,
    COUNT(DISTINCT CASE WHEN v.visit_status = 'no_show' THEN v.id END) as no_show_visits,
    AVG(EXTRACT(EPOCH FROM (v.actual_end_time - v.actual_start_time))/60) as avg_duration_minutes
FROM places p
LEFT JOIN visits v ON p.id = v.place_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.place_type, p.capacity;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample places
INSERT INTO places (id, name, description, address, city, state, country, place_type, capacity, area_sqft, phone, email, created_by) VALUES
(uuid_generate_v4(), 'Main Office Building', 'Primary corporate headquarters', '123 Business Ave', 'New York', 'NY', 'USA', 'office', 500, 50000.00, '+1-555-0101', 'main@company.com', uuid_generate_v4()),
(uuid_generate_v4(), 'Warehouse Facility', 'Distribution and storage center', '456 Industrial Blvd', 'Chicago', 'IL', 'USA', 'warehouse', 200, 100000.00, '+1-555-0102', 'warehouse@company.com', uuid_generate_v4()),
(uuid_generate_v4(), 'Research Lab', 'Research and development facility', '789 Science Park', 'San Francisco', 'CA', 'USA', 'office', 100, 25000.00, '+1-555-0103', 'research@company.com', uuid_generate_v4());

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE places IS 'Stores information about physical locations/places';
COMMENT ON TABLE place_deactivation_reasons IS 'Tracks reasons and details when places are deactivated';
COMMENT ON TABLE visitors IS 'Stores visitor information and blacklist status';
COMMENT ON TABLE visits IS 'Tracks individual visits to places';
COMMENT ON TABLE visit_cancellations IS 'Records cancellation details for visits';
COMMENT ON TABLE place_access_logs IS 'Logs all access events to places';
COMMENT ON TABLE place_notifications IS 'Stores notifications related to places';
COMMENT ON TABLE place_statistics IS 'Daily statistics for places';

COMMENT ON COLUMN places.is_active IS 'Whether the place is currently available for visits';
COMMENT ON COLUMN places.deactivation_reason IS 'Brief reason for deactivation';
COMMENT ON COLUMN place_deactivation_reasons.reason_type IS 'Categorized reason for deactivation';
COMMENT ON COLUMN place_deactivation_reasons.estimated_reactivation_date IS 'Expected date when place will be available again';
COMMENT ON COLUMN visits.visit_status IS 'Current status of the visit';
COMMENT ON COLUMN visits.access_level IS 'Security clearance level for the visit';

-- =====================================================
-- END OF SCRIPT
-- =====================================================
