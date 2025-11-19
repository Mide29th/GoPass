import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AdminSubaccountActivation } from '../AdminSubaccountActivation';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Loader2, UserCheck, AlertCircle, CheckCircle2, RefreshCw, Search, Filter, Zap } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type AdminPendingApprovalsProps = {
  adminToken: string;
};

export function AdminPendingApprovals({ adminToken }: AdminPendingApprovalsProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  
  // Get unique banks for filter
  const uniqueBanks = Array.from(new Set(pendingOrganizers.map(org => org.bank_name).filter(Boolean)));

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async (showToast = false) => {
    if (showToast) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/pending-subaccounts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        // Read response as text first
        const errorText = await response.text();
        console.error('Pending approvals fetch failed:', response.status, errorText);
        toast.error('Failed to load pending approvals');
        return;
      }

      // Read response as text first, then parse
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        console.error('Empty response from server');
        toast.error('Empty response from server');
        return;
      }
      
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        console.error('Non-JSON response:', trimmed.substring(0, 200));
        toast.error('Server returned invalid response');
        return;
      }
      
      const data = JSON.parse(trimmed);
      console.log('📋 ADMIN: Pending approvals:', data);
      setPendingOrganizers(data.organizers || []);
      
      if (showToast) {
        toast.success(`Refreshed: ${data.count || 0} pending approval(s)`);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPendingApprovals(true);
  };

  const handleActivated = () => {
    // Refresh the list after activation
    fetchPendingApprovals(true);
  };

  const handleBulkActivate = async () => {
    setBulkActivating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/bulk-activate-subaccounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_ids: Array.from(selectedIds) }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk activate failed:', response.status, errorText);
        toast.error('Failed to activate subaccounts');
        return;
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        toast.error('Empty response from server');
        return;
      }
      
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        console.error('Non-JSON response:', trimmed.substring(0, 200));
        toast.error('Server returned invalid response');
        return;
      }
      
      const data = JSON.parse(trimmed);
      console.log('📋 ADMIN: Bulk activation:', data);
      toast.success(`Activated ${data.count || 0} subaccounts`);
      handleRefresh();
    } catch (error) {
      console.error('Error bulk activating subaccounts:', error);
      toast.error('Error activating subaccounts');
    } finally {
      setBulkActivating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredOrganizers.map(org => org.user_id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOrganizer = (userId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(userId);
    } else {
      newSelectedIds.delete(userId);
    }
    setSelectedIds(newSelectedIds);
  };

  useEffect(() => {
    let filtered = pendingOrganizers;
    if (searchQuery) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.bank_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (bankFilter !== 'all') {
      filtered = filtered.filter(org => org.bank_name === bankFilter);
    }
    setFilteredOrganizers(filtered);
  }, [pendingOrganizers, searchQuery, bankFilter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading pending approvals...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Organizers awaiting subaccount verification
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingOrganizers.length}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh List
            </>
          )}
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Label htmlFor="bankFilter" className="text-sm font-medium text-gray-700 mr-2">Bank:</Label>
          <Select
            value={bankFilter}
            onValueChange={setBankFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select bank">{bankFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {uniqueBanks.map(bank => (
                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or bank"
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Empty State */}
      {filteredOrganizers.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">All Caught Up!</h3>
            <p className="text-green-700">
              There are no pending subaccount approvals at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Organizers List */}
      {filteredOrganizers.length > 0 && (
        <div className="space-y-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Action Required:</strong> {filteredOrganizers.length} organizer{filteredOrganizers.length !== 1 ? 's' : ''} waiting for subaccount approval. 
              Review and activate to allow them to create events and receive payouts.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filteredOrganizers.length && filteredOrganizers.length > 0}
                onCheckedChange={handleSelectAll}
                id="selectAll"
              />
              <Label htmlFor="selectAll" className="cursor-pointer">
                Select All ({filteredOrganizers.length})
              </Label>
            </div>
            <Button
              onClick={handleBulkActivate}
              disabled={selectedIds.size === 0 || bulkActivating}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating {selectedIds.size}...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Bulk Activate ({selectedIds.size})
                </>
              )}
            </Button>
          </div>

          {filteredOrganizers.map((organizer) => (
            <div key={organizer.user_id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Checkbox
                  checked={selectedIds.has(organizer.user_id)}
                  onCheckedChange={(checked) => handleSelectOrganizer(organizer.user_id, !!checked)}
                  id={`select-${organizer.user_id}`}
                />
              </div>
              <AdminSubaccountActivation
                organizer={organizer}
                onActivated={handleActivated}
              />
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800 text-sm">
          💡 <strong>How it works:</strong> Organizers submit bank details → Make.com creates Paystack subaccount → 
          You verify and approve → Organizers can create events and receive instant payouts (95% after 5% platform fee).
        </AlertDescription>
      </Alert>
    </div>
  );
}