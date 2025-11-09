-- Booking Cancellations Table
-- Stores cancellation reasons and details for cancelled bookings

CREATE TABLE IF NOT EXISTS booking_cancellations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  booking_id VARCHAR(36) NOT NULL,
  cancelled_by VARCHAR(36) NOT NULL COMMENT 'User ID who cancelled the booking',
  cancellation_reason TEXT NOT NULL COMMENT 'Reason for cancellation provided by user',
  cancellation_type VARCHAR(50) DEFAULT 'user_cancelled' COMMENT 'Type: user_cancelled, admin_cancelled, system_cancelled',
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key to bookings table
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Index for faster queries
  INDEX idx_booking_id (booking_id),
  INDEX idx_cancelled_at (cancelled_at),
  INDEX idx_cancelled_by (cancelled_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


