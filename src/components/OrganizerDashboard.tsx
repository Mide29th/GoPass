import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getOrdersByEvent, getEventWithTickets, supabase, Event, TicketType } from '../lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { DollarSign, Users, Ticket, TrendingUp, Bell, BellOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

type OrganizerDashboardProps = {
  eventId: string;
  onCheckIn: () => void;
  onBack: () => void;
};

export function OrganizerDashboard({ eventId, onCheckIn, onBack }: OrganizerDashboardProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastNotification, setLastNotification] = useState<string>('');

  useEffect(() => {
    loadDashboard();
    setupRealtimeSubscription();
  }, [eventId]);

  const loadDashboard = async () => {
    try {
      const { event: eventData, ticketTypes: ticketTypesData } = await getEventWithTickets(eventId);
      setEvent(eventData);
      setTicketTypes(ticketTypesData);

      const ordersData = await getOrdersByEvent(eventId);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Add new order to list
          setOrders((prev) => [newOrder, ...prev]);
          
          // Show notification if enabled
          if (notificationsEnabled) {
            const message = `🎉 New Sale! ${newOrder.attendee_name} just bought a ticket for ₦${parseFloat(newOrder.amount).toLocaleString('en-NG')}`;
            setLastNotification(message);
            toast.success(message, {
              duration: 5000,
            });
            
            // Play a sound (optional)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSmO0/PMezAFJ3vK7+OZVBAOX6vl7alWEwlGn+Tvw2wfCCN8y+7fkjsKFmS36+qnVRMLRJze8J5NEBD8p+Xx/');
              audio.play().catch(() => {});
            } catch (e) {}
          }
          
          // Reload to get updated ticket counts
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="text-center">Event not found.</div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
  const totalSold = orders.length;
  const checkedInCount = orders.filter(o => o.checked_in).length;
  const totalAvailable = ticketTypes.reduce((sum, tt) => sum + tt.available_quantity, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl">{event.name}</h1>
          <p className="text-muted-foreground">Organizer Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Notifications Off
              </>
            )}
          </Button>
          <Button onClick={onCheckIn}>
            Check-In Scanner
          </Button>
        </div>
      </div>

      {/* Last Notification Alert */}
      {lastNotification && notificationsEnabled && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {lastNotification}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₦{totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tickets Sold</CardTitle>
            <Ticket className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalSold} / {totalAvailable}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSold / totalAvailable) * 100).toFixed(0)}% sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Checked In</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{checkedInCount} / {totalSold}</div>
            <p className="text-xs text-muted-foreground">
              {totalSold > 0 ? ((checkedInCount / totalSold) * 100).toFixed(0) : 0}% arrived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Sales Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₦{totalSold > 0 ? (totalRevenue / totalSold).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
            <p className="text-xs text-muted-foreground">Avg per ticket</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Types</CardTitle>
          <CardDescription>Sales breakdown by ticket type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketTypes.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.name}</TableCell>
                  <TableCell>₦{ticket.price.toLocaleString('en-NG')}</TableCell>
                  <TableCell>{ticket.sold_quantity}</TableCell>
                  <TableCell>{ticket.available_quantity - ticket.sold_quantity}</TableCell>
                  <TableCell>₦{(ticket.sold_quantity * ticket.price).toLocaleString('en-NG')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest ticket purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.attendee_name}</TableCell>
                    <TableCell>{order.attendee_email}</TableCell>
                    <TableCell>{order.attendee_phone}</TableCell>
                    <TableCell className="font-mono text-sm">{order.ticket_id}</TableCell>
                    <TableCell>₦{parseFloat(order.amount).toLocaleString('en-NG')}</TableCell>
                    <TableCell>
                      {order.checked_in ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Checked In
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Checked In
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
