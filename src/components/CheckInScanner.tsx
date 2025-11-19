import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { getOrderByTicketId, checkInTicket } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { CheckCircle2, XCircle, Search, User, Mail, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

type CheckInScannerProps = {
  eventId: string;
  onBack: () => void;
};

export function CheckInScanner({ eventId, onBack }: CheckInScannerProps) {
  const [ticketId, setTicketId] = useState('');
  const [searching, setSearching] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: 'success' | 'already-checked-in' | 'not-found' | 'wrong-event';
    order?: any;
  } | null>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    setSearching(true);
    setLastResult(null);

    try {
      // Get order by ticket ID
      const order = await getOrderByTicketId(ticketId.trim().toUpperCase());

      if (!order) {
        setLastResult({ status: 'not-found' });
        toast.error('Invalid ticket ID');
        return;
      }

      // Check if ticket belongs to this event
      if (order.event_id !== eventId) {
        setLastResult({ status: 'wrong-event', order });
        toast.error('This ticket is for a different event');
        return;
      }

      // Check if already checked in
      if (order.checked_in) {
        setLastResult({ status: 'already-checked-in', order });
        toast.error(`Ticket already used by ${order.attendee_name}`);
        return;
      }

      // Check in the ticket
      const updatedOrder = await checkInTicket(ticketId.trim().toUpperCase());
      setLastResult({ status: 'success', order: updatedOrder });
      toast.success(`✅ ${updatedOrder.attendee_name} checked in successfully!`);
      
      // Clear input for next scan
      setTicketId('');
    } catch (error: any) {
      console.error('Error checking in:', error);
      if (error.message.includes('No rows')) {
        setLastResult({ status: 'not-found' });
        toast.error('Invalid ticket ID');
      } else {
        toast.error('Failed to check in ticket');
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Check-In Scanner</h1>
          <p className="text-muted-foreground">Scan or enter ticket IDs to check in attendees</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      {/* Check-in Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Ticket ID</CardTitle>
          <CardDescription>Type or scan the ticket ID to check in attendees</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticketId">Ticket ID</Label>
              <div className="flex gap-2">
                <Input
                  id="ticketId"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="TKT-1234567890-ABC"
                  className="font-mono"
                  autoFocus
                />
                <Button type="submit" disabled={searching}>
                  <Search className="w-4 h-4 mr-2" />
                  {searching ? 'Checking...' : 'Check In'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the complete ticket ID from the attendee's ticket
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {lastResult && (
        <Card>
          <CardContent className="pt-6">
            {lastResult.status === 'success' && lastResult.order && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900">Check-In Successful!</AlertTitle>
                <AlertDescription className="text-green-800 mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{lastResult.order.attendee_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{lastResult.order.attendee_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Checked in at {new Date(lastResult.order.checked_in_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lastResult.status === 'already-checked-in' && lastResult.order && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-900">Already Checked In</AlertTitle>
                <AlertDescription className="text-yellow-800 mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{lastResult.order.attendee_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{lastResult.order.attendee_email}</span>
                    </div>
                    <div>
                      <Badge variant="secondary">
                        Previously checked in at {new Date(lastResult.order.checked_in_at).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lastResult.status === 'not-found' && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900">Invalid Ticket</AlertTitle>
                <AlertDescription className="text-red-800">
                  No ticket found with this ID. Please check the ticket ID and try again.
                </AlertDescription>
              </Alert>
            )}

            {lastResult.status === 'wrong-event' && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900">Wrong Event</AlertTitle>
                <AlertDescription className="text-red-800">
                  This ticket is for a different event.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              1
            </div>
            <div>
              <h4>Ask for Ticket</h4>
              <p className="text-sm text-muted-foreground">
                Ask the attendee to show their ticket (email, WhatsApp, or printed)
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              2
            </div>
            <div>
              <h4>Enter Ticket ID</h4>
              <p className="text-sm text-muted-foreground">
                Type or scan the ticket ID shown on their ticket
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              3
            </div>
            <div>
              <h4>Verify & Check In</h4>
              <p className="text-sm text-muted-foreground">
                Verify the name matches and click Check In to grant entry
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
