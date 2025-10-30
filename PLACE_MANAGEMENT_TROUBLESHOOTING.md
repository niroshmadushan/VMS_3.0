# 🔧 PLACE MANAGEMENT TROUBLESHOOTING GUIDE

## 🎯 **Quick Fixes Applied**

### **1. Fixed "Invalid filters format" Error**
✅ **Updated `loadPlaces()` function** to only send defined filter values  
✅ **Removed undefined parameters** that were causing JSON parsing errors  
✅ **Added clean options object** building logic  

### **2. Fixed Backend URL Configuration**
✅ **Updated API base URL** to use environment variable or default to `http://minimart.best:3000/api/secure-select`  
✅ **Added proper fallback** for when environment variable is not set  

### **3. Added Better Error Handling**
✅ **Enhanced error messages** for authentication and network issues  
✅ **Added console logging** for debugging API calls  
✅ **Fixed useEffect dependencies** to prevent ESLint warnings  

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Invalid filters format. Must be valid JSON array."**
**Status**: ✅ **FIXED**

**Cause**: Undefined values in filter options  
**Solution**: Now only sends filters with valid values

---

### **Issue 2: "No authentication token found. Please login first."**
**Status**: ⚠️ **May still occur if not logged in**

**Cause**: Missing JWT token in localStorage  
**Solution**: 
1. Make sure you're logged in
2. Check browser console: `localStorage.getItem('authToken')`
3. If missing, login again
4. Token should be stored as `authToken` or `jwt_token`

**Debug Commands** (in browser console):
```javascript
// Check if token exists
console.log('Auth Token:', localStorage.getItem('authToken'))
console.log('User Role:', localStorage.getItem('user_role'))
console.log('User ID:', localStorage.getItem('user_id'))

// If token exists but API fails, check token format
const token = localStorage.getItem('authToken')
if (token) {
  console.log('Token length:', token.length)
  console.log('Token starts with:', token.substring(0, 20))
}
```

---

### **Issue 3: Network Error / API Connection Failed**
**Possible Causes**:
1. Backend server is not running
2. Wrong API URL
3. CORS issues
4. Network connectivity

**Solutions**:

#### **A. Check Backend Server**
```bash
# Test if backend is accessible
curl http://minimart.best:3000/api/health

# Or test secure-select endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://minimart.best:3000/api/secure-select/tables
```

#### **B. Verify API URL**
Check your `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://minimart.best:3000/api/secure-select
```

Or create one if it doesn't exist:
```bash
echo "NEXT_PUBLIC_API_URL=http://minimart.best:3000/api/secure-select" > .env.local
```

#### **C. Check CORS Settings**
Backend should allow requests from your frontend domain:
```javascript
// Backend CORS config should include
{
  origin: ['http://localhost:3000', 'http://minimart.best'],
  credentials: true
}
```

---

### **Issue 4: Empty Places List**
**Possible Causes**:
1. No places in database
2. User doesn't have permission to view places
3. Filters are too restrictive

**Solutions**:

#### **A. Check Database**
Run this SQL query on your database:
```sql
SELECT COUNT(*) FROM places;
SELECT * FROM places LIMIT 5;
```

#### **B. Check User Permissions**
The secure-select API uses role-based access. Check if your user role has access to the `places` table.

#### **C. Remove Filters**
Try selecting "All Status" and "All Types" to see if filters are the issue.

---

### **Issue 5: "Authentication failed. Please login again."**
**Cause**: Token expired or invalid

**Solution**:
1. Logout and login again
2. Check token expiration time
3. Verify backend token validation

**Debug in Browser Console**:
```javascript
// Decode JWT token to check expiration
const token = localStorage.getItem('authToken')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token payload:', payload)
  console.log('Token expires at:', new Date(payload.exp * 1000))
  console.log('Current time:', new Date())
  console.log('Token expired?', payload.exp < Date.now() / 1000)
}
```

---

## 🔍 **Debugging Steps**

### **Step 1: Open Browser Developer Console**
Press `F12` or right-click → "Inspect" → "Console" tab

### **Step 2: Check Console Logs**
Look for these messages when loading place management page:
```
🔄 Loading places...
📋 API Options: { limit: 100 }
✅ Places loaded: [array of places]
```

Or error messages:
```
❌ Failed to load places: [error details]
```

### **Step 3: Check Network Tab**
1. Open "Network" tab in Developer Tools
2. Reload the place management page
3. Look for request to `/api/secure-select/places`
4. Check:
   - Request URL
   - Request Headers (Authorization header)
   - Response Status (should be 200)
   - Response Body

### **Step 4: Verify Authentication**
```javascript
// In browser console
const token = localStorage.getItem('authToken')
console.log('Token exists?', !!token)
console.log('Token value:', token)

// Test API manually
fetch('http://minimart.best:3000/api/secure-select/tables', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e))
```

---

## 🚀 **Quick Test**

Run this in browser console to test the place management API:

```javascript
// Import the API (if in Next.js app)
const testPlaceAPI = async () => {
  try {
    // Check token
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('❌ No auth token found')
      return
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...')

    // Test API call
    const response = await fetch('http://minimart.best:3000/api/secure-select/places?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ API Success:', data)
    } else {
      console.error('❌ API Error:', data)
    }
  } catch (error) {
    console.error('❌ Network Error:', error)
  }
}

testPlaceAPI()
```

---

## 📋 **Checklist**

Before reporting issues, verify:

- [ ] I'm logged in to the application
- [ ] Auth token exists in localStorage
- [ ] Backend server is running on `minimart.best:3000`
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows the API request is being made
- [ ] Database has places data
- [ ] User role has access to places table
- [ ] `.env.local` has correct API_URL (if using custom URL)

---

## 🎉 **Expected Behavior**

When everything works correctly:

1. **Page Loads**:
   - Loading spinner appears briefly
   - Statistics cards show counts
   - Places table loads with data

2. **Console Logs**:
   ```
   🔄 Loading places...
   📋 API Options: { limit: 100 }
   ✅ Places loaded: [array of places]
   ```

3. **Network Tab**:
   - Request to `/api/secure-select/places`
   - Status: 200 OK
   - Response: JSON array of places

4. **UI**:
   - Statistics cards show real numbers
   - Places table displays rows
   - Filters work correctly
   - No error messages

---

## 📞 **Still Having Issues?**

If you're still experiencing problems:

1. **Check all items in the checklist above**
2. **Copy error messages** from browser console
3. **Check network tab** for failed requests
4. **Verify backend logs** for any server-side errors
5. **Test API with curl** or Postman to isolate frontend/backend issues

**Useful Debug Info to Provide**:
- Error message from browser console
- Network request details (URL, headers, response)
- Backend API logs (if accessible)
- User role and authentication status
- Browser and OS version
