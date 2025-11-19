# Paystack Subaccount Verification Guide

## Problem
The bank account setup banner is still showing even after completing the bank setup because the `subaccount_setup_complete` flag might not be properly set.

## Solutions

### 1. **Check Console Logs**
When you complete bank setup, check the browser console (F12 → Console) for:
- ✅ "Organizer saved to KV store: [user_id]"
- ✅ "Organizer data: { ... }" (should show the full object including `subaccount_setup_complete: true`)

### 2. **Use the Profile Settings Verification Button**
1. Go to **Profile** (Settings icon in dashboard)
2. Scroll to the **Payout Account** section
3. If you see a blue alert saying "We found a Paystack subaccount ID but it's not verified", click **"Verify Paystack Subaccount"**
4. This will:
   - Call Paystack API to verify the subaccount exists
   - Update the KV store with `subaccount_setup_complete: true`
   - Refresh your profile

### 3. **Verify Directly in Paystack Dashboard**
1. Login to your **Paystack Dashboard**: https://dashboard.paystack.com/
2. Navigate to **Settings** → **Subaccounts**
3. Check if your subaccount appears in the list
4. Note the **Subaccount Code** (e.g., `ACCT_xxxxxxxxxx`)
5. If it exists, use the "Verify Paystack Subaccount" button in GoPass Profile Settings

### 4. **Check KV Store Data (Debug)**
Open browser console and run:
```javascript
// This will show what's in the KV store
const response = await fetch(
  `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/make-server-0f8d8d4a/organizer/[YOUR_USER_ID]`,
  {
    headers: {
      'Authorization': 'Bearer [YOUR_ANON_KEY]'
    }
  }
);
const data = await response.json();
console.log('📊 Organizer Data:', data.organizer);
```

Look for:
- ✅ `paystack_subaccount_id`: Should have a value like `"ACCT_xxxxxxxxxx"`
- ✅ `subaccount_setup_complete`: Should be `true`
- ✅ `bank_name`, `account_number`, `account_name`: Should all be filled

### 5. **Manual Fix (If Needed)**
If the subaccount exists in Paystack but the flag isn't set:

1. Click **"Verify Paystack Subaccount"** in Profile Settings
2. This will:
   - Fetch the subaccount from Paystack API
   - Verify it exists
   - Update `subaccount_setup_complete: true` in KV store
   - Refresh the dashboard

### 6. **Re-do Bank Setup**
If verification still fails:
1. Go to **Setup Payout Account** from the dashboard
2. Re-enter your bank details
3. This will trigger the Make.com webhook again
4. Make sure the webhook returns a `subaccount_code` in the response

## How the System Works

### Bank Setup Flow:
1. **Organizer fills bank form** → BankDetailsForm
2. **Account verification** → Paystack API (verify account number)
3. **Webhook call** → Make.com (creates Paystack subaccount)
4. **Save to KV store** → `organizer:[userId]` with:
   - `paystack_subaccount_id`: The subaccount code from Make.com
   - `subaccount_setup_complete: true` (only if subaccount_code exists)

### Verification Flow:
1. **Click "Verify Subaccount"** → Profile Settings
2. **API call** → `POST /organizer/verify-subaccount`
3. **Paystack API check** → `GET /subaccount/[subaccount_id]`
4. **Update KV store** → Set `subaccount_setup_complete: true`

## Common Issues

### Issue: "Subaccount not found in Paystack"
**Cause:** The Make.com webhook didn't create the subaccount or failed
**Solution:** 
1. Check Make.com webhook logs
2. Verify Paystack API key is correct
3. Re-do bank setup

### Issue: Banner still showing after setup
**Cause:** The `subaccount_setup_complete` flag is `false` or missing
**Solution:**
1. Open Profile Settings
2. Click "Verify Paystack Subaccount"
3. Check console logs for verification result

### Issue: No verification button appears
**Cause:** Either:
- No subaccount ID exists at all (need to do bank setup first)
- Already marked as complete (banner shouldn't show)
**Solution:** 
1. If no bank setup done: Click "Setup Payout Account" from banner
2. If setup done but still showing: Check console logs

## Support Checklist

When debugging subaccount issues, check:
- [ ] User has completed bank setup form
- [ ] Make.com webhook was called successfully
- [ ] Make.com returned `subaccount_code` in response
- [ ] Subaccount exists in Paystack dashboard
- [ ] KV store has the organizer record with all fields
- [ ] `subaccount_setup_complete` is set to `true`
- [ ] Browser console shows no errors

## API Endpoints

### Get Organizer Profile
```
GET /make-server-0f8d8d4a/organizer/:userId
```

### Verify Subaccount
```
POST /make-server-0f8d8d4a/organizer/verify-subaccount
Body: { "userId": "..." }
```

### Save Organizer
```
POST /make-server-0f8d8d4a/organizer/save
Body: { "user_id": "...", "paystack_subaccount_id": "...", "subaccount_setup_complete": true, ... }
```
