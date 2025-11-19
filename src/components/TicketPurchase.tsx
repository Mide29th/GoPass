import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { getEventWithTickets, createOrder, Event, TicketType } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { Calendar, MapPin, Ticket, CreditCard } from 'lucide-react';
import { Badge } from './ui/badge';

type TicketPurchaseProps = {
  eventId: string;
  onPurchaseComplete: (orderId: string, ticketId: string) => void;
};

export function TicketPurchase({ eventId, onPurchaseComplete }: TicketPurchaseProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<string>('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setattendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { event: eventData, ticketTypes: ticketTypesData } = await getEventWithTickets(eventId);
      setEvent(eventData);
      setTicketTypes(ticketTypesData);
      if (ticketTypesData.length > 0) {
        setSelectedTicketType(ticketTypesData[0].id);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details.');
    } finally {
      setFetchingEvent(false);
    }
  };

  const generateTicketId = () => {
    return 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const generateQRCode = (ticketId: string) => {
    // Simple QR code data - in a real app, this would be a proper QR code image
    return `https://tickets.example.com/verify/${ticketId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);
      if (!selectedTicket) {
        throw new Error('Invalid ticket type');
      }

      // Check availability
      if (selectedTicket.sold_quantity >= selectedTicket.available_quantity) {
        toast.error('Sorry, this ticket type is sold out!');
        setLoading(false);
        return;
      }

      const ticketId = generateTicketId();
      const qrCode = generateQRCode(ticketId);

      const order = await createOrder({
        event_id: eventId,
        ticket_type_id: selectedTicketType,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        ticket_id: ticketId,
        qr_code: qrCode,
        amount: selectedTicket.price,
        payment_status: 'completed',
        checked_in: false,
      });

      // Simulate sending email and WhatsApp
      console.log('📧 Email sent to:', attendeeEmail);
      console.log('📱 WhatsApp sent to:', attendeePhone);
      console.log('🎟️ Ticket ID:', ticketId);

      toast.success('Payment successful! Your ticket has been sent to your email and WhatsApp.');
      onPurchaseComplete(order.id, ticketId);
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading event details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Event not found.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          {/* Event Flyer */}
          {event.image_url && (
            <div className="mb-4 -mx-6 -mt-6">
              <div className="bg-muted flex items-center justify-center p-4">
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="max-w-full h-auto max-h-96 object-contain rounded-t-lg"
                />
              </div>
            </div>
          )}
          
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Type Selection */}
            <div className="space-y-3">
              <Label>Select Ticket Type</Label>
              <RadioGroup value={selectedTicketType} onValueChange={setSelectedTicketType}>
                {ticketTypes.map((ticket) => {
                  const available = ticket.available_quantity - ticket.sold_quantity;
                  const isAvailable = available > 0;
                  
                  return (
                    <div key={ticket.id} className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value={ticket.id} id={ticket.id} disabled={!isAvailable} />
                      <Label htmlFor={ticket.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{ticket.name}</span>
                              {!isAvailable && <Badge variant="secondary">Sold Out</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {available} / {ticket.available_quantity} available
                            </div>
                          </div>
                          <div className="text-right">
                            <div>₦{ticket.price.toLocaleString('en-NG')}</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Attendee Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Attendee Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setattendeeEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (with country code)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Demo: Use 4242 4242 4242 4242 for testing
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full flex items-center justify-between p-4 bg-muted rounded-lg">
            <span>Total Amount</span>
            <span className="text-2xl">₦{selectedTicket?.price.toLocaleString('en-NG')}</span>
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={loading || !selectedTicket}
            size="lg"
          >
            {loading ? 'Processing Payment...' : `Pay ₦${selectedTicket?.price.toLocaleString('en-NG')}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your ticket will be delivered via email and WhatsApp instantly after payment
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
