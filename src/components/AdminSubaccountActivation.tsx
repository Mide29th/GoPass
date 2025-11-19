import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Eye, 
  UserCheck,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AdminSubaccountActivationProps {
  organizer: any;
  onActivated: () => void;
  onSelect?: (userId: string, checked: boolean) => void;
  selected?: boolean;
}

export function AdminSubaccountActivation({ organizer, onActivated, onSelect, selected }: AdminSubaccountActivationProps) {
  const [checking, setChecking] = useState(false);
  const [activating, setActivating] = useState(false);
  const [paystackData, setPaystackData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const hasBankDetails = organizer?.bank_name && organizer?.account_number;
  const hasSubaccountId = !!organizer?.paystack_subaccount_id;
  const isActivated = organizer?.subaccount_setup_complete;

  const checkPaystackAPI = async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/verify-organizer-paystack`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            organizerId: organizer.user_id,
            subaccountId: organizer.paystack_subaccount_id 
          }),
        }
      );

      const result = await response.json();
      console.log('🔍 ADMIN: Paystack verification result:', result);
      
      if (result.verified) {
        setPaystackData(result.paystack_data);
        toast.success('✅ Verified with Paystack API');
      } else {
        toast.error(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying with Paystack:', error);
      toast.error('Failed to verify with Paystack');
    } finally {
      setChecking(false);
    }
  };

  const activateSubaccount = async () => {
    setActivating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/activate-organizer-subaccount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ organizerId: organizer.user_id }),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`✅ ADMIN: Activated subaccount for ${organizer.name}`);
        onActivated();
      } else {
        toast.error(result.error || 'Activation failed');
      }
    } catch (error) {
      console.error('Error activating subaccount:', error);
      toast.error('Activation failed');
    } finally {
      setActivating(false);
    }
  };

  // Don't show anything if already activated
  if (isActivated) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>ADMIN:</strong> This organizer's subaccount is already activated
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if no bank details
  if (!hasBankDetails) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>ADMIN:</strong> Organizer has not submitted bank details yet
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if no subaccount ID
  if (!hasSubaccountId) {
    return (
      <Alert className="bg-orange-50 border-orange-200">
        <XCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>ADMIN:</strong> Bank details submitted but no Paystack subaccount ID found. 
          Check Make.com webhook logs.
        </AlertDescription>
      </Alert>
    );
  }

  // Main activation interface
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">ADMIN: Subaccount Activation Required</CardTitle>
        <CardDescription className="text-blue-700">
          Review and activate this organizer's payout account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organizer Info */}
        <div className="bg-white p-4 rounded-lg space-y-3 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Organizer</p>
              <p className="font-medium">{organizer.name}</p>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              <Clock className="w-3 h-3 mr-1" />
              Pending Approval
            </Badge>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm">{organizer.email}</p>
          </div>

          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {showDetails ? 'Hide' : 'Show'} Bank Details
              </span>
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-2 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="font-medium">{organizer.bank_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="font-medium font-mono">{organizer.account_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="font-medium">{organizer.account_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paystack Subaccount ID</p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {organizer.paystack_subaccount_id}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Paystack Verification Result */}
        {paystackData && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Verified with Paystack</strong>
              <div className="mt-2 space-y-1 text-sm">
                <p>• Subaccount exists in Paystack</p>
                <p>• Business Name: {paystackData.business_name || 'N/A'}</p>
                <p>• Settlement Bank: {paystackData.settlement_bank || 'N/A'}</p>
                <p>• Account Number: {paystackData.account_number || 'N/A'}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="grid gap-2">
          <Button 
            onClick={checkPaystackAPI} 
            disabled={checking}
            variant="outline"
            className="w-full"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying with Paystack API...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Verify with Paystack API
              </>
            )}
          </Button>

          <Button 
            onClick={activateSubaccount} 
            disabled={activating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {activating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating Organizer...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Approve & Activate Subaccount
              </>
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800 text-sm">
            💡 <strong>ADMIN Note:</strong> Once activated, the organizer can create events and receive instant payouts (95% after 5% platform fee).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}