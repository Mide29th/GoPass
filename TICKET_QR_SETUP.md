# Ticket QR Code & Notification Setup Guide

## Overview
This system automatically sends individual QR codes to ticket buyers via email. Each QR code is unique and can be scanned at event entry.

## Components

### 1. **QR Code Generation** (`src/lib/ticketNotifications.ts`)
- Generates unique QR code for each ticket
- Contains ticket code for entry validation
- 300x300px PNG format
- Embedded in email messages

### 2. **Email Notification** (via Make.com)
- Recipient: Buyer's email from ticket purchase
- Content: Event details + embedded QR code
- Template customizable in Make.com

## Setup Instructions

### Step 1: Make.com Scenario Configuration ✅

**Status:** Scenario created and active
**Webhook URL:** `https://hook.us2.make.com/jrijtebvot2ei8arvgfi6uvxvcnd1zuh`
**Configuration:** Email sending module active

The Make.com scenario is now set up to receive ticket purchase data and send emails with embedded QR codes.

### Step 2: Email Delivery Configuration

The Make.com scenario is configured to:
- **Receive:** Ticket purchase webhook data
- **Extract:** Attendee email, event details, QR code
- **Send:** Email with embedded QR code to `{{attendee_email}}`
- **Trigger:** Automatic on each ticket purchase

### Step 3: Test the Flow

1. Make a test ticket purchase with:
   - Email: Your test email address
   - Event: Any available event
2. Should receive email with QR code within seconds

### Step 4: Ticket Purchase Integration ✅

The integration is automatic and now active!

When user purchases ticket:
1. QR code generated
2. Make.com scenario triggered
3. Email sent with QR code to attendee
4. Confirmation shown to user

## Data Flow

```
Ticket Purchase
    ↓
Generate QR Code
    ↓
POST to Make.com Webhook
    ↓
Make.com Scenario Triggered
    ↓
Send Email (with QR code)
    ↓
Buyer Receives Email
    ↓
Shows QR Code at Event Entry
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
✅ Customizable templates
✅ Event details included
✅ High error correction QR codes
✅ No daily limits
✅ Instant delivery
✅ Make.com automation active

## Troubleshooting

### Webhook not triggered
- Check `WEBHOOK_TICKET_PURCHASE` URL is correct
- Verify Make.com webhook is active
- Check browser console for errors

### Email not received
- Verify attendee email is correct
- Check Make.com email provider authentication
- Review Make.com webhook logs for received data
- Check spam/junk folder

### QR code not displaying
- Check Make.com email template supports base64 images
- Try uploading image to CDN instead
- Test QR code generation locally

## Next Steps

1. ✅ Make.com scenario configured
2. ✅ Webhook URL: `https://hook.us2.make.com/jrijtebvot2ei8arvgfi6uvxvcnd1zuh`
3. ✅ Code integrated in `TicketPurchase.tsx`
4. Test with sample ticket purchase
5. Deploy to production

## Files Modified

- `src/lib/webhooks-config.ts` - Added ticket webhook URL
- `src/lib/ticketNotifications.ts` - New QR code & notification utility (NEW)
- `package.json` - Add `qrcode` dependency

## Security Notes

- QR codes contain only ticket code (no sensitive data)
- Emails sent via authenticated email provider through Make.com
- Make.com handles all communication securely
- Webhook URL is unique and should not be shared publicly
