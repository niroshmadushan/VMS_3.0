# Rate Limiting Fix Guide

## 🚨 "Too many authentication attempts, please try again later"

This error occurs when your custom backend's rate limiting is blocking authentication requests. Here's how to fix it:

## 🔍 **Quick Diagnosis**

### 1. **Check if Backend is Running**
```bash
# Test if your backend is accessible
curl http://localhost:3000/health
```

### 2. **Check Environment Variables**
Make sure your `.env.local` file exists and contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

### 3. **Use the Diagnostic Tool**
Visit: `http://localhost:3000/diagnose-rate-limit`

## 🎯 **Most Common Solutions**

### **Solution 1: Wait for Rate Limit Reset**
Your backend has these rate limits:
- **Auth Endpoints**: 5 requests per 15 minutes
- **OTP Endpoints**: 3 requests per 10 minutes  
- **Password Reset**: 3 requests per hour

**Fix**: Wait 15-60 minutes and try again.

### **Solution 2: Start Your Backend Server**
If your backend isn't running:

1. **Navigate to your backend directory**
2. **Start the server**:
   ```bash
   npm start
   # or
   node server.js
   # or
   npm run dev
   ```

3. **Verify it's running**:
   - Visit `http://localhost:3000/health`
   - Should return: `{"success": true, "message": "Server is running"}`

### **Solution 3: Check Environment Variables**
Create/update `.env.local` in your frontend project root:

```env
# Custom Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ID=your_unique_app_id_here
NEXT_PUBLIC_SERVICE_KEY=your_service_key_here
```

**Get your credentials from your backend configuration.**

### **Solution 4: Clear Browser Data**
Sometimes cached data causes issues:

1. **Clear browser cache and cookies**
2. **Clear localStorage**:
   ```javascript
   // In browser console
   localStorage.clear()
   ```
3. **Try in incognito/private window**

### **Solution 5: Check Backend Logs**
Look at your backend server console for:
- Rate limiting messages
- Authentication errors
- Request processing issues

## 🔧 **Advanced Solutions**

### **Adjust Rate Limits (Backend)**
If you need to modify rate limits, update your backend configuration:

```javascript
// In your backend rate limiting configuration
const rateLimits = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increase from 5 to 10 requests
  },
  otp: {
    windowMs: 10 * 60 * 1000, // 10 minutes  
    max: 5, // Increase from 3 to 5 requests
  }
}
```

### **Reset Rate Limits (Backend)**
If you have admin access to your backend, you can reset rate limits:

```bash
# If your backend has a reset endpoint
curl -X POST http://localhost:3000/api/admin/reset-rate-limits
```

## 🧪 **Testing Steps**

### **Step 1: Test Backend Health**
```bash
curl http://localhost:3000/health
```

### **Step 2: Test API Endpoint**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_app_id" \
  -H "X-Service-Key: your_service_key" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### **Step 3: Use Diagnostic Tool**
Visit `http://localhost:3000/diagnose-rate-limit` and run the diagnostics.

## 🚨 **Emergency Bypass**

If you need immediate access and can't wait:

### **Option 1: Restart Backend Server**
```bash
# Stop your backend server (Ctrl+C)
# Start it again
npm start
```

### **Option 2: Clear Rate Limit Data**
If your backend stores rate limit data in memory, restarting will clear it.

### **Option 3: Use Different IP/Device**
Rate limits are often IP-based, so try from a different device or network.

## 📋 **Prevention Tips**

1. **Don't spam login attempts** - Wait between failed attempts
2. **Use correct credentials** - Wrong credentials count toward rate limits
3. **Check email for OTP** - Don't keep requesting new OTPs
4. **Monitor backend logs** - Watch for rate limiting messages

## 🎯 **Quick Checklist**

- [ ] Backend server is running on port 3000
- [ ] Environment variables are configured correctly
- [ ] Waited 15+ minutes since last attempts
- [ ] Cleared browser cache and localStorage
- [ ] Checked backend logs for errors
- [ ] Used diagnostic tool to verify setup

## 🆘 **Still Having Issues?**

1. **Run the diagnostic tool**: `http://localhost:3000/diagnose-rate-limit`
2. **Check backend logs** for specific error messages
3. **Verify your backend is the correct version** from your API guide
4. **Test with curl commands** to isolate frontend vs backend issues

The most common fix is simply **waiting 15-30 minutes** for the rate limit to reset! 🕐
