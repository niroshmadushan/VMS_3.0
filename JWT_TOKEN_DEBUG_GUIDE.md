# 🔑 JWT TOKEN DEBUGGING GUIDE

## ✅ **Enhanced Token Logging**

I've added comprehensive logging to track JWT token usage in API calls.

### **What You'll See in Browser Console:**

#### **1. Token Retrieval**
```
🔑 Getting auth headers...
🔑 Token exists: true
🔑 Token length: 147
🔑 Token preview: eyJhbGciOiJIUzI1NiIs...
✅ Headers prepared with Authorization
```

#### **2. API Request**
```
🌐 API GET: http://minimart.best:3000/api/secure-select/places?limit=100&page=1
📡 Making request to: http://minimart.best:3000/api/secure-select/places?limit=100&page=1
📡 Request headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

#### **3. API Response**
```
📥 Response status: 200
📥 Response ok: true
📦 Response data: { success: true, data: [...] }
```

---

## 🐛 **Common Token Issues**

### **Issue 1: No Token Found**
**Console shows:**
```
🔑 Getting auth headers...
🔑 Token exists: false
❌ No authentication token found!
Error: No authentication token found. Please login first.
```

**Solution:**
```javascript
// Check in browser console
localStorage.getItem('authToken')
// or
localStorage.getItem('jwt_token')

// If both are null, you need to login first
```

---

### **Issue 2: Token Not Being Sent**
**Console shows:**
```
🔑 Getting auth headers...
🔑 Token exists: true
✅ Headers prepared with Authorization
📡 Request headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJ..."
}
📥 Response status: 401
🔐 Authentication failed (401)
```

**Possible Causes:**
1. Token is expired
2. Token is invalid
3. Backend isn't recognizing the token format
4. Wrong token in localStorage

**Debug:**
```javascript
// Check token expiration
const token = localStorage.getItem('authToken')
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    console.log('Token payload:', payload)
    console.log('Expires:', new Date(payload.exp * 1000))
    console.log('Is expired:', payload.exp < Date.now() / 1000)
  } catch (e) {
    console.log('Invalid JWT format')
  }
}
```

---

### **Issue 3: Wrong Token Storage Key**
**Console shows:**
```
🔑 Getting auth headers...
🔑 Token exists: false
```

**Check all possible storage keys:**
```javascript
console.log({
  authToken: localStorage.getItem('authToken'),
  jwt_token: localStorage.getItem('jwt_token'),
  token: localStorage.getItem('token'),
  accessToken: localStorage.getItem('accessToken')
})
```

---

## 🧪 **Manual Token Testing**

### **Test 1: Verify Token Exists**
```javascript
// In browser console
const token = localStorage.getItem('authToken')
console.log('Token:', token ? 'EXISTS' : 'MISSING')
console.log('Length:', token?.length)
console.log('First 20 chars:', token?.substring(0, 20))
```

### **Test 2: Test API with Token**
```javascript
// Manual API call with token
const token = localStorage.getItem('authToken')

fetch('http://minimart.best:3000/api/secure-select/places?limit=5', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(async response => {
  console.log('Status:', response.status)
  const data = await response.json()
  console.log('Data:', data)
})
.catch(error => {
  console.error('Error:', error)
})
```

### **Test 3: Decode Token**
```javascript
// Decode and inspect JWT token
const token = localStorage.getItem('authToken')
if (token) {
  try {
    const parts = token.split('.')
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    
    console.log('Header:', header)
    console.log('Payload:', payload)
    console.log('User ID:', payload.userId || payload.sub)
    console.log('Role:', payload.role)
    console.log('Issued:', new Date(payload.iat * 1000))
    console.log('Expires:', new Date(payload.exp * 1000))
  } catch (e) {
    console.error('Failed to decode token:', e)
  }
}
```

### **Test 4: Check All Auth Data**
```javascript
// Check complete authentication state
console.log('🔍 Authentication State:')
console.log({
  authToken: localStorage.getItem('authToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user_role: localStorage.getItem('user_role'),
  user_id: localStorage.getItem('user_id'),
  userData: localStorage.getItem('userData')
})
```

---

## 🔧 **Fix Common Token Issues**

### **Fix 1: Re-login to Get Fresh Token**
```javascript
// Clear old tokens and login again
localStorage.clear()
// Then login through your app
```

### **Fix 2: Manually Set Token (for testing)**
```javascript
// If you have a valid token from elsewhere
const validToken = 'your-jwt-token-here'
localStorage.setItem('authToken', validToken)
localStorage.setItem('user_role', 'admin')
localStorage.setItem('user_id', '1')
```

### **Fix 3: Check Token Format**
```javascript
// Token should be in JWT format: xxx.yyy.zzz
const token = localStorage.getItem('authToken')
const isValidFormat = token && token.split('.').length === 3
console.log('Valid JWT format:', isValidFormat)
```

---

## 📊 **Expected Console Output**

### **Successful API Call with Token:**
```
🔄 Loading places...
📋 API Options: { limit: 100 }
🔑 Getting auth headers...
🔑 Token exists: true
🔑 Token length: 147
🔑 Token preview: eyJhbGciOiJIUzI1NiIs...
✅ Headers prepared with Authorization
🌐 API GET: http://minimart.best:3000/api/secure-select/places?limit=100&page=1
📡 Making request to: http://minimart.best:3000/api/secure-select/places?limit=100&page=1
📡 Request headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGci..."
}
📡 Request options: { method: "GET" }
📥 Response status: 200
📥 Response ok: true
📦 Response data: {
  success: true,
  data: [
    { id: 1, name: "Place 1", ... },
    { id: 2, name: "Place 2", ... }
  ],
  meta: { ... }
}
🔍 Fetching places with params: { limit: 100, page: 1 }
✅ Response from places: { success: true, data: [...] }
📦 Returning 2 records from places
✅ Places loaded: [...]
```

---

## 🎯 **Troubleshooting Checklist**

Before reporting token issues, verify:

- [ ] I'm logged in to the application
- [ ] `localStorage.getItem('authToken')` returns a value
- [ ] Token has 3 parts separated by dots (xxx.yyy.zzz)
- [ ] Token is not expired (check with decode test)
- [ ] Console shows "Token exists: true"
- [ ] Console shows "Headers prepared with Authorization"
- [ ] Request headers include Authorization header
- [ ] Backend is receiving the Authorization header

---

## 🚨 **Error Messages**

### **"No authentication token found"**
- Token is missing from localStorage
- **Fix**: Login to the application

### **"Authentication failed (401)"**
- Token is expired or invalid
- **Fix**: Logout and login again

### **"Token is not defined"**
- localStorage not accessible (SSR issue)
- **Fix**: Already handled with `typeof window` checks

---

## 🎉 **When Everything Works**

You should see this flow in console:
1. ✅ Token exists
2. ✅ Headers prepared with Authorization
3. ✅ Request sent with Bearer token
4. ✅ Response 200 OK
5. ✅ Data returned successfully

---

## 📞 **Need Help?**

If tokens still aren't working, provide:

1. **Console output** of token check:
   ```javascript
   console.log({
     token: localStorage.getItem('authToken')?.substring(0, 20),
     length: localStorage.getItem('authToken')?.length
   })
   ```

2. **Decoded token** (payload only, no signature):
   ```javascript
   const token = localStorage.getItem('authToken')
   const payload = JSON.parse(atob(token.split('.')[1]))
   console.log(payload)
   ```

3. **Network tab** screenshot showing:
   - Request URL
   - Request Headers (Authorization header)
   - Response Status
   - Response Body

**The enhanced logging will show exactly how the token is being used!** 🔑
