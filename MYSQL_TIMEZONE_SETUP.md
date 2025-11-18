# MySQL Timezone Setup for Sri Lanka (UTC+5:30)

## Problem
The `created_at`, `updated_at`, and `cancelled_at` columns in the `bookings` table need to show correct Sri Lanka local time (UTC+5:30).

## Solution
Set MySQL session timezone to `+05:30` in your backend database connection.

## Backend Configuration

### Option 1: Set Session Timezone in Database Connection (Recommended)

Add this to your backend database connection code (where you create the MySQL connection):

```javascript
// After creating the MySQL connection
connection.query("SET time_zone = '+05:30'", (err) => {
  if (err) {
    console.error('Error setting timezone:', err);
  } else {
    console.log('MySQL timezone set to +05:30 (Sri Lanka)');
  }
});
```

### Option 2: Set in Connection Pool (If using connection pool)

```javascript
// When creating connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_user',
  password: 'your_password',
  database: 'your_database',
  timezone: '+05:30'  // Set timezone in connection config
});
```

### Option 3: Set Global Timezone (Requires MySQL root access)

```sql
-- Run this in MySQL (requires SUPER privilege)
SET GLOBAL time_zone = '+05:30';
```

### Option 4: Set in my.cnf (MySQL Configuration File)

Add to `/etc/mysql/my.cnf` or MySQL configuration file:

```ini
[mysqld]
default-time-zone = '+05:30'
```

Then restart MySQL:
```bash
sudo systemctl restart mysql
```

## Verify Timezone Setting

Run this query to check current timezone:

```sql
SELECT @@session.time_zone AS session_timezone, 
       @@global.time_zone AS global_timezone,
       NOW() AS current_time;
```

Expected output:
```
session_timezone: +05:30
global_timezone: +05:30
current_time: 2024-01-15 14:30:00 (Sri Lanka time)
```

## Frontend Changes

✅ **Already Done:**
- Removed all `created_at`, `updated_at`, and `cancelled_at` fields from frontend code
- MySQL will now automatically set these timestamps using `CURRENT_TIMESTAMP`
- Timestamps will use the timezone set in your MySQL session/global settings

## Testing

1. Create a new booking
2. Check the `created_at` timestamp in the database
3. It should show the current Sri Lanka local time (UTC+5:30)

## Notes

- The `bookings` table uses `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` for `created_at`
- The `updated_at` uses `ON UPDATE CURRENT_TIMESTAMP` to auto-update
- All timestamps will now use the MySQL server's configured timezone

