# 🎫 Pass Management System - Complete Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Features](#features)
4. [How to Use](#how-to-use)
5. [Examples](#examples)

---

## 🎯 Overview

The Pass Management System allows you to create and manage different types of passes (Visitor, VIP, Contractor, etc.) with customizable number ranges. Each pass type can have its own:

- **Name** (e.g., "Visitor Pass", "VIP Pass")
- **Number Range** (e.g., 1-20, 1-5)
- **Prefix** (e.g., "V", "VIP")
- **Color** (for UI display)
- **Description**

---

## 🗄️ Database Setup

### Step 1: Run the SQL Schema

Execute the `pass-types-schema.sql` file in your MySQL database:

```bash
mysql -u your_username -p your_database < pass-types-schema.sql
```

Or use phpMyAdmin/MySQL Workbench to import the file.

### Step 2: Tables Created

The schema creates these tables:

1. **`pass_types`** - Stores pass type definitions
2. **`passes`** - Individual pass instances
3. **`pass_assignments`** - History of pass assignments
4. **Views & Procedures** - For statistics and operations

### Step 3: Sample Data (Optional)

The schema includes sample data:
- Visitor Pass (V-001 to V-020)
- VIP Pass (VIP-001 to VIP-005)
- Contractor Pass (C-001 to C-015)
- Vendor Pass (VEN-001 to VEN-010)

---

## ✨ Features

### 1. **Pass Type Management**
- ✅ Create unlimited pass types
- ✅ Set custom number ranges (min-max)
- ✅ Add prefixes for easy identification
- ✅ Choose custom colors
- ✅ Edit ranges (auto-adds/removes passes)

### 2. **Auto-Generation**
- ✅ Automatically generates all passes in the range
- ✅ Format: `PREFIX-NUMBER` (e.g., V-001, VIP-005)
- ✅ Zero-padded numbers (001, 002, 003)

### 3. **Real-Time Statistics**
- 📊 Total pass types
- 📊 Total passes
- 📊 Available passes
- 📊 Assigned passes
- 📊 Utilization percentage

### 4. **Range Modification**
- ➕ Increase range: Auto-adds new passes
- ➖ Decrease range: Soft-deletes unused passes
- 🔄 Change prefix: Updates all display names

---

## 🚀 How to Use

### Creating a New Pass Type

#### Example 1: Visitor Passes (1-20)

1. Navigate to `/admin/pass-types`
2. Click **"Create Pass Type"**
3. Fill in the form:
   ```
   Name: Visitor Pass
   Description: Standard visitor passes for guests
   Prefix: V
   Color: #3B82F6 (Blue)
   Min Number: 1
   Max Number: 20
   ```
4. Click **"Create Pass Type"**

✅ **Result:** System automatically creates 20 passes:
- V-001, V-002, V-003, ... V-020

---

#### Example 2: VIP Passes (1-5)

1. Click **"Create Pass Type"**
2. Fill in:
   ```
   Name: VIP Pass
   Description: Exclusive passes for VIP guests
   Prefix: VIP
   Color: #F59E0B (Orange)
   Min Number: 1
   Max Number: 5
   ```
3. Click **"Create Pass Type"**

✅ **Result:** Creates 5 passes:
- VIP-001, VIP-002, VIP-003, VIP-004, VIP-005

---

### Modifying Pass Ranges

#### Scenario: Increase Visitor Passes from 20 to 30

1. Click **Edit** on "Visitor Pass"
2. Change **Max Number** from `20` to `30`
3. Click **"Update Pass Type"**

✅ **Result:** System adds passes V-021 through V-030

---

#### Scenario: Decrease VIP Passes from 5 to 3

1. Click **Edit** on "VIP Pass"
2. Change **Max Number** from `5` to `3`
3. Click **"Update Pass Type"**

✅ **Result:** 
- Keeps VIP-001, VIP-002, VIP-003
- Soft-deletes VIP-004, VIP-005 (only if not assigned)

⚠️ **Note:** Assigned passes are NOT deleted

---

### Viewing Pass Statistics

Each pass type card shows:

| Metric | Description |
|--------|-------------|
| **Available** | Passes ready to be assigned |
| **Assigned** | Currently issued passes |
| **Usage %** | (Assigned / Total) × 100 |

---

## 📊 Examples

### Example Setup for a Company

| Pass Type | Prefix | Range | Total | Use Case |
|-----------|--------|-------|-------|----------|
| Visitor Pass | V | 1-50 | 50 | Daily visitors |
| VIP Pass | VIP | 1-10 | 10 | Executives, special guests |
| Contractor Pass | C | 1-30 | 30 | Long-term contractors |
| Vendor Pass | VEN | 1-20 | 20 | Delivery, maintenance |
| Employee Temp Pass | EMP | 1-15 | 15 | Lost/forgotten badges |

---

### Example Pass Numbering

```
Visitor Pass:
  V-001, V-002, V-003, ... V-050

VIP Pass:
  VIP-001, VIP-002, VIP-003, ... VIP-010

Contractor Pass:
  C-001, C-002, C-003, ... C-030

Vendor Pass:
  VEN-001, VEN-002, VEN-003, ... VEN-020
```

---

## 🎨 UI Features

### Analytics Dashboard

```
┌─────────────────────────────────────────────────────┐
│ [📊 Pass Types: 4] [🎫 Total: 110]                 │
│ [✅ Available: 95] [📋 Assigned: 15]                │
└─────────────────────────────────────────────────────┘
```

### Pass Type Cards

Each card displays:
- ✅ Name and prefix
- ✅ Color indicator
- ✅ Pass range (e.g., V-001 to V-050)
- ✅ Total passes
- ✅ Real-time statistics
- ✅ Quick actions (View, Edit, Delete)

### Color Coding

```
🟦 Visitor Pass    - Blue (#3B82F6)
🟧 VIP Pass        - Orange (#F59E0B)
🟩 Contractor Pass - Green (#10B981)
🟪 Vendor Pass     - Purple (#8B5CF6)
```

---

## 🔐 Database Schema Highlights

### Pass Types Table
```sql
CREATE TABLE pass_types (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  prefix VARCHAR(10),
  min_number INT,
  max_number INT,
  total_passes INT (auto-calculated),
  color VARCHAR(20),
  ...
);
```

### Passes Table
```sql
CREATE TABLE passes (
  id VARCHAR(36) PRIMARY KEY,
  pass_type_id VARCHAR(36),
  pass_number INT,
  pass_display_name VARCHAR(50), -- e.g., "V-001"
  status ENUM('available', 'assigned', 'lost', ...),
  current_holder_name VARCHAR(200),
  ...
);
```

### Unique Constraint
```sql
UNIQUE KEY (pass_type_id, pass_number)
```
This ensures no duplicate pass numbers within a pass type.

---

## 🛠️ Advanced Features

### Stored Procedures

#### 1. Create Pass Type with Auto-Generation
```sql
CALL sp_create_pass_type_with_passes(
  'Visitor Pass',      -- name
  'For guests',        -- description
  '#3B82F6',          -- color
  'V',                -- prefix
  1,                  -- min_number
  20,                 -- max_number
  'admin_id',         -- created_by
  @new_id,            -- OUT: pass_type_id
  @count              -- OUT: passes_created
);
```

#### 2. Assign Pass
```sql
CALL sp_assign_pass(
  'pass_id',
  'John Doe',
  '+1234567890',
  'visitor',
  'visitor_id',
  '2025-10-15',
  'admin_id',
  'booking_id',
  'Notes'
);
```

#### 3. Return Pass
```sql
CALL sp_return_pass(
  'pass_id',
  'admin_id',
  'Pass returned in good condition'
);
```

---

## 📈 Views for Reporting

### 1. Pass Type Statistics
```sql
SELECT * FROM v_pass_type_statistics;
```

Returns:
- Total passes per type
- Available, assigned, lost counts
- Utilization percentage

### 2. Active Assignments
```sql
SELECT * FROM v_active_pass_assignments;
```

Shows currently assigned passes with holder info.

### 3. Pass History
```sql
SELECT * FROM v_pass_history;
```

Complete audit trail of all pass activities.

---

## ⚙️ Configuration

### Minimum Requirements
- MySQL 5.7+ or MariaDB 10.2+
- PHP 8.0+
- Next.js 14+

### API Endpoints Used
- `GET /api/place-management?table=pass_types`
- `GET /api/place-management?table=passes`
- `POST /api/place-management` (insert)
- `PUT /api/place-management` (update)
- `DELETE /api/place-management` (soft delete)

---

## 🎯 Best Practices

### 1. **Naming Convention**
- Use clear, descriptive names
- Keep prefixes short (2-4 characters)
- Examples: V, VIP, CONT, VEN, EMP

### 2. **Number Ranges**
- Start from 1 for consistency
- Leave room for growth
- Example: Start with 1-50, can expand to 1-100 later

### 3. **Colors**
- Use distinct colors for each type
- Maintain consistency across UI
- Test contrast for accessibility

### 4. **Range Modifications**
- Only increase ranges when needed
- Be cautious when decreasing (checks for assigned passes)
- Plan capacity ahead of time

---

## 🐛 Troubleshooting

### Issue: "Passes not generating"
**Solution:** Check that min_number < max_number and both are positive.

### Issue: "Cannot decrease range"
**Solution:** Some passes in the range are currently assigned. Return them first.

### Issue: "Duplicate pass numbers"
**Solution:** The system prevents this automatically with UNIQUE constraint.

---

## 🎉 Success!

You now have a fully functional Pass Management System that can:
- ✅ Create unlimited pass types
- ✅ Auto-generate passes in any range
- ✅ Modify ranges dynamically
- ✅ Track statistics in real-time
- ✅ Manage assignments and history

Navigate to `/admin/pass-types` to get started! 🚀

