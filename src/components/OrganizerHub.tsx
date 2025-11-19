import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { BankSetupOnboarding } from './BankSetupOnboarding';
import { supabase, Event } from '../lib/supabase';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  TrendingUp, 
  LogOut,
  Plus,
  Eye,
  Mail,
  Download,
  ScanLine,
  AlertCircle,
  Landmark,
  Settings,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

type OrganizerHubProps = {
  userId: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onCreateEvent: () => void;
  onViewDashboard: (eventId: string) => void;
  onCheckIn: (eventId: string) => void;
  onBankSetup: () => void;
  onProfileSettings: () => void;
  refreshCounter?: number;
};

type EventWithStats = Event & {
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  attendeeCount: number;
};

type Attendee = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  ticket_type_name: string;
  amount: number;
  checked_in: boolean;
  created_at: string;
};

export function OrganizerHub({ 
  userId, 
  userName,
  userEmail,
  onLogout, 
  onCreateEvent,
  onViewDashboard,
  onCheckIn,
  onBankSetup,
  onProfileSettings,
  refreshCounter
}: OrganizerHubProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
  const [bankSetupComplete, setBankSetupComplete] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalAttendees: 0,
  });

  useEffect(() => {
    loadOrganizerData();
    checkBankSetup();
  }, [userEmail, refreshCounter]);

  const checkBankSetup = async () => {
    try {
      // Get organizer data from KV store via server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const { organizer } = await response.json();
        console.log('🏦 Bank setup check - Organizer data:', organizer);
        // Check if bank details exist - that's all we need!
        const hasAccountDetails = organizer?.account_number && organizer?.account_name;
        console.log('🏦 Has account details:', hasAccountDetails);
        setBankSetupComplete(hasAccountDetails || false);
      } else {
        // Organizer not found or hasn't set up yet
        console.log('🏦 Organizer not found - bank setup incomplete');
        setBankSetupComplete(false);
      }
    } catch (error) {
      console.error('Error checking bank setup:', error);
      setBankSetupComplete(false);
    }
  };

  const loadOrganizerData = async () => {
    setLoading(true);
    try {
      // Get all events for this organizer
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_email', userEmail)
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Get ticket types and orders for all events
      const eventIds = eventsData.map(e => e.id);
      
      const { data: ticketTypes, error: ticketError } = await supabase
        .from('ticket_types')
        .select('*')
        .in('event_id', eventIds);

      if (ticketError) throw ticketError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          ticket_types (name, price)
        `)
        .in('event_id', eventIds)
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Calculate stats for each event
      const eventsWithStats: EventWithStats[] = eventsData.map(event => {
        const eventTicketTypes = ticketTypes?.filter(t => t.event_id === event.id) || [];
        const eventOrders = orders?.filter(o => o.event_id === event.id) || [];

        const totalTickets = eventTicketTypes.reduce((sum, t) => sum + t.available_quantity, 0);
        const soldTickets = eventOrders.length;
        const revenue = eventOrders.reduce((sum, o) => sum + o.amount, 0);

        return {
          ...event,
          totalTickets,
          soldTickets,
          revenue,
          attendeeCount: soldTickets,
        };
      });

      setEvents(eventsWithStats);

      // Prepare attendees list for email marketing
      const attendeesList: Attendee[] = (orders || []).map(order => ({
        id: order.id,
        attendee_name: order.attendee_name,
        attendee_email: order.attendee_email,
        attendee_phone: order.attendee_phone,
        ticket_type_name: order.ticket_types?.name || 'N/A',
        amount: order.amount,
        checked_in: order.checked_in,
        created_at: order.created_at,
      }));

      setAllAttendees(attendeesList);

      // Calculate overall stats
      setStats({
        totalEvents: eventsData.length,
        totalRevenue: eventsWithStats.reduce((sum, e) => sum + e.revenue, 0),
        totalTicketsSold: eventsWithStats.reduce((sum, e) => sum + e.soldTickets, 0),
        totalAttendees: attendeesList.length,
      });

    } catch (error) {
      console.error('Error loading organizer data:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const exportAttendees = () => {
    if (allAttendees.length === 0) {
      toast.info('No attendees to export');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Phone', 'Ticket Type', 'Amount', 'Checked In', 'Purchase Date'].join(','),
      ...allAttendees.map(a => [
        a.attendee_name,
        a.attendee_email,
        a.attendee_phone,
        a.ticket_type_name,
        a.amount,
        a.checked_in ? 'Yes' : 'No',
        new Date(a.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendees exported successfully');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Manage your events and attendees</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
          <Button variant="outline" onClick={onProfileSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Profile
          </Button>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Bank Setup Alert */}
      {!bankSetupComplete && (
        <Alert className="bg-amber-50 border-amber-200">
          <Landmark className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong>Bank Account Setup Required:</strong> Please set up your bank account to receive instant payouts for ticket sales.
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={onBankSetup}>
                <Landmark className="w-4 h-4 mr-2" />
                Setup Payout Account
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{stats.totalEvents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-1" />
              Completed sales
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets Sold</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTicketsSold}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Ticket className="w-4 h-4 mr-1" />
              All events
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Attendees</CardDescription>
            <CardTitle className="text-3xl">{stats.totalAttendees}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-1" />
              Unique contacts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Events and Attendees */}
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">My Events ({events.length})</TabsTrigger>
          <TabsTrigger value="attendees">Attendee Repository ({allAttendees.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event to start selling tickets
                </p>
                <Button onClick={onCreateEvent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Event Image */}
                      {event.image_url && (
                        <div className="flex-shrink-0">
                          <div className="w-full md:w-48 h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={event.image_url}
                              alt={event.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-xl">{event.name}</h3>
                            {isUpcoming(event.date) ? (
                              <Badge className="bg-green-600">Upcoming</Badge>
                            ) : (
                              <Badge variant="secondary">Past</Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ticket className="w-4 h-4 text-muted-foreground" />
                            <span>{event.soldTickets}/{event.totalTickets} sold</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{event.attendeeCount} attendees</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <span>{formatCurrency(event.revenue)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => onViewDashboard(event.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Dashboard
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => onCheckIn(event.id)}
                          >
                            <ScanLine className="w-4 h-4 mr-2" />
                            Check-In
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendee Repository</CardTitle>
                  <CardDescription>
                    All attendees across all your events for email marketing
                  </CardDescription>
                </div>
                <Button onClick={exportAttendees} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allAttendees.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No attendees yet</p>
                  <p className="text-sm">Attendees will appear here once tickets are sold</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Ticket Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Purchase Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell>{attendee.attendee_name}</TableCell>
                          <TableCell>
                            <a 
                              href={`mailto:${attendee.attendee_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {attendee.attendee_email}
                            </a>
                          </TableCell>
                          <TableCell>{attendee.attendee_phone}</TableCell>
                          <TableCell>{attendee.ticket_type_name}</TableCell>
                          <TableCell>{formatCurrency(attendee.amount)}</TableCell>
                          <TableCell>
                            {attendee.checked_in ? (
                              <Badge variant="secondary">Checked In</Badge>
                            ) : (
                              <Badge variant="outline">Not Checked In</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(attendee.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}