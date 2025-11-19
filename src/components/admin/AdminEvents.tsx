import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { Search, Eye, Loader2, Calendar as CalendarIcon, FileDown, FileJson, MapPin } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { exportToCSV, exportToJSON, formatDataForExport } from '../../utils/exportUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type AdminEventsProps = {
  adminToken: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  tickets_sold: number;
  tickets_available: number;
  revenue: number;
  created_at: string;
};

export function AdminEvents({ adminToken }: AdminEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/events`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }
      );

      if (!response.ok) {
        // Read response as text first (can only read once!)
        const errorText = await response.text();
        console.error('Events fetch failed:', response.status, errorText);
        
        // Try to parse as JSON
        let errorMessage = 'Failed to fetch events';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Not JSON, use text directly
          errorMessage = errorText.substring(0, 100) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Read response as text first, then parse
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from server');
      }
      
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        console.error('Non-JSON response:', trimmed.substring(0, 200));
        throw new Error('Server returned invalid response');
      }
      
      const result = JSON.parse(trimmed);
      setEvents(result.events);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return { label: 'Past', color: 'bg-gray-100 text-gray-700' };
    } else if (eventDate.toDateString() === today.toDateString()) {
      return { label: 'Today', color: 'bg-green-100 text-green-700' };
    } else {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    }
  };

  const handleExportCSV = () => {
    const formattedData = formatDataForExport(events);
    exportToCSV(formattedData, 'events');
  };

  const handleExportJSON = () => {
    const formattedData = formatDataForExport(events);
    exportToJSON(formattedData, 'events');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Events</h2>
          <p className="text-muted-foreground">Manage all platform events</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <FileDown className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, organizer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Events ({filteredEvents.length})</CardTitle>
          <CardDescription>View all events across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No events found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const status = getEventStatus(event.date);
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{event.organizer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {formatDate(event.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {event.tickets_sold} / {event.tickets_available}
                        </TableCell>
                        <TableCell>{formatCurrency(event.revenue)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(event)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Full information about this event</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{selectedEvent.title}</h3>
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                  <p className="font-medium">{selectedEvent.organizer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.organizer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event ID</p>
                  <p className="font-mono text-xs">{selectedEvent.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{formatDate(selectedEvent.date)} at {selectedEvent.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedEvent.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Sold</p>
                  <p className="font-medium">{selectedEvent.tickets_sold} / {selectedEvent.tickets_available}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-medium">{formatCurrency(selectedEvent.revenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getEventStatus(selectedEvent.date).color}>
                    {getEventStatus(selectedEvent.date).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedEvent.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}