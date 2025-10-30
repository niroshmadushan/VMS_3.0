# Quick Test Guide - Employee Login Fix

## 🎯 What Was Fixed

**Problem:** Employee accounts couldn't login - they were redirected back to the home page in a loop.

**Root Cause:** Authentication tokens and user data weren't being stored in localStorage for direct login (login without OTP).

**Solution:** Updated the authentication system to properly store tokens and user data for both OTP and direct login.

---

## 🧪 How to Test

### Quick Test (2 minutes)

1. **Open your browser** (Chrome/Edge recommended)
2. **Press F12** to open Developer Tools
3. **Go to Console tab** (to see debug logs)
4. **Navigate to your login page** (usually `http://localhost:3000`)
5. **Login with employee credentials**
6. **Watch the console** - you should see:
   ```
   ✅ Direct login success - storing authentication data
   ✅ AuthManager - Direct login success, updating state with user
   ✅ RouteProtection - User authorized. Role: employee
   ```
7. **Check the result:**
   - ✅ You should be on `/employee` dashboard
   - ✅ No redirect back to login
   - ✅ You can navigate to employee pages

### If It Still Doesn't Work

1. **Clear browser cache and localStorage:**
   - Press F12 → Application tab → Local Storage
   - Right-click → Clear
   - Refresh page (F5)

2. **Try again with console open** and look for errors

3. **Check these localStorage items after login:**
   - `authToken` - should have a JWT token
   - `userData` - should have user data (email, role, etc.)
   - `refreshToken` - should have a refresh token

---

## 📋 What to Look For

### ✅ Success Indicators

- Employee dashboard loads at `/employee`
- Navigation menu shows employee options
- No redirect loop
- Console shows successful auth state changes
- localStorage contains `authToken` and `userData`

### ❌ Failure Indicators

- Redirected back to login page immediately
- Console shows "User not authenticated"
- localStorage is empty or missing tokens
- Infinite redirect loop

---

## 🔍 Debug Logs to Check

After login, you should see these logs in console:

```
1. SignIn request to /api/auth/login with: { email: "..." }
2. SignIn API response: { success: true, ... }
3. Direct login success - storing authentication data  ← TOKEN STORED
4. AuthManager - Direct login success, updating state  ← STATE UPDATED
5. AuthProvider - State changed: { isAuthenticated: true, ... }  ← CONTEXT UPDATED
6. Redirecting to: /employee
7. getCurrentUser - Found stored user data: { ... }  ← USER FOUND
8. RouteProtection - User authorized. Role: employee  ← ACCESS GRANTED
```

If you don't see steps 3-4, the fix might not be applied correctly.

---

## 🚀 Next Steps After Testing

### If Login Works:
- ✅ Test creating bookings
- ✅ Test viewing calendar
- ✅ Test availability checker
- ✅ Test page refresh (should stay logged in)
- ✅ Test logout and login again

### If Login Still Fails:
1. Check browser console for errors
2. Verify API is running (`http://localhost:3000/health`)
3. Check if backend login API returns correct format:
   ```json
   {
     "success": true,
     "data": {
       "user": { "id": 1, "email": "...", "role": "employee", ... },
       "session": { "token": "...", "refreshToken": "..." }
     }
   }
   ```
4. Contact developer with console error logs

---

## 📝 Files That Were Changed

- `lib/custom-auth.ts` - Main authentication logic
- `lib/auth-context.tsx` - Authentication context provider
- `components/auth/route-protection.tsx` - Route protection component
- `components/auth/login-form.tsx` - Login form component

---

## ⚡ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Still redirects to home page | Clear localStorage and try again |
| Console shows "Token not found" | Backend might not be returning token in correct format |
| "User not authenticated" error | Check if API response has `user` and `session` fields |
| Page refresh logs you out | Check if token is being stored in localStorage |

---

## 💡 Tips

- **Keep DevTools console open** while testing - it shows detailed logs
- **Use Chrome/Edge** - better DevTools support
- **Test in Incognito mode** - ensures no cached data interferes
- **Check Network tab** - see actual API responses

---

## ✅ Checklist

Test these scenarios:

- [ ] Employee can login
- [ ] Employee dashboard loads
- [ ] Can access `/employee/my-bookings`
- [ ] Can access `/employee/create`
- [ ] Can access `/employee/calendar`
- [ ] Can access `/employee/availability`
- [ ] Page refresh keeps user logged in
- [ ] Logout works
- [ ] Can login again after logout
- [ ] Admin login still works
- [ ] Reception login still works

---

## 🎉 Success Criteria

**Employee login is FIXED when:**
1. ✅ Employee can login successfully
2. ✅ Dashboard loads without redirect
3. ✅ Can navigate all employee pages
4. ✅ localStorage has `authToken` and `userData`
5. ✅ Console shows successful authentication logs
6. ✅ Page refresh doesn't log out user

---

**Need help?** Check `EMPLOYEE_LOGIN_FIX.md` for detailed technical information.



