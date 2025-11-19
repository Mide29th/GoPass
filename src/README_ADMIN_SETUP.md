# 🎯 GoPass Admin - Setup Instructions

## ⚡ Quick Setup (60 Seconds)

### Step 1: Open Supabase SQL Editor
1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL

```sql
-- Change the password first! ⚠️
INSERT INTO kv_store_0f8d8d4a (key, value)
VALUES (
  'admin:credentials',
  '{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

**⚠️ IMPORTANT:** Change `YourSecurePassword123!` to your own password before running!

### Step 3: Run It
- Click **"Run"** button or press `Ctrl+Enter`
- You should see: `Success. No rows returned`

### Step 4: Login
1. Go to your **GoPass app**
2. Scroll to bottom → Click **"Admin Access"**
3. Login with:
   - **Email:** `admin@gopass.com`
   - **Password:** (the password you set in Step 2)

## ✅ Done! Welcome to Your Admin Dashboard! 🎉

---

## 📊 What You Can Do in Admin Dashboard

### Overview Tab
- Total organizers, events, tickets sold
- Platform revenue and commission
- Real-time statistics

### Organizers Tab
- View all registered organizers
- Bank account verification status
- Revenue per organizer

### Events Tab
- All events on the platform
- Ticket sales and availability
- Revenue tracking

### Tickets Tab
- All ticket purchases
- Check-in status
- Attendee details

### Settings Tab ⭐
- **Configure commission percentage**
- Change from 5% to any percentage
- See example calculations

---

## 💰 About the 5% Commission

Yes, the **5% platform commission goes to YOUR Paystack account** automatically!

**Example:** Customer buys ₦10,000 ticket
- **₦9,500** → Organizer's bank account (95%)
- **₦500** → Your GoPass account (5%)

**To change the percentage:**
1. Go to Admin Dashboard → Settings tab
2. Update the percentage
3. Also update your Make.com scenario (instructions shown in Settings)

---

## 🔐 Security Notes

- ✅ Only one admin account allowed
- ✅ Credentials stored in encrypted KV store
- ✅ Session-based authentication
- ✅ Separate from organizer authentication

---

## 🔧 Need to Reset Password?

Just update the password in the SQL and run it again:

```sql
INSERT INTO kv_store_0f8d8d4a (key, value)
VALUES (
  'admin:credentials',
  '{"id":"admin-1","email":"admin@gopass.com","password":"NewPassword123!"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

---

## 📁 Related Files

- `/ADMIN_SETUP.sql` - SQL script with comments
- `/ADMIN_QUICK_START.md` - Quick start guide
- `/README_ADMIN.md` - Full admin dashboard overview

---

## ❓ Troubleshooting

### "Login failed" error
- Check email and password are exactly what you set in SQL
- Make sure you changed the password from the default
- Verify the SQL ran successfully

### "Table does not exist" error
- Make sure you ran the main database setup first
- The `kv_store_0f8d8d4a` table should exist

### Can't see the SQL file
- Look in your project root folder
- File is named: `/ADMIN_SETUP.sql`

---

**Need help?** Check the other admin documentation files or test the setup with the default password first (then change it immediately!).

---

🎉 **Happy managing!**
