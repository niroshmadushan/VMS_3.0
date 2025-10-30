# ✅ API HEADERS SETUP - COMPLETE GUIDE

## 🔐 Required Headers for All API Calls

Your backend requires these headers for **ALL** API requests:

```http
X-App-Id: default_app_id
X-Service-Key: default_service_key
Content-Type: application/json
Authorization: Bearer JWT_TOKEN  (for authenticated endpoints)
```

---

## 📝 Step 1: Create .env.local File

Create a file named `.env.local` in your project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# API Security Headers (Required for ALL API calls)
NEXT_PUBLIC_APP_ID=default_app_id
NEXT_PUBLIC_SERVICE_KEY=default_service_key
```

---

## ✅ Step 2: What's Already Configured

### **1. Login/Signup API (custom-auth.ts)**
```typescript
// lib/custom-auth.ts
const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
const SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': APP_ID,              // ✅ Added
      'X-Service-Key': SERVICE_KEY,     // ✅ Added
      ...options.headers,
    },
  })
}
```

**Used by:**
- ✅ Login (`/api/auth/login`)
- ✅ Signup (`/api/auth/signup`)
- ✅ OTP Verification (`/api/auth/verify-otp`)
- ✅ Token Validation (`/api/auth/validate-token`)
- ✅ Logout (`/api/auth/logout`)

---

### **2. Secure Select API (place-management-api.ts)**
```typescript
// lib/place-management-api.ts
private getHeaders() {
  const token = this.tokenManager.getToken()
  const appId = process.env.NEXT_PUBLIC_APP_ID || 'default_app_id'
  const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'default_service_key'

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-App-Id': appId,              // ✅ Added
    'X-Service-Key': serviceKey      // ✅ Added
  }
}
```

**Used by:**
- ✅ Get Places (`/api/secure-select/places`)
- ✅ Get Visitors (`/api/secure-select/visitors`)
- ✅ Get Visits (`/api/secure-select/visits`)
- ✅ Get Statistics (`/api/secure-select/place_statistics`)
- ✅ Get Access Logs (`/api/secure-select/place_access_logs`)
- ✅ All other secure-select endpoints

---

## 🔄 Complete API Flow

### **Flow 1: Login**
```
User → LoginForm
  ↓
POST http://localhost:3000/api/auth/login
  Headers:
    ✅ Content-Type: application/json
    ✅ X-App-Id: default_app_id
    ✅ X-Service-Key: default_service_key
  Body:
    {
      "email": "niroshmax01@gmail.com",
      "password": "Nir@2000313"
    }
  ↓
Response: { success: true, token: "...", otpRequired: true }
  ↓
Store token in localStorage
```

### **Flow 2: OTP Verification**
```
User → Enters OTP
  ↓
POST http://localhost:3000/api/auth/verify-otp
  Headers:
    ✅ Content-Type: application/json
    ✅ X-App-Id: default_app_id
    ✅ X-Service-Key: default_service_key
    ✅ Authorization: Bearer TEMP_TOKEN
  Body:
    {
      "email": "niroshmax01@gmail.com",
      "otpCode": "123456"
    }
  ↓
Response: { success: true, authToken: "...", user: {...} }
  ↓
Store authToken and userData in localStorage
```

### **Flow 3: Fetch Places Data**
```
User → Visits /admin/places
  ↓
GET http://localhost:3000/api/secure-select/places?limit=100&page=1
  Headers:
    ✅ Content-Type: application/json
    ✅ X-App-Id: default_app_id
    ✅ X-Service-Key: default_service_key
    ✅ Authorization: Bearer AUTH_TOKEN
  ↓
Response: { success: true, data: [...], meta: {...} }
  ↓
Display in table
```

---

## 🧪 How to Test

### **Step 1: Create .env.local**
```bash
# Create the file in project root
# Add the required variables (see above)
```

### **Step 2: Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **Step 3: Open Browser Console**
Press F12 → Console tab

### **Step 4: Login**
You should see:
```
🌐 API Request: http://localhost:3000/api/auth/login
🔑 App-Id: default_app_id
🔑 Service-Key: ✅ Set
```

### **Step 5: Navigate to Places**
After login, go to `/admin/places`

You should see:
```
🏗️ PlaceManagementAPI initialized
🌐 Base URL: http://localhost:3000
🔑 Getting auth headers...
✅ Headers prepared with Authorization, App-Id, and Service-Key
📡 Making request to: http://localhost:3000/api/secure-select/places
```

---

## 🐛 Troubleshooting

### **Issue 1: Missing Headers Error**

**Error**: Backend returns 401 or 403  
**Console shows**: 
```
🔑 App-Id: default_app_id
🔑 Service-Key: ❌ Missing
```

**Solution**: Create `.env.local` with correct values

---

### **Issue 2: Wrong Header Names**

**Error**: Backend doesn't recognize headers  
**Check**: Headers should be `X-App-Id` and `X-Service-Key` (case-sensitive)

**Correct**:
```http
X-App-Id: default_app_id
X-Service-Key: default_service_key
```

**Incorrect**:
```http
X-App-ID: default_app_id  ❌ (capital ID)
X-app-id: default_app_id  ❌ (lowercase)
```

---

### **Issue 3: Environment Variables Not Loading**

**Symptoms**: Console shows default values even after creating `.env.local`

**Solution**:
1. Make sure `.env.local` is in the project ROOT
2. Restart dev server completely
3. Clear browser cache
4. Check file is named exactly `.env.local` (not `.env.local.txt`)

---

## 📊 Expected Console Output

### **Successful Login:**
```
🌐 API Request: http://localhost:3000/api/auth/login
🔑 App-Id: default_app_id
🔑 Service-Key: ✅ Set
API Response status: 200 data: { success: true, ... }
```

### **Successful Places Fetch:**
```
🏗️ PlaceManagementAPI initialized
🌐 Base URL: http://localhost:3000
🔑 Getting auth headers...
🔑 Token exists: true
🔑 Token length: 147
✅ Headers prepared with Authorization, App-Id, and Service-Key
📡 Making request to: http://localhost:3000/api/secure-select/places?limit=100&page=1
📡 Request headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGci...",
  "X-App-Id": "default_app_id",
  "X-Service-Key": "default_service_key"
}
📥 Response status: 200
📦 Response data: { success: true, data: [...] }
```

---

## 🎯 Summary

All API calls now include:

1. ✅ **X-App-Id** header (from `.env.local`)
2. ✅ **X-Service-Key** header (from `.env.local`)
3. ✅ **Content-Type** header (always `application/json`)
4. ✅ **Authorization** header (for authenticated endpoints)

**Files Updated:**
- ✅ `lib/custom-auth.ts` - Login/Signup/OTP APIs
- ✅ `lib/place-management-api.ts` - Secure Select APIs

**What You Need to Do:**
1. ✅ Create `.env.local` file in project root
2. ✅ Add the required variables
3. ✅ Restart dev server

---

## 📝 .env.local Template

Copy this to your `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# API Security Headers (Required for ALL API calls)
# These headers are sent with EVERY request to the backend
NEXT_PUBLIC_APP_ID=default_app_id
NEXT_PUBLIC_SERVICE_KEY=default_service_key
```

---

**Your API is now configured to send all required headers!** 🎉

**Next Steps:**
1. Create `.env.local` file
2. Restart server
3. Try logging in
4. Check browser console for the header logs
