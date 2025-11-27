/**
 * Ticket Notification Utility
 * Handles QR code generation, email, and WhatsApp notifications for ticket purchases
 */

import QRCode from 'qrcode';
import { WEBHOOK_TICKET_PURCHASE } from './webhooks-config';

export interface TicketNotificationData {
  ticket_id: string;
  ticket_code: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_location: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  ticket_type: string;
  price: number;
  qr_code_data: string; // URL or base64 of QR code
}

/**
 * Generate QR code for a ticket
 * The QR code contains the ticket code which can be scanned at entry
 */
export async function generateTicketQRCode(ticketCode: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Send ticket with QR code via email
 * Triggers Make.com automation for sending notifications
 */
export async function sendTicketNotification(
  notificationData: TicketNotificationData
): Promise<{ success: boolean; message: string }> {
  try {
    if (!WEBHOOK_TICKET_PURCHASE || WEBHOOK_TICKET_PURCHASE.includes('YOUR_TICKET_WEBHOOK_URL')) {
      throw new Error('Ticket webhook URL not configured. Please set WEBHOOK_TICKET_PURCHASE in webhooks-config.ts');
    }

    console.log('📧 Sending ticket via email...');
    console.log('Recipient:', {
      email: notificationData.attendee_email,
      name: notificationData.attendee_name,
    });

    const response = await fetch(WEBHOOK_TICKET_PURCHASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notificationData,
        // Add timestamp for tracking
        sent_at: new Date().toISOString(),
      }),
    });

    const responseText = await response.text();

    if (response.ok || response.status === 200) {
      console.log('✅ Ticket email sent successfully');
      return {
        success: true,
        message: 'Ticket sent to email with QR code',
      };
    } else {
      console.error('❌ Notification webhook error:', response.status, responseText);
      return {
        success: false,
        message: `Failed to send notification: ${response.status}`,
      };
    }
  } catch (error) {
    console.error('❌ Error sending ticket notification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send ticket notification',
    };
  }
}

/**
 * Complete ticket purchase flow:
 * 1. Generate QR code
 * 2. Send notification via Make.com (email)
 * 3. Return ticket details
 */
export async function processTicketPurchaseNotification(
  ticketId: string,
  ticketCode: string,
  eventId: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  attendeeName: string,
  attendeeEmail: string,
  attendeePhone: string,
  ticketType: string,
  price: number
): Promise<{
  success: boolean;
  ticketCode: string;
  qrCodeUrl?: string;
  message: string;
}> {
  try {
    // Step 1: Generate QR code
    console.log('🔄 Generating QR code...');
    const qrCodeDataUrl = await generateTicketQRCode(ticketCode);

    // Step 2: Send notification
    console.log('🔄 Sending email with QR code...');
    const notificationResult = await sendTicketNotification({
      ticket_id: ticketId,
      ticket_code: ticketCode,
      event_id: eventId,
      event_name: eventName,
      event_date: eventDate,
      event_location: eventLocation,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      attendee_phone: attendeePhone,
      ticket_type: ticketType,
      price: price,
      qr_code_data: qrCodeDataUrl,
    });

    if (notificationResult.success) {
      return {
        success: true,
        ticketCode: ticketCode,
        qrCodeUrl: qrCodeDataUrl,
        message: '✅ Ticket purchased! QR code sent to your email',
      };
    } else {
      return {
        success: false,
        ticketCode: ticketCode,
        message: `Ticket created but email failed: ${notificationResult.message}`,
      };
    }
  } catch (error) {
    console.error('❌ Error processing ticket purchase:', error);
    return {
      success: false,
      ticketCode: '',
      message: error instanceof Error ? error.message : 'Failed to process ticket purchase',
    };
  }
}
