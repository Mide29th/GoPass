# 🚀 Admin Setup - 2 Minutes!

## Super Simple Steps:

### 1️⃣ Open Supabase SQL Editor
- Go to your Supabase Dashboard
- Click **SQL Editor** in the left sidebar (icon looks like `</>`)

### 2️⃣ Copy the SQL
Open the file `/ADMIN_SETUP.sql` and copy the SQL

**OR copy this:**

```sql
INSERT INTO kv_store_0f8d8d4a (key, value)
VALUES (
  'admin:credentials',
  '{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
```

### 3️⃣ Change the Password
⚠️ **IMPORTANT:** Change `YourSecurePassword123!` to your own password

### 4️⃣ Run the SQL
- Paste the SQL into the editor
- Click **"Run"** or press `Ctrl+Enter`
- You should see: `Success. No rows returned`

### 5️⃣ Login to Admin Dashboard
1. Go to your GoPass app
2. Scroll to bottom → Click **"Admin Access"**
3. Enter:
   - Email: `admin@gopass.com`
   - Password: (the password you just set)
4. Click **Sign In**

## ✅ Done! 

You're now in the Admin Dashboard with full control! 🎉

---

## 🔄 Need to Change Password?

Just update the password in the SQL and run it again. The `ON CONFLICT` part means it will update instead of creating a duplicate.

---

## 🎯 What You Can Do Now:

- ✅ View all organizers, events, and tickets
- ✅ Monitor platform revenue and commission
- ✅ Configure commission percentage
- ✅ Track check-ins and attendance
- ✅ Search and filter everything

---

**That's it! Enjoy your admin dashboard!** 🚀
