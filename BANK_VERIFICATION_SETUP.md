# Bank Verification Setup Guide

## Overview
The GoPass bank verification system integrates Paystack for real-time account verification. This guide explains how test mode and production mode work.

## Test Mode (Development) - Bank Code 001

**When to use:** Development and testing

**How it works:**
- Use bank code `001` (test/synthetic code)
- Use any account number with 10+ digits (e.g., `0102027322`)
- Verification is **instant** with mock data: `TEST ACCOUNT - {accountNumber}`
- No Paystack API calls needed
- Perfect for UI testing and workflows

**Example:**
```
Bank: Test Bank (001)
Account: 0102027322
Result: ✅ Instant verification as "TEST ACCOUNT - 0102027322"
```

## Production Mode (Real Accounts)

**When to use:** Production environment or testing real organizer accounts

**How it works:**
- Use real Nigerian bank codes (044 = Access Bank, 058 = GTB, etc.)
- Paystack verifies the actual account number
- Returns real account holder name
- **Requirements:**
  - Paystack account must be in **LIVE MODE**
  - Current Paystack key must be `sk_live_*` (not `sk_test_*`)

### Paystack Account Upgrade

Your Paystack account is currently in **TEST MODE**:
- ✅ Test bank codes (001) work instantly without Paystack
- ❌ Real bank codes limited to 3 verifications per day
- ❌ Hit daily limit? Must wait until next day

**To upgrade to LIVE MODE:**
1. Visit https://dashboard.paystack.com
2. Complete identity verification
3. Verify bank account ownership
4. Account status changes to "Live"
5. Update `.env.local` with live secret key:
   ```
   PAYSTACK_SECRET_KEY=sk_live_530991a59b7b6529203649acc4111141c2c06119
   ```
6. Restart development server

## Current Configuration

**`.env.local` Status:**
```
PAYSTACK_SECRET_KEY=sk_test_c76380075b97a795cce7713aa85a827de45b558a
```
- ✅ Test bank code 001: Works perfectly
- ❌ Real bank codes: 3 per day limit (currently exhausted)

## Testing the Workflow

### Option 1: Test Mode (Recommended for Development)
```
1. Open http://localhost:3001
2. Select "Test Bank" (code 001)
3. Enter any account number: 0102027322
4. ✅ Verification instant
5. Complete organizer setup
```

### Option 2: Production Mode (After Paystack Upgrade)
```
1. Upgrade Paystack account to LIVE MODE
2. Update .env.local with live secret key
3. Restart dev server
4. Select real bank (e.g., "Access Bank" - 044)
5. Enter real account number
6. ✅ Paystack verifies real account
7. Complete organizer setup
```

## Make.com Integration

After bank verification (whether test or real):
1. Organizer data saved to Supabase KV store
2. Make.com webhook triggered: `https://hook.us2.make.com/cl2nnrnpemh1uuhuxn6b3dw6jjwd1uny`
3. Make.com creates Paystack subaccount
4. Success banner displayed

## Troubleshooting

**Q: Getting "Daily limit exceeded" error?**
A: You're using a real bank code (044, 058, etc.) and test mode account. Either:
   - Switch to test bank code 001
   - Wait until tomorrow (daily limit resets)
   - Upgrade to LIVE MODE for unlimited verifications

**Q: Why does test bank code 001 show as "Test Bank"?**
A: Bank code 001 is Paystack's synthetic test code, mapped to "Test Bank" in the bank list.

**Q: Can I use other bank codes for testing?**
A: Not without upgrading to LIVE MODE. Bank codes 044, 058, etc. are real Nigerian banks requiring real Paystack verification.

## Code Locations

- **Frontend:** `src/components/BankDetailsForm.tsx` (lines ~167 - test bank code list)
- **Backend:** `src/supabase/functions/server/index.tsx` (endpoint `/verify-account`)
- **Environment:** `.env.local` (Paystack credentials)

## Related Files

- `test-mock-banks.js` - Test script for mock verification with code 001
- `test-real-accounts.js` - Test script for real accounts (requires live mode)
- `test-bank-workflow.js` - End-to-end workflow test
