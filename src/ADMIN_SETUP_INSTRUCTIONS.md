# GoPass Admin Dashboard Setup Instructions

## 🎉 Your Admin Dashboard is Ready!

You now have a **fully functional admin dashboard** with access to all organizers, events, tickets, and settings!

---

## 📝 Setup Admin Credentials

To access the admin dashboard, you need to create admin credentials. Here's how:

### Step 1: Access the Admin Panel

1. Go to your GoPass home page
2. Scroll to the bottom and click **"Admin Access"**

### Step 2: Create Admin Login (One-Time Setup)

You need to store your admin credentials in the KV store. You have two options:

#### Option A: Use the Server Endpoint (Recommended)

Run this command in your browser console or use a tool like Postman:

```javascript
// Replace with your details
const adminEmail = "admin@gopass.com";
const adminPassword = "your-secure-password-here";

await fetch(
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0f8d8d4a/setup-admin',
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
```

#### Option B: Manual Setup via Database

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **kv_store_0f8d8d4a**
3. Click **"Insert" → "Insert row"**
4. Add this row:

| key | value |
|-----|-------|
| `admin:credentials` | `{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePasswordHere"}` |

---

## 🔐 Login to Admin Dashboard

1. Click **"Admin Access"** on the home page
2. Enter your admin email and password
3. Click **"Sign In"**

---

## 🎨 Admin Dashboard Features

### 1. **Overview Tab**
- Total organizers, events, and tickets
- Revenue breakdown (total, platform commission, organizer earnings)
- Check-in statistics
- Real-time metrics

### 2. **Organizers Tab**
- View all registered organizers
- See their bank account status
- Track events created and revenue earned
- Search by name or email

### 3. **Events Tab**
- View all events across the platform
- See ticket sales and revenue per event
- Filter by status (Past, Today, Upcoming)
- Search by event name, organizer, or location

### 4. **Tickets Tab**
- View all ticket purchases
- See check-in status
- Search by ticket ID, event, or attendee
- Monitor attendance rates

### 5. **Settings Tab**
- **Configure commission percentage** (currently 5%)
- View and update platform settings
- See example revenue calculations
- Instructions for updating Make.com webhook

---

## 💰 Commission Management

### Current Setup
- **Default commission:** 5% to GoPass
- **Organizer gets:** 95% of ticket sales

### How to Change Commission

1. **Go to Settings tab** in admin dashboard
2. **Update the percentage** (e.g., change 5 to 7 for 7%)
3. **Click "Save"**
4. **Update Make.com scenario:**
   - Open your "Organizer Onboarding" scenario
   - Edit the HTTP module (creates Paystack subaccount)
   - Update `percentage_charge` parameter to match new %
   - Save the scenario

**Note:** This only affects NEW organizers. Existing organizers keep their current commission rate.

---

## 🔧 Security Notes

- Admin credentials are stored in KV store (NOT in the database)
- Each login generates a unique session token
- Sessions are validated on every admin request
- Admin panel is completely separate from organizer auth

---

## 🚨 Troubleshooting

### Can't Login?
- Make sure you've set up admin credentials in KV store
- Check that email/password match exactly
- Look at browser console for error messages

### No Data Showing?
- Ensure you have created events and sold tickets
- Check that Supabase is properly connected
- Verify database tables exist

### Commission Not Updating?
- Remember to update both admin settings AND Make.com
- New percentage only applies to new organizers
- Check Make.com scenario logs

---

## 📊 What You Can Do Now

✅ **View all platform data** in one dashboard  
✅ **Monitor revenue** and commission earnings  
✅ **Manage organizers** and their accounts  
✅ **Track events** and attendance  
✅ **Configure commission** percentage  
✅ **Access anywhere** - fully web-based  

---

## 🎯 Next Steps

1. Set up your admin credentials (see above)
2. Login to the admin dashboard
3. Explore the different tabs
4. Adjust commission percentage if needed
5. Monitor your platform's growth!

---

**Your GoPass admin dashboard is complete and ready to use!** 🚀

Need help? Check the server logs or database for any issues.
