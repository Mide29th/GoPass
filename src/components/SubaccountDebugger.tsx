import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Code } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SubaccountDebuggerProps {
  userId: string;
}

export function SubaccountDebugger({ userId }: SubaccountDebuggerProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [forceActivating, setForceActivating] = useState(false);
  const [organizerData, setOrganizerData] = useState<any>(null);

  const loadOrganizerData = async () => {
    setLoading(true);
    try {
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
        console.log('🔍 DEBUG - Full organizer data:', organizer);
        setOrganizerData(organizer);
      } else {
        toast.error('Failed to load organizer data');
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const verifyWithPaystack = async () => {
    setVerifying(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/verify-subaccount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      console.log('🔍 Verification result:', result);
      
      if (result.verified) {
        toast.success('Subaccount verified with Paystack!');
        await loadOrganizerData();
      } else {
        toast.error(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying:', error);
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const forceActivate = async () => {
    if (!organizerData?.paystack_subaccount_id) {
      toast.error('No Paystack subaccount ID found');
      return;
    }

    setForceActivating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/force-activate-subaccount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        toast.success('Subaccount activated!');
        await loadOrganizerData();
      } else {
        toast.error(result.error || 'Activation failed');
      }
    } catch (error) {
      console.error('Error activating:', error);
      toast.error('Activation failed');
    } finally {
      setForceActivating(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Subaccount Debugger
        </CardTitle>
        <CardDescription>
          Debug and fix Paystack subaccount activation issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={loadOrganizerData} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Current Database Data
            </>
          )}
        </Button>

        {organizerData && (
          <div className="space-y-4">
            {/* Status Summary */}
            <Alert className={organizerData.subaccount_setup_complete ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <AlertDescription className="space-y-2">
                <div className="flex items-center gap-2">
                  {organizerData.subaccount_setup_complete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">Subaccount is ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-800">Subaccount is INACTIVE</span>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Key Fields */}
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h3 className="font-semibold">Key Fields:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-xs">{organizerData.user_id || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span>{organizerData.name || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{organizerData.email || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Name:</span>
                  <span>{organizerData.bank_name || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span>{organizerData.account_number || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name:</span>
                  <span>{organizerData.account_name || '❌ Missing'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paystack Subaccount ID:</span>
                  <span className={`font-mono text-xs ${organizerData.paystack_subaccount_id ? 'text-green-600' : 'text-red-600'}`}>
                    {organizerData.paystack_subaccount_id || '❌ Missing'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Setup Complete Flag:</span>
                  <span className={organizerData.subaccount_setup_complete ? 'text-green-600' : 'text-red-600'}>
                    {organizerData.subaccount_setup_complete ? '✅ TRUE' : '❌ FALSE'}
                  </span>
                </div>

                {organizerData.paystack_verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paystack Verified:</span>
                    <span className="text-green-600">✅ {organizerData.paystack_verified}</span>
                  </div>
                )}

                {organizerData.last_verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Verified:</span>
                    <span className="text-xs">{new Date(organizerData.last_verified).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Full JSON */}
            <details className="bg-gray-50 p-3 rounded border">
              <summary className="cursor-pointer font-semibold text-sm mb-2">
                View Full JSON Data
              </summary>
              <pre className="text-xs overflow-auto max-h-64 bg-gray-900 text-green-400 p-3 rounded">
                {JSON.stringify(organizerData, null, 2)}
              </pre>
            </details>

            {/* Action Buttons */}
            <div className="space-y-2">
              {organizerData.paystack_subaccount_id && !organizerData.subaccount_setup_complete && (
                <>
                  <Button 
                    onClick={verifyWithPaystack} 
                    disabled={verifying}
                    variant="default"
                    className="w-full"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying with Paystack API...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify with Paystack API
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={forceActivate} 
                    disabled={forceActivating}
                    variant="destructive"
                    className="w-full"
                  >
                    {forceActivating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Force Activate (Skip Verification)
                      </>
                    )}
                  </Button>
                </>
              )}

              {!organizerData.paystack_subaccount_id && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    <strong>No Paystack Subaccount ID found.</strong><br />
                    You need to complete the bank setup form first. The Make.com webhook should create the subaccount and return the ID.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
