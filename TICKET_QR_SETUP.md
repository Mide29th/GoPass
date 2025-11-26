# Ticket QR Code & Notification Setup Guide

## Overview
This system automatically sends individual QR codes to ticket buyers via email and WhatsApp. Each QR code is unique and can be scanned at event entry.

## Components

### 1. **QR Code Generation** (`src/lib/ticketNotifications.ts`)
- Generates unique QR code for each ticket
- Contains ticket code for entry validation
- 300x300px PNG format
- Can be embedded in email and WhatsApp messages

### 2. **Email Notification** (via Make.com)
- Recipient: Buyer's email from ticket purchase
- Content: Event details + embedded QR code
- Template customizable in Make.com

### 3. **WhatsApp Notification** (via Make.com)
- Recipient: Buyer's phone number from ticket purchase
- Content: Event details + QR code image
- Requires Make.com WhatsApp Business integration

## Setup Instructions

### Step 1: Create Make.com Scenario for Ticket Notifications

1. Go to **Make.com Dashboard**
2. Click **Create a new scenario**
3. Name it: `GoPass - Ticket QR Code Notification`

### Step 2: Configure Webhook Trigger

1. Add **Webhooks** → **Custom Webhook** as the first module
2. Click **Add** to create webhook
3. Copy the webhook URL
4. **Important:** Update `src/lib/webhooks-config.ts`:
   ```typescript
   export const WEBHOOK_TICKET_PURCHASE = 'https://hook.us2.make.com/YOUR_NEW_URL_HERE';
   ```

### Step 3: Add Email Module

1. Add **Gmail** or **Email** module after webhook
2. Configure email template with:
   - Recipient: `{{attendee_email}}`
   - Subject: `Your {{event_name}} Ticket - {{event_date}}`
   - Body:
     ```
     Hi {{attendee_name}},
     
     Your ticket for {{event_name}} is attached as a QR code below.
     
     📅 Date: {{event_date}}
     📍 Location: {{event_location}}
     🎫 Ticket Type: {{ticket_type}}
     💰 Price: {{price}}
     
     Please save or screenshot the QR code to show at event entry.
     
     Scan code: {{ticket_code}}
     
     Questions? Reply to this email.
     
     See you at the event! 🎉
     ```
3. Attach QR code from webhook data: `{{qr_code_data}}`

### Step 4: Add WhatsApp Module (Optional)

1. Add **WhatsApp Business** module
2. Configure message template:
   - Recipient: `{{attendee_phone}}`
   - Message:
     ```
     Your {{event_name}} ticket is ready! 🎫
     
     📅 {{event_date}}
     📍 {{event_location}}
     
     Scan your QR code at entry.
     See you there! 🎉
     ```
3. Attach QR code image

### Step 5: Test the Flow

1. **Save** the scenario
2. Make a test ticket purchase with:
   - Email: Your test email
   - Phone: Your test phone (WhatsApp)
3. Should receive email + WhatsApp within seconds

### Step 6: Integrate with Ticket Purchase

The integration is automatic once webhook URL is configured.

When user purchases ticket:
1. QR code generated
2. Make.com scenario triggered
3. Email sent with QR code
4. WhatsApp sent with QR code
5. Confirmation shown to user

## Data Flow

```
Ticket Purchase
    ↓
Generate QR Code
    ↓
POST to Make.com Webhook
    ↓
├─ Send Email (with QR)
├─ Send WhatsApp (with QR)
└─ Log Event
    ↓
Buyer Receives QR Code
    ↓
Shows QR at Event Entry
    ↓
Check-in Scanner Validates
```

## API Payload

When a ticket is purchased, Make.com receives:

```json
{
  "ticket_id": "TICKET-123456",
  "ticket_code": "TKT-1234567890-ABC123",
  "event_id": "EVT-789",
  "event_name": "Tech Conference 2025",
  "event_date": "2025-12-15",
  "event_location": "Lagos Convention Center",
  "attendee_name": "John Doe",
  "attendee_email": "john@example.com",
  "attendee_phone": "+234802345678",
  "ticket_type": "VIP",
  "price": 5000,
  "qr_code_data": "data:image/png;base64,iVBORw0KG...",
  "sent_at": "2025-11-27T10:30:45.123Z"
}
```

## Features

✅ Unique QR code per ticket
✅ Automatic email delivery
✅ Automatic WhatsApp delivery
✅ Customizable templates
✅ Event details included
✅ High error correction QR codes
✅ No daily limits
✅ Instant delivery

## Troubleshooting

### Webhook not triggered
- Check `WEBHOOK_TICKET_PURCHASE` URL is correct
- Verify Make.com webhook is active
- Check browser console for errors

### Email not received
- Verify attendee email is correct
- Check Make.com Gmail authentication
- Test manually in Make.com

### WhatsApp not sent
- Verify phone number includes country code (e.g., +234...)
- Make.com WhatsApp integration must be configured
- Check Make.com rate limits

### QR code not displaying
- Check Make.com email template supports base64 images
- Try uploading image to CDN instead
- Test QR code generation locally

## Next Steps

1. Install package: `npm install qrcode`
2. Update `webhooks-config.ts` with Make.com webhook URL
3. Set up Make.com scenario following steps above
4. Test with sample ticket purchase
5. Deploy to production

## Files Modified

- `src/lib/webhooks-config.ts` - Added ticket webhook URL
- `src/lib/ticketNotifications.ts` - New QR code & notification utility (NEW)
- `package.json` - Add `qrcode` dependency

## Security Notes

- QR codes contain only ticket code (no sensitive data)
- Phone numbers stored securely in database
- Emails sent via Gmail/authenticated provider
- Make.com handles all communication
