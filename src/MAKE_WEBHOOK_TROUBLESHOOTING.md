# Make.com Webhook Troubleshooting Guide

## Problem: Paystack Subaccount Not Being Created

When organizers submit their bank details, the data should flow:
1. ✅ Form submission → Supabase database (WORKING)
2. ❌ Make.com webhook → Paystack API (NOT WORKING)
3. ❌ Paystack returns subaccount_code → Saved to Supabase (NOT HAPPENING)

---

## Step-by-Step Debugging

### Step 1: Check Browser Console Logs

After submitting the bank details form, open **DevTools Console** (F12) and look for:

```
=== SENDING TO MAKE.COM WEBHOOK ===
Webhook URL: https://hook.us2.make.com/er8nxs21ga1aso4dj30ac9r4566nx1jv
Payload: {
  "organizer_id": "...",
  "bank_code": "058",
  "account_number": "...",
  "account_name": "...",
  "email": "...",
  "business_name": "..."
}

=== MAKE.COM RESPONSE ===
Status: ???
Response Body: ???
```

**What to look for:**
- ✅ Status: 200 = Webhook received successfully
- ❌ Status: 404 = Webhook URL doesn't exist
- ❌ Status: 500 = Make.com scenario has an error
- ❌ Network error = CORS or connectivity issue

---

### Step 2: Verify Make.com Scenario is Active

1. Go to **Make.com** → **Scenarios**
2. Find your **"Organizer Onboarding"** scenario
3. Check if it's **ON** (green toggle)
4. If it's OFF, turn it ON

---

### Step 3: Check Make.com Execution History

1. In Make.com, open your **Organizer Onboarding scenario**
2. Click **"History"** tab at the bottom
3. Look for recent executions when you submitted the form
4. Click on an execution to see:
   - ✅ Did it receive the webhook data?
   - ✅ What data was received?
   - ❌ Did any module fail? (red X icon)
   - ❌ What error message is shown?

**Common errors:**
- "Invalid API key" → Check your Paystack API key in Make.com
- "Account already exists" → Bank account already has a subaccount
- "Invalid bank code" → Bank code format issue
- No execution shown → Webhook URL is wrong or scenario is OFF

---

### Step 4: Verify Webhook URL Match

**In your code:** `/lib/webhooks-config.ts`
```typescript
export const WEBHOOK_ORGANIZER_ONBOARDING = 'https://hook.us2.make.com/er8nxs21ga1aso4dj30ac9r4566nx1jv';
```

**In Make.com:**
1. Open your Organizer Onboarding scenario
2. Click the first **Webhook module**
3. Copy the webhook URL shown
4. **Compare:** Does it EXACTLY match the URL in your code?

If they don't match → Update the URL in `/lib/webhooks-config.ts`

---

### Step 5: Check Paystack API Configuration

Your Make.com scenario should have these modules:

1. **Webhook** → Receives data from GoPass app
2. **HTTP Request to Paystack** → Creates subaccount
   - URL: `https://api.paystack.co/subaccount`
   - Method: POST
   - Headers: `Authorization: Bearer sk_live_YOUR_SECRET_KEY`
   - Body:
     ```json
     {
       "business_name": "{{webhook.business_name}}",
       "settlement_bank": "{{webhook.bank_code}}",
       "account_number": "{{webhook.account_number}}",
       "percentage_charge": 95,
       "description": "GoPass Organizer: {{webhook.email}}"
     }
     ```
3. **Webhook Response** → Returns subaccount_code to GoPass app
   - Body:
     ```json
     {
       "subaccount_code": "{{paystack_response.data.subaccount_code}}",
       "status": "success"
     }
     ```

**Verify:**
- ✅ Paystack API key is correct (starts with `sk_test_` or `sk_live_`)
- ✅ `percentage_charge: 95` means organizer gets 95%, platform gets 5%
- ✅ Module mapping uses correct field names from webhook

---

### Step 6: Test with Paystack Directly

Try creating a subaccount manually via Postman/cURL:

```bash
curl https://api.paystack.co/subaccount \
  -H "Authorization: Bearer YOUR_PAYSTACK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Business",
    "settlement_bank": "058",
    "account_number": "0123456789",
    "percentage_charge": 95,
    "description": "Test subaccount"
  }'
```

**Expected response:**
```json
{
  "status": true,
  "message": "Subaccount created",
  "data": {
    "subaccount_code": "ACCT_xxxxxxxxxx",
    ...
  }
}
```

If this fails → Problem is with Paystack API (wrong key, invalid bank details, etc.)

---

### Step 7: Common Issues & Fixes

#### Issue: Make.com webhook returns 200 but no subaccount_code

**Cause:** Scenario received data but didn't return the subaccount code

**Fix:**
1. In Make.com, add a **Webhook Response** module at the end
2. Set Status: 200
3. Set Body:
   ```json
   {
     "subaccount_code": "{{paystack.data.subaccount_code}}",
     "status": "success"
   }
   ```

---

#### Issue: Paystack says "Account already exists"

**Cause:** This bank account already has a Paystack subaccount

**Fix:**
1. In Paystack Dashboard → Subaccounts
2. Find the existing subaccount
3. Copy the `subaccount_code` (e.g., `ACCT_xxxxxxxxxx`)
4. Manually update Supabase:
   ```sql
   UPDATE organizers 
   SET paystack_subaccount_id = 'ACCT_xxxxxxxxxx',
       subaccount_setup_complete = true
   WHERE email = 'organizer@email.com';
   ```

---

#### Issue: CORS error in browser console

**Cause:** Make.com webhook needs to allow requests from your domain

**Fix:** Unfortunately, Make.com webhooks don't support CORS headers. You'll need to:
1. Create a proxy endpoint in your Supabase Edge Function
2. OR use Make.com's "Return JSON" setting
3. OR use Make.com API instead of webhooks

**Alternative approach:** Call Make.com from Supabase Edge Function (server-side):
```typescript
// In /supabase/functions/server/index.tsx
app.post('/make-server-0f8d8d4a/create-subaccount', async (c) => {
  const body = await c.req.json();
  
  const response = await fetch(WEBHOOK_ORGANIZER_ONBOARDING, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  return c.json(await response.json());
});
```

---

## Quick Checklist

- [ ] Make.com scenario is ACTIVE (ON)
- [ ] Webhook URL in code matches Make.com webhook URL
- [ ] Paystack API key is valid and correct
- [ ] Bank code is valid (e.g., "058" for GTBank)
- [ ] Account number is 10 digits
- [ ] Make.com scenario has Webhook Response module
- [ ] Browser console shows status 200 from webhook
- [ ] Make.com history shows successful execution
- [ ] Paystack subaccount was created (check Paystack Dashboard)

---

## Next Steps

1. **Submit the form again** with the improved logging
2. **Copy the console logs** (everything from `=== SENDING TO MAKE.COM ===` to end)
3. **Check Make.com execution history**
4. **Share findings** so we can identify the exact issue

The enhanced logging will show exactly what's being sent and what response is received!
