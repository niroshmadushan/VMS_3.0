# Authentication Troubleshooting Guide

## 🚨 "Invalid authentication credentials" Error - Common Causes & Solutions

### 1. **Environment Variables Not Set** ⚠️
**Most Common Cause**

**Check:**
- Do you have a `.env.local` file in your project root?
- Are the environment variables correctly named?

**Solution:**
Create `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://supa.minimart.best
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get your keys from:**
1. Go to `https://supa.minimart.best`
2. Settings → API
3. Copy the `anon` key and `service_role` key

---

### 2. **Wrong Supabase URL** 🔗
**Check:**
- Is your URL exactly `https://supa.minimart.best`?
- No trailing slash?
- Using `https://` not `http://`?

**Solution:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://supa.minimart.best
```

---

### 3. **Invalid API Keys** 🔑
**Check:**
- Are you using the correct `anon` key (not `service_role` key)?
- Is the key complete (not truncated)?
- Are there any extra spaces or characters?

**Solution:**
- Copy the key directly from Supabase dashboard
- Don't modify the key in any way
- Make sure it's the `anon` key for client-side use

---

### 4. **Development Server Not Restarted** 🔄
**Check:**
- Did you restart your development server after adding environment variables?

**Solution:**
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
# or
pnpm dev
```

---

### 5. **Supabase Instance Not Running** 🖥️
**Check:**
- Is your VM Supabase instance running?
- Can you access `https://supa.minimart.best` in your browser?

**Solution:**
- Start your Supabase VM instance
- Verify it's accessible at `https://supa.minimart.best`

---

### 6. **SQL Scripts Not Executed** 📝
**Check:**
- Did you run the SQL scripts in your Supabase dashboard?
- Are there any errors in the SQL execution?

**Solution:**
1. Go to `https://supa.minimart.best` → SQL Editor
2. Run `supabase-auth-setup-fixed.sql`
3. Run `supabase-email-config-fixed.sql`

---

### 7. **Network/Firewall Issues** 🌐
**Check:**
- Can you access other websites?
- Is your firewall blocking the connection?

**Solution:**
- Check your internet connection
- Temporarily disable firewall/antivirus
- Try accessing `https://supa.minimart.best` directly

---

## 🔧 Quick Diagnostic Steps

### Step 1: Check Environment Variables
```bash
# In your project root, check if .env.local exists:
ls -la .env.local

# If it doesn't exist, create it:
touch .env.local
```

### Step 2: Verify Supabase Connection
Visit: `http://localhost:3000/test-supabase`

### Step 3: Run Full Diagnostics
Visit: `http://localhost:3000/troubleshoot-auth`

### Step 4: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to sign up
4. Look for any error messages

---

## 🎯 Most Likely Solutions (in order)

1. **Create `.env.local` file** with correct environment variables
2. **Restart your development server**
3. **Verify your Supabase keys** are correct
4. **Check your Supabase URL** is exactly right
5. **Run the SQL scripts** in your Supabase dashboard

---

## 🆘 Still Having Issues?

### Check These Files:
- ✅ `.env.local` exists and has correct values
- ✅ `supabase-auth-setup-fixed.sql` was executed
- ✅ `supabase-email-config-fixed.sql` was executed
- ✅ Development server was restarted
- ✅ Supabase VM is running and accessible

### Debug Information to Collect:
1. **Environment variables** (without showing the actual keys)
2. **Browser console errors**
3. **Supabase dashboard logs**
4. **Network tab** in browser developer tools

### Test with Simple Connection:
```typescript
// Test this in your browser console:
const supabase = createClient(
  'https://supa.minimart.best',
  'your_anon_key_here'
)

supabase.auth.getSession().then(console.log)
```

---

## 📞 Need More Help?

If you're still having issues after following this guide:

1. **Run the diagnostic tool**: `http://localhost:3000/troubleshoot-auth`
2. **Check the connection test**: `http://localhost:3000/test-supabase`
3. **Verify your Supabase dashboard** is accessible
4. **Double-check all environment variables**

The most common issue is missing or incorrect environment variables. Make sure your `.env.local` file is properly configured and restart your development server! 🚀

