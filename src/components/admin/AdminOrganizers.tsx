import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { Search, Eye, Edit, Trash2, CheckCircle, XCircle, Loader2, FileDown, FileJson } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { exportToCSV, exportToJSON, formatDataForExport } from '../../utils/exportUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type AdminOrganizersProps = {
  adminToken: string;
};

type Organizer = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  paystack_subaccount_id: string;
  subaccount_setup_complete: boolean;
  created_at: string;
  event_count?: number;
  total_revenue?: number;
};

export function AdminOrganizers({ adminToken }: AdminOrganizersProps) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/organizers`,
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
        console.error('Organizers fetch failed:', response.status, errorText);
        
        // Try to parse as JSON
        let errorMessage = 'Failed to fetch organizers';
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
      setOrganizers(result.organizers);
    } catch (error: any) {
      console.error('Error fetching organizers:', error);
      toast.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (organizer: Organizer) => {
    setSelectedOrganizer(organizer);
    setShowDetailsDialog(true);
  };

  const filteredOrganizers = organizers.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const exportData = (format: 'csv' | 'json') => {
    const data = formatDataForExport(organizers);
    if (format === 'csv') {
      exportToCSV(data, 'organizers');
    } else if (format === 'json') {
      exportToJSON(data, 'organizers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Organizers</h2>
          <p className="text-muted-foreground">Manage all event organizers</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('csv')}
          >
            <FileDown className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('json')}
          >
            <FileJson className="w-4 h-4 mr-1" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizers ({filteredOrganizers.length})</CardTitle>
          <CardDescription>View and manage organizer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No organizers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Bank Setup</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizers.map((organizer) => (
                    <TableRow key={organizer.id}>
                      <TableCell className="font-medium">{organizer.name}</TableCell>
                      <TableCell>{organizer.email}</TableCell>
                      <TableCell>{organizer.event_count || 0}</TableCell>
                      <TableCell>{formatCurrency(organizer.total_revenue || 0)}</TableCell>
                      <TableCell>
                        {organizer.subaccount_setup_complete ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(organizer.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(organizer)}
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
            <DialogTitle>Organizer Details</DialogTitle>
            <DialogDescription>Full information about this organizer</DialogDescription>
          </DialogHeader>
          {selectedOrganizer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedOrganizer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrganizer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedOrganizer.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Events Created</p>
                  <p className="font-medium">{selectedOrganizer.event_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="font-medium">{formatCurrency(selectedOrganizer.total_revenue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(selectedOrganizer.created_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Bank Account Details</h4>
                {selectedOrganizer.subaccount_setup_complete ? (
                  <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{selectedOrganizer.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{selectedOrganizer.account_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Name</p>
                      <p className="font-medium">{selectedOrganizer.account_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paystack Subaccount</p>
                      <p className="font-mono text-xs">{selectedOrganizer.paystack_subaccount_id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">Bank account setup not completed</p>
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