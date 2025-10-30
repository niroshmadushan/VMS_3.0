# Email Configuration Guide - Fix "Error sending confirmation email"

## 🚨 Common Causes of Email Confirmation Errors

### 1. **Email Confirmations Not Enabled** ⚠️
**Most Common Cause**

**Check in Supabase Dashboard:**
1. Go to `https://supa.minimart.best`
2. Navigate to **Authentication → Settings**
3. Look for "Email confirmations" setting

**Solution:**
- Enable "Email confirmations"
- Set "Enable email change confirmations" to ON
- Save the settings

---

### 2. **SMTP Not Configured** 📧
**Default Supabase Email Service**

**Check:**
- Are you using Supabase's default email service?
- Do you have SMTP configured?

**Solution:**
- **Option A**: Use Supabase's default email service (recommended for testing)
- **Option B**: Configure custom SMTP (for production)

---

### 3. **Email Templates Not Set Up** 📝
**Missing Email Templates**

**Check:**
- Did you run the email configuration SQL script?
- Are email templates properly configured?

**Solution:**
Run the email configuration script:
```sql
-- Run supabase-email-config-fixed.sql in your Supabase dashboard
```

---

### 4. **Email Rate Limiting** ⏱️
**Too Many Email Requests**

**Check:**
- Are you sending too many emails quickly?
- Is there a rate limit on your email service?

**Solution:**
- Wait a few minutes between email attempts
- Check your email service rate limits

---

## 🔧 Step-by-Step Fix Guide

### Step 1: Enable Email Confirmations in Supabase Dashboard

1. **Go to your Supabase dashboard:**
   - Visit `https://supa.minimart.best`
   - Navigate to **Authentication → Settings**

2. **Enable email confirmations:**
   - Find "Email confirmations" section
   - Toggle "Enable email confirmations" to **ON**
   - Toggle "Enable email change confirmations" to **ON**
   - Click **Save**

### Step 2: Run Email Configuration SQL Script

1. **Go to SQL Editor:**
   - In your Supabase dashboard, go to **SQL Editor**

2. **Run the email configuration script:**
   - Copy the contents of `supabase-email-config-fixed.sql`
   - Paste it in the SQL Editor
   - Click **Run**

### Step 3: Configure Email Templates (Optional)

1. **Go to Email Templates:**
   - Navigate to **Authentication → Email Templates**

2. **Customize templates:**
   - Click on "Confirm signup" template
   - Customize the subject and body
   - Save changes

### Step 4: Test Email Sending

1. **Use the diagnostic tool:**
   - Visit `http://localhost:3000/troubleshoot-email`
   - Run the email diagnostics
   - Test email sending

2. **Try signing up:**
   - Go to your signup page
   - Create a new account
   - Check if confirmation email is sent

---

## 🎯 Quick Solutions

### Solution 1: Use Supabase Default Email Service (Easiest)

1. **Enable email confirmations** in Supabase dashboard
2. **Run the email configuration SQL script**
3. **Test with a real email address**

### Solution 2: Configure Custom SMTP (For Production)

1. **Choose an email service:**
   - SendGrid
   - AWS SES
   - Mailgun
   - Gmail SMTP

2. **Configure SMTP in Supabase:**
   - Go to **Authentication → Settings → SMTP Settings**
   - Enter your SMTP credentials
   - Test the connection

3. **Example SMTP Configuration:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: your_sendgrid_api_key
   ```

---

## 🧪 Testing Email Configuration

### Test 1: Use the Diagnostic Tool
Visit: `http://localhost:3000/troubleshoot-email`

### Test 2: Manual Email Test
```typescript
// Test in your browser console:
const supabase = createClient(
  'https://supa.minimart.best',
  'your_anon_key'
)

// Test password reset email
supabase.auth.resetPasswordForEmail('your-email@example.com')
  .then(console.log)
  .catch(console.error)
```

### Test 3: Check Supabase Logs
1. Go to **Logs → Auth** in your Supabase dashboard
2. Look for email-related entries
3. Check for any error messages

---

## 🚨 Troubleshooting Common Issues

### Issue: "Email confirmation disabled"
**Solution:** Enable email confirmations in Authentication → Settings

### Issue: "SMTP connection failed"
**Solution:** Check your SMTP credentials and network connection

### Issue: "Email template not found"
**Solution:** Run the email configuration SQL script

### Issue: "Rate limit exceeded"
**Solution:** Wait a few minutes before trying again

### Issue: "Invalid email address"
**Solution:** Use a valid email address format

---

## 📋 Email Configuration Checklist

- ✅ Email confirmations enabled in Supabase dashboard
- ✅ Email configuration SQL script executed
- ✅ Email templates configured (optional)
- ✅ SMTP configured (if using custom email service)
- ✅ Test email sending works
- ✅ Check spam folder for confirmation emails

---

## 🎉 Success Indicators

You'll know email configuration is working when:

1. **No error messages** when signing up
2. **Confirmation emails** are received (check spam folder)
3. **Email diagnostics** show all green checkmarks
4. **Supabase logs** show successful email sending

---

## 🆘 Still Having Issues?

### Check These:
1. **Supabase dashboard** - Is email confirmation enabled?
2. **SQL scripts** - Did you run both authentication and email scripts?
3. **Email address** - Are you using a valid email address?
4. **Spam folder** - Check if emails are going to spam
5. **Rate limits** - Wait between email attempts

### Debug Steps:
1. **Run email diagnostics**: `http://localhost:3000/troubleshoot-email`
2. **Check Supabase logs**: Dashboard → Logs → Auth
3. **Test with different email**: Try a different email address
4. **Check network**: Ensure your VM can send emails

The most common fix is simply **enabling email confirmations** in your Supabase dashboard! 🚀

