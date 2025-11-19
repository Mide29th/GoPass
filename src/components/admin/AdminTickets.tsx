import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { Search, Eye, Loader2, CheckCircle, XCircle, FileDown, FileJson, QrCode } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { exportToCSV, exportToJSON, formatDataForExport } from '../../utils/exportUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type AdminTicketsProps = {
  adminToken: string;
};

type Ticket = {
  id: string;
  event_id: string;
  event_title: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  ticket_type: string;
  price: number;
  checked_in: boolean;
  checked_in_at: string | null;
  purchase_date: string;
  organizer_name: string;
};

export function AdminTickets({ adminToken }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/tickets`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }
      );

      if (!response.ok) {
        // Read response as text first (can only read once!)
        const errorText = await response.text();
        console.error('Tickets fetch failed:', response.status, errorText);
        
        // Try to parse as JSON
        let errorMessage = 'Failed to fetch tickets';
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
      setTickets(result.tickets);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsDialog(true);
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.attendee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.attendee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Tickets</h2>
          <p className="text-muted-foreground">View all ticket purchases</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(formatDataForExport(tickets), 'tickets')}
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToJSON(formatDataForExport(tickets), 'tickets')}
          >
            <FileJson className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Checked In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.checked_in).length.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter(t => !t.checked_in).length.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket ID, event, or attendee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>View all ticket purchases across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Check-In Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{ticket.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.event_title}</p>
                          <p className="text-xs text-muted-foreground">by {ticket.organizer_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.attendee_name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.attendee_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.ticket_type}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(ticket.price)}</TableCell>
                      <TableCell>
                        {ticket.checked_in ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(ticket)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Full information about this ticket</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket ID</p>
                  <p className="font-mono text-sm">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-medium">{selectedTicket.event_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendee Name</p>
                  <p className="font-medium">{selectedTicket.attendee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTicket.attendee_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedTicket.attendee_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Type</p>
                  <Badge variant="outline">{selectedTicket.ticket_type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">{formatCurrency(selectedTicket.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">{formatDate(selectedTicket.purchase_date)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Check-In Status</h4>
                {selectedTicket.checked_in ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-800">Checked In</p>
                    </div>
                    <p className="text-sm text-green-700">
                      {selectedTicket.checked_in_at && `at ${formatDate(selectedTicket.checked_in_at)}`}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-yellow-600" />
                      <p className="font-medium text-yellow-800">Not Checked In</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}