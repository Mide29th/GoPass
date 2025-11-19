# 🚀 Quick Admin Setup - GoPass

## Create Your Admin Account (30 seconds!)

### Option 1: Browser Console (Easiest) ⭐

1. **Open your GoPass app** in the browser
2. **Press F12** (or right-click → Inspect) to open Developer Tools
3. **Click on the "Console" tab**
4. **Copy and paste this code** (replace with your details):

```javascript
// 👇 REPLACE THESE WITH YOUR DESIRED CREDENTIALS
const adminEmail = "admin@gopass.com";
const adminPassword = "YourSecurePassword123!";

// 👇 COPY EVERYTHING BELOW (don't change this part)
(async () => {
  try {
    const response = await fetch(
      window.location.origin.replace('localhost:5173', 'YOUR_PROJECT_ID.supabase.co') + '/functions/v1/make-server-0f8d8d4a/setup-admin',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_PUBLIC_ANON_KEY',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Admin account created!');
      console.log('📧 Email:', result.email);
      console.log('🔐 Use your password to login');
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }
})();
```

5. **Press Enter**
6. **Done!** You'll see a success message

---

### Option 2: Using Postman/Insomnia/Thunder Client

**Endpoint:**
```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0f8d8d4a/setup-admin
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_PUBLIC_ANON_KEY
```

**Body (JSON):**
```json
{
  "email": "admin@gopass.com",
  "password": "YourSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Admin account created successfully!",
  "email": "admin@gopass.com"
}
```

---

### Option 3: Using cURL

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0f8d8d4a/setup-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PUBLIC_ANON_KEY" \
  -d '{
    "email": "admin@gopass.com",
    "password": "YourSecurePassword123!"
  }'
```

---

## Where to Find YOUR_PROJECT_ID and YOUR_PUBLIC_ANON_KEY

Look in your code at `/utils/supabase/info.tsx` - they're already in your app!

Or check your Supabase project dashboard → Settings → API

---

## ✅ After Setup

1. Go to your GoPass homepage
2. Scroll to the bottom
3. Click **"Admin Access"**
4. Login with the email and password you just created
5. Enjoy your admin dashboard! 🎉

---

## 🔒 Security Notes

- Admin credentials are stored in **encrypted KV store** (not the database)
- Each login creates a **unique session token**
- Only **one admin account** can exist (protects against unauthorized admin creation)
- Change your password regularly!

---

## ⚠️ Troubleshooting

### "Admin already exists" error
- Admin account was already created
- Try logging in with your existing credentials
- If you forgot your password, contact support or manually update the KV store

### "Unauthorized" or "Failed to create"
- Check that your Supabase connection is active
- Verify the PROJECT_ID and ANON_KEY are correct
- Check browser console for detailed error messages

### Can't login after creating account
- Make sure you're using the exact email and password
- Check for typos (passwords are case-sensitive)
- Try creating the account again (delete the old one from KV store first)

---

## 🎯 What You Can Do in Admin Dashboard

✅ View all organizers and their stats  
✅ Monitor all events and ticket sales  
✅ Track revenue and commission  
✅ Configure platform commission percentage  
✅ View all tickets and check-in status  
✅ Search and filter everything  

---

**Need help?** Check the full instructions in `/ADMIN_SETUP_INSTRUCTIONS.md`
