# GoPass - Paystack Integration Setup Guide

## Overview

GoPass uses Paystack's Split Payment Architecture to automatically handle payments and send instant payouts directly to organizers' bank accounts. This is powered by three Make.com scenarios that automate the entire workflow.

## Architecture

```
┌─────────────────┐
│   Organizer     │
│   Signup/Login  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Workflow A: Organizer Onboarding│
│ (Bank Account → Subaccount)     │
└────────────┬────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Create Event     │
    └────────┬─────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Workflow B: Event Creation      │
│ (Create Paystack Payment Page)  │
└────────────┬────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Attendee Buys    │
    │ Ticket           │
    └────────┬─────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Workflow C: Ticket Fulfillment  │
│ (Auto-split, Notifications)     │
└─────────────────────────────────┘
```

## Prerequisites

1. **Paystack Account**: Sign up at https://paystack.com/
2. **Make.com Account**: Sign up at https://www.make.com/
3. **Supabase Project**: Already configured in your GoPass app
4. **Email Service**: Gmail or SendGrid
5. **WhatsApp Business API** (optional): 360dialog or Wati
6. **Telegram/Slack** (optional): For organizer notifications

## Workflow A: Organizer Onboarding

### Purpose
When an organizer submits their bank account details, this workflow creates a Paystack subaccount that will receive split payments.

### Make.com Scenario Steps

1. **Webhook Trigger**
   - Create a new scenario in Make.com
   - Add a "Webhooks > Custom webhook" module
   - Copy the webhook URL
   - Paste it into GoPass → Webhook Settings → "Workflow A: Organizer Onboarding Webhook"

2. **Paystack - Create Subaccount**
   - Add "HTTP > Make a request" module
   - Method: `POST`
   - URL: `https://api.paystack.co/subaccount`
   - Headers:
     - `Authorization`: `Bearer YOUR_PAYSTACK_SECRET_KEY`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "business_name": "{{webhook.name}}",
       "settlement_bank": "{{webhook.bank_code}}",
       "account_number": "{{webhook.account_number}}",
       "percentage_charge": 5
     }
     ```

3. **Supabase - Update Organizer**
   - Add "Supabase > Update a row" module
   - Table: `organizers`
   - Filter: `user_id = {{webhook.user_id}}`
   - Data:
     ```json
     {
       "paystack_subaccount_id": "{{paystack.subaccount_code}}",
       "subaccount_setup_complete": true,
       "updated_at": "{{now}}"
     }
     ```

4. **Response**
   - Add "Webhooks > Webhook response" module
   - Status: `200`
   - Body:
     ```json
     {
       "success": true,
       "subaccount_code": "{{paystack.subaccount_code}}"
     }
     ```

---

## Workflow B: Event Creation & Payment Page

### Purpose
When an organizer creates an event, this workflow creates a Paystack payment page with automatic split payment configuration.

### Make.com Scenario Steps

1. **Webhook Trigger**
   - Create a new scenario
   - Add "Webhooks > Custom webhook"
   - Copy the webhook URL
   - Paste it into GoPass → Webhook Settings → "Workflow B: Event Creation Webhook"

2. **Supabase - Get Organizer Subaccount**
   - Add "Supabase > Search rows" module
   - Table: `organizers`
   - Filter: `user_id = {{webhook.organizer_id}}`
   - Select: `paystack_subaccount_id`

3. **Tools - Set Variables**
   - Add "Tools > Set multiple variables" module
   - Variables:
     - `price_kobo`: `{{webhook.price * 100}}`
     - `commission_kobo`: `{{webhook.price * 100 * 0.05}}`

4. **Paystack - Create Payment Page**
   - Add "HTTP > Make a request" module
   - Method: `POST`
   - URL: `https://api.paystack.co/page`
   - Headers:
     - `Authorization`: `Bearer YOUR_PAYSTACK_SECRET_KEY`
     - `Content-Type`: `application/json`
   - Body:
     ```json
     {
       "name": "{{webhook.event_name}}",
       "description": "Buy ticket for {{webhook.event_name}}",
       "amount": "{{price_kobo}}",
       "split_code": "",
       "metadata": {
         "event_id": "{{webhook.event_id}}",
         "organizer_id": "{{webhook.organizer_id}}"
       }
     }
     ```
   - Note: You need to create a split code first using Paystack's Split API

5. **Alternative: Create Split Payment**
   - Before step 4, add another HTTP request to create a split
   - Method: `POST`
   - URL: `https://api.paystack.co/split`
   - Body:
     ```json
     {
       "name": "Split for {{webhook.event_name}}",
       "type": "percentage",
       "currency": "NGN",
       "subaccounts": [
         {
           "subaccount": "{{supabase.paystack_subaccount_id}}",
           "share": 95
         }
       ],
       "bearer_type": "account",
       "bearer_subaccount": "{{supabase.paystack_subaccount_id}}"
     }
     ```

6. **Supabase - Update Event**
   - Add "Supabase > Update a row" module
   - Table: `events`
   - Filter: `id = {{webhook.event_id}}`
   - Data:
     ```json
     {
       "paystack_page_url": "{{paystack.url}}"
     }
     ```

7. **Response**
   - Add "Webhooks > Webhook response" module
   - Status: `200`
   - Body:
     ```json
     {
       "success": true,
       "paystack_page_url": "{{paystack.url}}"
     }
     ```

---

## Workflow C: Ticket Sale & Fulfillment

### Purpose
When a ticket is purchased, Paystack automatically splits the payment, then this workflow generates tickets and sends notifications.

### Make.com Scenario Steps

1. **Paystack Webhook Trigger**
   - In your Paystack Dashboard → Settings → Webhooks
   - Add webhook URL from Make.com
   - Events to listen for: `charge.success`

2. **Make.com Webhook**
   - Create new scenario
   - Add "Webhooks > Custom webhook"
   - Configure to receive Paystack webhooks

3. **Tools - Generate Ticket ID**
   - Add "Tools > Generate UUID" module
   - Store as variable: `ticket_id`

4. **Supabase - Get Event Details**
   - Add "Supabase > Search rows"
   - Table: `events`
   - Filter: `id = {{paystack.metadata.event_id}}`

5. **Supabase - Insert Order/Ticket**
   - Add "Supabase > Insert a row"
   - Table: `orders`
   - Data:
     ```json
     {
       "event_id": "{{paystack.metadata.event_id}}",
       "ticket_type_id": "{{supabase.ticket_type_id}}",
       "attendee_name": "{{paystack.customer.first_name}} {{paystack.customer.last_name}}",
       "attendee_email": "{{paystack.customer.email}}",
       "attendee_phone": "{{paystack.customer.phone}}",
       "ticket_id": "{{ticket_id}}",
       "qr_code": "{{ticket_id}}",
       "amount": "{{paystack.amount / 100}}",
       "payment_status": "completed",
       "paystack_reference": "{{paystack.reference}}"
     }
     ```

6. **Generate QR Code** (optional)
   - Use QR code API or service
   - URL to encode: `https://your-app.com/ticket/{{ticket_id}}`

7. **Gmail - Send Ticket Email**
   - Add "Gmail > Send an email"
   - To: `{{paystack.customer.email}}`
   - Subject: `Your ticket for {{event.name}}`
   - Body: Include ticket details, QR code, event info

8. **WhatsApp - Send Ticket** (optional)
   - Add "WhatsApp Business > Send message" (via 360dialog/Wati)
   - To: `{{paystack.customer.phone}}`
   - Message: Ticket details with QR code link

9. **Telegram/Slack - Notify Organizer**
   - Add "Telegram > Send message" or "Slack > Post message"
   - To: Organizer's channel/chat
   - Message: "New sale! {{attendee_name}} bought a ticket for {{event.name}} - ₦{{amount}}"

10. **Email - Notify Organizer** (alternative)
    - Add "Gmail > Send an email"
    - To: `{{event.organizer_email}}`
    - Subject: `New ticket sale for {{event.name}}`
    - Body: Sale details

---

## Configuration Steps in GoPass

### 1. Setup Database
1. Run the SQL script in `/lib/database-setup.sql` in your Supabase SQL Editor
2. This creates the necessary tables including `organizers`, `events`, `orders`

### 2. Configure Webhooks
1. Login to GoPass as an organizer
2. Go to your dashboard
3. Click "Webhook Settings" button
4. Enter your Make.com webhook URLs for:
   - Workflow A: Organizer Onboarding
   - Workflow B: Event Creation
5. Save configuration

### 3. Setup Bank Account
1. From organizer dashboard, click "Setup Payout Account"
2. Select your bank from the dropdown
3. Enter account number and account name
4. Click "Complete Setup"
5. Make.com will create a Paystack subaccount

### 4. Create Event
1. Click "Create Event"
2. Fill in event details
3. Add ticket types with prices
4. Submit form
5. Make.com will create a Paystack payment page
6. Payment URL will be saved to your event

---

## Testing

### Test Organizer Onboarding
1. Signup/login as organizer
2. Setup bank account
3. Check Supabase `organizers` table for `paystack_subaccount_id`
4. Verify in Paystack Dashboard → Subaccounts

### Test Event Creation
1. Create an event
2. Check Supabase `events` table for `paystack_page_url`
3. Visit the Paystack page URL
4. Verify pricing and event details

### Test Payment Flow
1. Use Paystack test card: `5060666666666666666`
2. Complete payment
3. Verify:
   - Payment split in Paystack dashboard
   - Ticket created in Supabase `orders` table
   - Email received
   - Organizer notification sent

---

## Important Notes

### Paystack Test vs Live Mode
- Use test secret keys during development: `sk_test_...`
- Switch to live keys for production: `sk_live_...`
- Update keys in all Make.com scenarios

### Security
- Never expose Paystack secret keys in frontend code
- Always use Make.com server-side scenarios for API calls
- Store webhook URLs securely

### Commission Structure
- Default: 5% platform commission
- Paystack fee: ~1.5% + ₦100
- Organizer receives: ~93.5% of ticket price
- Adjust `percentage_charge` in Workflow A to change commission

### Webhook Reliability
- Make.com webhooks must be active and listening
- Implement retry logic for failed webhook calls
- Monitor Make.com execution logs

---

## Troubleshooting

### Subaccount Creation Fails
- Check bank code is correct (must match Paystack's bank list)
- Verify account number is valid
- Ensure account name matches bank records

### Payment Page Not Created
- Verify organizer has completed bank setup
- Check Make.com webhook URL is correct
- Review Make.com execution logs for errors

### Tickets Not Delivered
- Check email service (Gmail) is properly connected
- Verify WhatsApp API credentials
- Review Make.com Workflow C logs

### Payment Split Not Working
- Ensure subaccount exists in Paystack
- Verify split configuration in Workflow B
- Check Paystack transaction details

---

## Support Resources

- Paystack API Docs: https://paystack.com/docs/api/
- Make.com Docs: https://www.make.com/en/help/
- Supabase Docs: https://supabase.com/docs
- GoPass Support: Contact your development team

---

## Next Steps

1. Complete all three Make.com scenarios
2. Test thoroughly with Paystack test mode
3. Switch to live keys when ready
4. Monitor transactions and payouts
5. Set up automatic reconciliation

**Happy ticketing! 🎟️**
