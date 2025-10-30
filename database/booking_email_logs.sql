-- Create booking_email_logs table for email tracking
CREATE TABLE IF NOT EXISTS booking_email_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    booking_id CHAR(36) NOT NULL,
    participant_id CHAR(36) NULL,
    recipient_email VARCHAR(255) NOT NULL,
    email_type ENUM('booking_details','booking_confirmation','booking_reminder_24hr','booking_reminder_1hr','custom') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by INT NOT NULL,
    status ENUM('sent','failed','pending') DEFAULT 'sent',
    error_message TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES external_members(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add indexes for better performance
CREATE INDEX idx_booking_email_logs_booking_id ON booking_email_logs(booking_id);
CREATE INDEX idx_booking_email_logs_recipient_email ON booking_email_logs(recipient_email);
CREATE INDEX idx_booking_email_logs_sent_at ON booking_email_logs(sent_at);
CREATE INDEX idx_booking_email_logs_status ON booking_email_logs(status);
