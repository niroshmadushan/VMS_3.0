# 📧 Booking Email API Setup Guide

## 🚀 Quick Setup

### 1. Database Setup
Run the SQL script to create the email logging table:
```bash
mysql -u your_username -p your_database < database/booking_email_logs.sql
```

### 2. Environment Variables
Add these to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# API Configuration
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_app_id
NEXT_PUBLIC_SERVICE_KEY=your_service_key
```

### 3. Install Dependencies
```bash
npm install nodemailer
```

### 4. Register Routes
In your main server file (e.g., `server.js` or `app.js`), add:
```javascript
const bookingEmailRoutes = require('./routes/bookingEmail');
app.use('/api/booking-email', bookingEmailRoutes);
```

### 5. Test the API
```bash
# Test with cURL
curl -X GET http://localhost:3000/api/booking-email/booking-123/participants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📧 Email Templates

The API includes professional email templates for:
- **Booking Details**: Complete booking information with styling
- **Reminder Emails**: 24-hour and 1-hour reminders
- **Custom Messages**: Support for personalized messages

## 🔧 Features

- ✅ **JWT Authentication**: Secure API access
- ✅ **Email Logging**: Track all sent emails
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Professional Templates**: HTML and text versions
- ✅ **Participant Selection**: Send to specific participants
- ✅ **Custom Messages**: Add personalized content
- ✅ **Reminder System**: Automated reminder emails

## 🎯 API Endpoints

1. **GET** `/api/booking-email/:bookingId/participants` - Get participants
2. **POST** `/api/booking-email/:bookingId/send-details` - Send booking details
3. **POST** `/api/booking-email/:bookingId/send-reminder` - Send reminders
4. **GET** `/api/booking-email/:bookingId/history` - Get email history

## 🚨 Troubleshooting

### Common Issues:
1. **SMTP Authentication Failed**: Check email credentials
2. **Database Connection Error**: Verify database settings
3. **JWT Token Invalid**: Check authentication middleware
4. **Email Not Sending**: Verify SMTP configuration

### Debug Steps:
1. Check console logs for detailed error messages
2. Verify environment variables are set correctly
3. Test SMTP connection independently
4. Check database table exists and is accessible

## 📊 Monitoring

All email activities are logged in the `booking_email_logs` table:
- Email content (HTML and text)
- Recipient information
- Send status (sent/failed/pending)
- Error messages for failed sends
- Timestamp and sender information

## 🎉 Ready to Use!

Once configured, the API will:
- Send professional booking emails
- Track all email activities
- Provide detailed success/failure reports
- Support custom messages and reminders
- Handle errors gracefully

**The system is now ready to send booking notifications via email!** 🎉
