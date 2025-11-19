import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getOrderByTicketId, getEventWithTickets, Event } from '../lib/supabase';
import { Calendar, MapPin, User, Mail, Phone, Download, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import QRCode from 'qrcode';

type TicketDisplayProps = {
  ticketId: string;
};

export function TicketDisplay({ ticketId }: TicketDisplayProps) {
  const [order, setOrder] = useState<any>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const orderData = await getOrderByTicketId(ticketId);
      setOrder(orderData);

      const { event: eventData } = await getEventWithTickets(orderData.event_id);
      setEvent(eventData);

      // Generate QR code
      const qr = await QRCode.toDataURL(orderData.ticket_id, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a simple HTML ticket for download
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${event?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .ticket { border: 2px solid #000; padding: 20px; }
          .qr-code { text-align: center; margin: 20px 0; }
          .info { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>${event?.name}</h1>
          <div class="info"><strong>Date:</strong> ${new Date(event?.date || '').toLocaleString()}</div>
          <div class="info"><strong>Location:</strong> ${event?.location}</div>
          <div class="info"><strong>Attendee:</strong> ${order?.attendee_name}</div>
          <div class="info"><strong>Ticket ID:</strong> ${order?.ticket_id}</div>
          <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([ticketHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticketId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading ticket...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order || !event) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Ticket not found.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl">🎟️ Your Ticket</h1>
            {order.checked_in ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Checked In
              </Badge>
            ) : (
              <Badge className="bg-white text-purple-600">Valid</Badge>
            )}
          </div>
          <h2 className="text-xl">{event.name}</h2>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Date & Time</div>
                <div>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm">
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div>{event.location}</div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                {qrCodeUrl && <img src={qrCodeUrl} alt="Ticket QR Code" className="w-64 h-64 mx-auto" />}
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Ticket ID</div>
                <div className="font-mono">{order.ticket_id}</div>
              </div>
            </div>
          </div>

          {/* Attendee Information */}
          <div className="space-y-3 pt-4 border-t">
            <h3>Attendee Information</h3>
            
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">{order.attendee_name}</div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">{order.attendee_email}</div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">{order.attendee_phone}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Present this QR code at the event entrance
            </p>
          </div>

          {/* Footer Notice */}
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="text-muted-foreground">
              ✅ A copy of this ticket has been sent to your email and WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
