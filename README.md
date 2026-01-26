# 🏢 SMART VISITOR Management System

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 2024

---

## 📋 Overview

The SMART VISITOR Management System is a comprehensive visitor and meeting management solution designed for modern organizations. It provides secure, efficient, and user-friendly tools for managing visitor check-ins, meetings, bookings, and external members.

---

## ✨ Key Features

### 👥 User Roles
- **Admin**: Full system access and management
- **Staff**: Meeting and visitor management
- **Assistant**: Smart Assistant for visitor check-in

### 🔐 Security Features
- ✅ Comprehensive security audit completed
- ✅ All console statements removed (information disclosure fixed)
- ✅ Secure error handling implemented
- ✅ Input validation and sanitization
- ✅ Authentication and authorization
- ✅ Secure API integration

### 📅 Core Modules

#### 1. **Booking Management**
- Create and manage meetings
- Room availability checking
- Participant management (internal & external)
- Refreshment management
- Email notifications

#### 2. **Visitor Management**
- External member registration
- Visitor pass management
- Pass type configuration
- Visit history tracking

#### 3. **Smart Assistant**
- Self-service visitor check-in
- Meeting ID search
- Reference value search
- Attendance marking
- Member management

#### 4. **User Management**
- User profile management
- Role-based access control
- Settings and preferences

#### 5. **Place Management**
- Place configuration
- Availability management
- Time slot management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**: Latest version
- **Database**: MySQL/MariaDB
- **API Backend**: Running on port 3000 (default)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/niroshmadushan/VMS_3.0.git
   cd VMS_3.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # API Security Headers
   NEXT_PUBLIC_APP_ID=your_app_id_here
   NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
   
   # Site URL
   NEXT_PUBLIC_SITE_URL=http://localhost:6001
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   The application will start on **http://localhost:6001**

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## 📚 Documentation

### User Manuals
- [Smart Assistant User Manual](./SMART_ASSISTANT_USER_MANUAL.md) - Complete guide for Smart Assistant usage

### Security Documentation
- [Smart Assistant Security Test Report](./SMART_ASSISTANT_SECURITY_TEST_REPORT.md) - Security audit report
- [Comprehensive Security Audit Report](./COMPREHENSIVE_SECURITY_AUDIT_REPORT.md) - Full security assessment

### Deployment Guides
- [GitHub Deployment Guide](./GITHUB_DEPLOYMENT_GUIDE.md) - How to deploy to GitHub
- [Port Configuration](./PORT_CONFIGURATION.md) - Port settings documentation

### Security Fixes
- [Admin Dashboard Security Fix](./ADMIN_DASHBOARD_SECURITY_FIX.md)
- [Staff Dashboard Security Fix](./STAFF_DASHBOARD_SECURITY_FIX.md)
- [Staff Timeline Security Fix](./STAFF_TIMELINE_SECURITY_FIX.md)
- [Staff Availability Security Fix](./STAFF_AVAILABILITY_SECURITY_FIX.md)
- [Staff Settings Security Fix](./STAFF_SETTINGS_SECURITY_FIX.md)
- [Staff External Members Security Fix](./STAFF_EXTERNAL_MEMBERS_SECURITY_FIX.md)
- [Staff Bookings Security Fix](./STAFF_BOOKINGS_SECURITY_FIX.md)
- [Staff Booking Management Security Fix](./STAFF_BOOKING_MANAGEMENT_SECURITY_FIX.md)
- [Smart Assistant Security Fix](./SMART_ASSISTANT_SECURITY_FIX.md)

---

## 🔧 Configuration

### Port Configuration

The frontend runs on **port 6001** by default.

To change the port:
- Edit `package.json` scripts:
  ```json
  "dev": "next dev -p 6001",
  "start": "next start -p 6001"
  ```

### API Configuration

All API endpoints are configured in `lib/api-config.ts`:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

---

## 🛡️ Security

### Security Status: ✅ **SECURE**

All security vulnerabilities have been addressed:
- ✅ Information disclosure via console logs: **FIXED**
- ✅ Error message information leakage: **FIXED**
- ✅ Input validation and sanitization: **IMPLEMENTED**
- ✅ API URL exposure: **FIXED**
- ✅ Secure error handling: **IMPLEMENTED**

### Security Best Practices

1. **Never commit `.env` files** - Use `.env.local` (already in `.gitignore`)
2. **Use environment variables** - For all sensitive configuration
3. **Input validation** - All user inputs are validated and sanitized
4. **Error handling** - Generic error messages prevent information disclosure
5. **Authentication** - All protected routes require valid credentials

---

## 📊 System Architecture

```
SMART VISITOR Management System
├── Frontend (Next.js 14)
│   ├── Admin Dashboard
│   ├── Staff Dashboard
│   ├── Smart Assistant
│   └── Authentication
├── Backend API (Separate)
│   └── REST API endpoints
└── Database (MySQL/MariaDB)
    ├── Bookings
    ├── Users
    ├── External Members
    ├── Places
    └── Visitor Passes
```

---

## 🗂️ Project Structure

```
vmssystem/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin pages
│   ├── staff/               # Staff pages
│   ├── assistant/           # Assistant pages
│   ├── smart-assistant/     # Smart Assistant page
│   └── api/                 # API routes
├── components/              # React components
│   ├── admin/              # Admin components
│   ├── staff/              # Staff components
│   └── ui/                 # UI components
├── lib/                     # Utilities and configurations
├── public/                  # Static assets
├── database/                # Database scripts
└── scripts/                 # Build and deployment scripts
```

---

## 🔄 Available Scripts

```bash
# Development
npm run dev          # Start dev server on port 6001

# Production
npm run build        # Build for production
npm start            # Start production server on port 6001

# Code Quality
npm run lint         # Run ESLint

# Deployment
npm run workflow     # Development workflow script
```

---

## 🌐 Deployment

### GitHub Repository

**Repository**: https://github.com/niroshmadushan/VMS_3.0.git

**Branches**:
- `main`: Production branch
- `development`: Development branch

### Deployment Steps

1. **Commit changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. **Push to GitHub**
   ```bash
   git push origin development  # For development
   git push origin main         # For production
   ```

3. **Deploy to hosting**
   - Vercel (recommended for Next.js)
   - Netlify
   - Custom server (Node.js)

---

## 📝 Recent Updates

### December 2024

- ✅ **Security Audit Complete**: All console statements removed
- ✅ **Smart Assistant**: User manual created
- ✅ **Port Configuration**: Updated to port 6001
- ✅ **Error Handling**: Secure error handling implemented
- ✅ **Documentation**: Comprehensive documentation added

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

### Documentation
- See `/docs` folder for detailed documentation
- Check user manuals in the root directory

### Issues
- Report issues via GitHub Issues
- Contact system administrator

### Contact
- **Repository**: https://github.com/niroshmadushan/VMS_3.0
- **Issues**: https://github.com/niroshmadushan/VMS_3.0/issues

---

## ✅ Production Checklist

Before deploying to production:

- [x] Security audit completed
- [x] All console statements removed
- [x] Environment variables configured
- [x] Database connections tested
- [x] API endpoints verified
- [x] Error handling implemented
- [x] Input validation added
- [x] Documentation complete
- [x] User manuals created
- [x] GitHub repository set up

---

**Status**: ✅ **PRODUCTION READY**

---

*Last Updated: December 2024*




