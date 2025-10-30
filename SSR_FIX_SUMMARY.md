# 🔧 SSR (Server-Side Rendering) FIX

## ❌ **The Problem**

Error message: **"ReferenceError: localStorage is not defined"**

```
⨯ ReferenceError: localStorage is not defined
   at new TokenManager (./lib/place-management-api.ts:12:22)
```

### **Root Cause**
The `TokenManager` class was trying to access `localStorage` during server-side rendering (SSR). In Next.js, `localStorage` is a browser API and **does not exist on the server**.

When Next.js pre-renders pages on the server, any code that accesses browser-specific APIs like `localStorage`, `window`, or `document` will throw errors.

---

## ✅ **The Solution**

### **Fixed Code**
Added `typeof window !== 'undefined'` checks before accessing `localStorage`:

```typescript
class TokenManager {
  private token: string | null = null
  private userRole: string | null = null
  private userId: string | null = null

  constructor() {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
      this.userRole = localStorage.getItem('user_role')
      this.userId = localStorage.getItem('user_id')
    }
  }

  getToken() {
    // Refresh from localStorage on each call (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token')
    }
    return this.token
  }

  // ... similar checks for all localStorage access
}
```

---

## 🎯 **What Changed**

### **Before (Broken)**
```typescript
constructor() {
  this.token = localStorage.getItem('authToken')  // ❌ Crashes on server
  this.userRole = localStorage.getItem('user_role')
  this.userId = localStorage.getItem('user_id')
}
```

### **After (Fixed)**
```typescript
constructor() {
  if (typeof window !== 'undefined') {  // ✅ Only runs in browser
    this.token = localStorage.getItem('authToken')
    this.userRole = localStorage.getItem('user_role')
    this.userId = localStorage.getItem('user_id')
  }
}
```

---

## 🔍 **How It Works**

### **Server-Side Rendering (SSR)**
1. Next.js runs on the server
2. `typeof window === 'undefined'` on server
3. `localStorage` access is skipped
4. Properties remain `null`
5. No error occurs ✅

### **Client-Side Rendering (CSR)**
1. Code runs in browser
2. `typeof window !== 'undefined'` returns `true`
3. `localStorage` is accessed normally
4. Properties are populated from storage
5. Authentication works ✅

---

## 🚀 **Benefits**

### **1. SSR Compatible**
- ✅ Page can be pre-rendered on server
- ✅ No runtime errors during SSR
- ✅ Faster initial page load

### **2. Progressive Enhancement**
- ✅ Works without JavaScript (basic render)
- ✅ Enhances with authentication when JS loads
- ✅ Graceful degradation

### **3. Better Performance**
- ✅ Server can pre-render HTML
- ✅ Reduces Time to First Byte (TTFB)
- ✅ Improves SEO

---

## 📋 **Updated Methods**

All methods that access `localStorage` now have the check:

### **Constructor**
```typescript
if (typeof window !== 'undefined') {
  // Access localStorage
}
```

### **getToken()**
```typescript
if (typeof window !== 'undefined') {
  this.token = localStorage.getItem('authToken')
}
return this.token
```

### **getUserRole()**
```typescript
if (typeof window !== 'undefined') {
  this.userRole = localStorage.getItem('user_role')
}
return this.userRole
```

### **getUserId()**
```typescript
if (typeof window !== 'undefined') {
  this.userId = localStorage.getItem('user_id')
}
return this.userId
```

### **clearToken()**
```typescript
if (typeof window !== 'undefined') {
  localStorage.removeItem('authToken')
  // ... other removals
}
```

### **setToken()**
```typescript
if (typeof window !== 'undefined') {
  localStorage.setItem('authToken', token)
  // ... other sets
}
```

---

## 🎯 **Testing**

### **Test 1: Server-Side Rendering**
```bash
# Build and start production server
npm run build
npm start

# Should build without errors
# Page should render on server
```

### **Test 2: Client-Side Functionality**
```javascript
// In browser console
const api = require('./lib/place-management-api')
console.log('Token:', api.placeManagementAPI.tokenManager.getToken())
// Should return token if logged in
```

### **Test 3: Development Mode**
```bash
npm run dev
# Navigate to /admin/places
# Should load without localStorage errors
```

---

## 🔑 **Key Takeaways**

### **Always Check for Browser APIs**
When using browser-specific APIs in Next.js:
- ✅ `localStorage` - check `typeof window`
- ✅ `sessionStorage` - check `typeof window`
- ✅ `window` - check `typeof window`
- ✅ `document` - check `typeof document`
- ✅ `navigator` - check `typeof navigator`

### **Pattern to Follow**
```typescript
// ❌ BAD - Will crash on server
const value = localStorage.getItem('key')

// ✅ GOOD - SSR safe
const value = typeof window !== 'undefined' 
  ? localStorage.getItem('key') 
  : null
```

### **Alternative Approaches**
1. **Use `useEffect`** - Only runs on client
2. **Dynamic imports** - Load only on client
3. **Client Components** - Use `"use client"` directive
4. **Cookies** - Available on both server and client

---

## 🎉 **Result**

**The localStorage error is now fixed!**

The place management page should now:
- ✅ Render correctly on the server
- ✅ Load without "localStorage is not defined" error
- ✅ Work properly in the browser
- ✅ Access authentication tokens when available
- ✅ Function without errors in both SSR and CSR

**The component is now fully SSR compatible!** 🚀

---

## 📝 **Next.js Best Practices**

### **1. Client-Only Code**
```typescript
"use client"  // Add this directive for client-only components
```

### **2. Dynamic Imports**
```typescript
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
)
```

### **3. useEffect Hook**
```typescript
useEffect(() => {
  // This only runs on client
  const token = localStorage.getItem('authToken')
}, [])
```

### **4. Check Window**
```typescript
if (typeof window !== 'undefined') {
  // Browser-only code
}
```

**Your place management API is now production-ready!** 🎊
