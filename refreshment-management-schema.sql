-- =====================================================
-- Refreshment Management Schema
-- =====================================================
-- This script creates tables for managing refreshment types and items

-- =====================================================
-- 1. CREATE REFRESHMENT TYPES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS refreshment_types (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
);

-- =====================================================
-- 2. CREATE REFRESHMENT ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS refreshment_items (
    id VARCHAR(255) PRIMARY KEY,
    type_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES refreshment_types(id) ON DELETE CASCADE,
    INDEX idx_type_id (type_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
);

-- =====================================================
-- 3. INSERT DEFAULT REFRESHMENT TYPES
-- =====================================================

INSERT INTO refreshment_types (id, name, code, is_active, is_deleted) VALUES
('type_1', 'Beverages', 'beverages', true, false),
('type_2', 'Light Snacks', 'light_snacks', true, false),
('type_3', 'Full Meal', 'full_meal', true, false),
('type_4', 'Custom', 'custom', true, false)
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);

-- =====================================================
-- 4. INSERT DEFAULT REFRESHMENT ITEMS
-- =====================================================

-- Beverages
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted) VALUES
('item_1', 'type_1', 'Coffee', true, false),
('item_2', 'type_1', 'Tea', true, false),
('item_3', 'type_1', 'Water', true, false),
('item_4', 'type_1', 'Juice', true, false),
('item_5', 'type_1', 'Soft Drinks', true, false)
ON DUPLICATE KEY UPDATE name=VALUES(name), type_id=VALUES(type_id);

-- Light Snacks
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted) VALUES
('item_6', 'type_2', 'Cookies', true, false),
('item_7', 'type_2', 'Sandwiches', true, false),
('item_8', 'type_2', 'Pastries', true, false),
('item_9', 'type_2', 'Fruits', true, false),
('item_10', 'type_2', 'Nuts', true, false)
ON DUPLICATE KEY UPDATE name=VALUES(name), type_id=VALUES(type_id);

-- Full Meal
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted) VALUES
('item_11', 'type_3', 'Lunch', true, false),
('item_12', 'type_3', 'Breakfast', true, false),
('item_13', 'type_3', 'Dinner', true, false),
('item_14', 'type_3', 'Buffet', true, false)
ON DUPLICATE KEY UPDATE name=VALUES(name), type_id=VALUES(type_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Refreshment management schema created successfully!' as status;

