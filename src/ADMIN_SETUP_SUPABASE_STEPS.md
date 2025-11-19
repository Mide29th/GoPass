# 🎯 Setup Admin Account via Supabase Dashboard

## Step-by-Step Instructions (With Screenshots Guide)

### Step 1: Open Your Supabase Project
1. Go to https://supabase.com
2. Click on your GoPass project
3. You should see your project dashboard

---

### Step 2: Navigate to Table Editor
1. Look at the left sidebar
2. Click on **"Table Editor"** icon (looks like a table/grid)
3. You'll see a list of your tables

---

### Step 3: Find the KV Store Table
1. In the table list, find: **`kv_store_0f8d8d4a`**
2. Click on it
3. You'll see the table with columns: `key` and `value`

---

### Step 4: Insert New Row
1. Click the green **"Insert"** button (top right area)
2. Select **"Insert row"** from the dropdown
3. A form will appear

---

### Step 5: Fill in the Form

You'll see two fields:

#### Field 1: key
```
admin:credentials
```
**Copy this exactly** ☝️

#### Field 2: value
```json
{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"}
```

**⚠️ IMPORTANT:** 
- Replace `YourSecurePassword123!` with your actual password
- Keep the quotes and curly braces exactly as shown
- This is JSON format - don't add extra spaces

---

### Step 6: Save the Row
1. Click the **"Save"** button
2. You should see a success message
3. The new row will appear in your table

---

## ✅ Verify It Worked

After saving, you should see in your `kv_store_0f8d8d4a` table:

| key | value |
|-----|-------|
| admin:credentials | {"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"} |

---

## 🎉 You're Done! Now Login:

1. Go to your GoPass app
2. Scroll to the bottom of the homepage
3. Click **"Admin Access"**
4. Enter:
   - **Email:** `admin@gopass.com`
   - **Password:** (the password you just set)
5. Click **"Sign In"**

**Welcome to your Admin Dashboard!** 🚀

---

## 🔧 Troubleshooting

### "Table not found" error
- Make sure you ran the database setup SQL first
- Check that the table name is exactly: `kv_store_0f8d8d4a`

### Login not working
- Double-check the email and password match exactly
- Make sure you didn't add extra spaces in the JSON
- The value field should be valid JSON (use quotes around strings)

### Need to change password?
1. Go back to Table Editor → kv_store_0f8d8d4a
2. Find the row with key `admin:credentials`
3. Click the edit icon (pencil)
4. Update the password in the JSON
5. Save

---

## 📋 Quick Copy-Paste Values

**Key:**
```
admin:credentials
```

**Value (remember to change the password!):**
```json
{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"}
```

---

## 🎨 Example of What to Enter

When you click "Insert row", you'll see a form like this:

```
┌─────────────────────────────────────────────┐
│  Insert row into kv_store_0f8d8d4a          │
├─────────────────────────────────────────────┤
│                                             │
│  key *                                      │
│  ┌────────────────────────────────────┐   │
│  │ admin:credentials                   │   │
│  └────────────────────────────────────┘   │
│                                             │
│  value *                                    │
│  ┌────────────────────────────────────┐   │
│  │ {"id":"admin-1","email":"ad...     │   │
│  └────────────────────────────────────┘   │
│                                             │
│           [Cancel]  [Save]                 │
└─────────────────────────────────────────────┘
```

Just fill in those two fields and click Save!

---

That's it! Once you save, you can immediately login to your admin dashboard. 🎯
