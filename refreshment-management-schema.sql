-- =====================================================
-- REFRESHMENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This schema creates tables for managing refreshment types and items
-- Used in the admin refreshments management page
-- =====================================================

-- =====================================================
-- 1. REFRESHMENT TYPES TABLE
-- =====================================================
-- Stores different categories of refreshments (Beverages, Light Snacks, Full Meal, Custom, etc.)

CREATE TABLE IF NOT EXISTS refreshment_types (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Display name (e.g., "Beverages", "Light Snacks")',
    code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique code identifier (e.g., "beverages", "light_snacks")',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this type is currently active (1) or inactive (0)',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag (1 = deleted, 0 = active)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refreshment type categories';

-- =====================================================
-- 2. REFRESHMENT ITEMS TABLE
-- =====================================================
-- Stores individual refreshment items that belong to a type
-- (e.g., "Coffee", "Tea", "Sandwiches", "Cookies", etc.)

CREATE TABLE IF NOT EXISTS refreshment_items (
    id VARCHAR(255) PRIMARY KEY,
    type_id VARCHAR(255) NOT NULL COMMENT 'Foreign key to refreshment_types.id',
    name VARCHAR(255) NOT NULL COMMENT 'Item name (e.g., "Coffee", "Tea", "Sandwiches")',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this item is currently active (1) or inactive (0)',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT 'Soft delete flag (1 = deleted, 0 = active)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
    INDEX idx_type_id (type_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    FOREIGN KEY (type_id) REFERENCES refreshment_types(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual refreshment items';

-- =====================================================
-- 3. INSERT DEFAULT REFRESHMENT TYPES
-- =====================================================

INSERT INTO refreshment_types (id, name, code, is_active, is_deleted, created_at, updated_at) VALUES
('type_1', 'Beverages', 'beverages', 1, 0, NOW(), NOW()),
('type_2', 'Light Snacks', 'light_snacks', 1, 0, NOW(), NOW()),
('type_3', 'Full Meal', 'full_meal', 1, 0, NOW(), NOW()),
('type_4', 'Custom', 'custom', 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    code = VALUES(code),
    updated_at = NOW();

-- =====================================================
-- 4. INSERT DEFAULT REFRESHMENT ITEMS
-- =====================================================

-- Beverages
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted, created_at, updated_at) VALUES
('item_1', 'type_1', 'Coffee', 1, 0, NOW(), NOW()),
('item_2', 'type_1', 'Tea', 1, 0, NOW(), NOW()),
('item_3', 'type_1', 'Water', 1, 0, NOW(), NOW()),
('item_4', 'type_1', 'Soft Drinks', 1, 0, NOW(), NOW()),
('item_5', 'type_1', 'Juice', 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    type_id = VALUES(type_id),
    updated_at = NOW();

-- Light Snacks
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted, created_at, updated_at) VALUES
('item_6', 'type_2', 'Cookies', 1, 0, NOW(), NOW()),
('item_7', 'type_2', 'Biscuits', 1, 0, NOW(), NOW()),
('item_8', 'type_2', 'Sandwiches', 1, 0, NOW(), NOW()),
('item_9', 'type_2', 'Pastries', 1, 0, NOW(), NOW()),
('item_10', 'type_2', 'Fruits', 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    type_id = VALUES(type_id),
    updated_at = NOW();

-- Full Meal
INSERT INTO refreshment_items (id, type_id, name, is_active, is_deleted, created_at, updated_at) VALUES
('item_11', 'type_3', 'Lunch Set', 1, 0, NOW(), NOW()),
('item_12', 'type_3', 'Dinner Set', 1, 0, NOW(), NOW()),
('item_13', 'type_3', 'Buffet', 1, 0, NOW(), NOW()),
('item_14', 'type_3', 'Plated Meal', 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    type_id = VALUES(type_id),
    updated_at = NOW();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check all refreshment types
-- SELECT * FROM refreshment_types WHERE is_deleted = 0 ORDER BY name;

-- Check all refreshment items
-- SELECT 
--     ri.id,
--     ri.name AS item_name,
--     rt.name AS type_name,
--     rt.code AS type_code,
--     ri.is_active,
--     ri.created_at
-- FROM refreshment_items ri
-- LEFT JOIN refreshment_types rt ON ri.type_id = rt.id
-- WHERE ri.is_deleted = 0
-- ORDER BY rt.name, ri.name;

-- Count items by type
-- SELECT 
--     rt.name AS type_name,
--     COUNT(ri.id) AS item_count
-- FROM refreshment_types rt
-- LEFT JOIN refreshment_items ri ON rt.id = ri.type_id AND ri.is_deleted = 0
-- WHERE rt.is_deleted = 0
-- GROUP BY rt.id, rt.name
-- ORDER BY rt.name;

-- =====================================================
-- 6. NOTES
-- =====================================================
/*
TABLE STRUCTURE:

refreshment_types:
- id: Primary key (VARCHAR)
- name: Display name (e.g., "Beverages")
- code: Unique code (e.g., "beverages")
- is_active: Active status (1 = active, 0 = inactive)
- is_deleted: Soft delete flag (1 = deleted, 0 = active)
- created_at: Creation timestamp
- updated_at: Last update timestamp

refreshment_items:
- id: Primary key (VARCHAR)
- type_id: Foreign key to refreshment_types.id
- name: Item name (e.g., "Coffee", "Tea")
- is_active: Active status (1 = active, 0 = inactive)
- is_deleted: Soft delete flag (1 = deleted, 0 = active)
- created_at: Creation timestamp
- updated_at: Last update timestamp

DEFAULT DATA:
- 4 refreshment types (Beverages, Light Snacks, Full Meal, Custom)
- 14 default refreshment items across different types

USAGE:
- Admin can create/edit/delete types and items via /admin/refreshments
- Items are filtered by type when creating bookings
- Soft delete is used (is_deleted flag) to preserve data integrity
*/
