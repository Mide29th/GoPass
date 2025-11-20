import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, Landmark, Loader2, ArrowLeft } from 'lucide-react';
import { WEBHOOK_ORGANIZER_ONBOARDING } from '../lib/webhooks-config';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type BankDetailsFormProps = {
  userId: string;
  userEmail: string;
  userName: string;
  onComplete?: () => void;
  onBack?: () => void;
  onRefresh?: () => void;
};

type Bank = {
  name: string;
  code: string;
  slug: string;
};

export function BankDetailsForm({ userId, userEmail, userName, onComplete, onBack, onRefresh }: BankDetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  useEffect(() => {
    checkOrganizerStatus();
    fetchBanks();
  }, [userId]);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/banks`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch banks');
      }

      const result = await response.json();
      console.log('Fetched banks:', result.banks.length);
      
      // Sort banks alphabetically
      const sortedBanks = result.banks.sort((a: Bank, b: Bank) => 
        a.name.localeCompare(b.name)
      );
      
      setBanks(sortedBanks);
    } catch (error) {
      console.error('Error fetching banks:', error);
      toast.error('Failed to load banks. Please refresh the page.');
    } finally {
      setLoadingBanks(false);
    }
  };

  const checkOrganizerStatus = async () => {
    setCheckingStatus(true);
    try {
      // Get the authenticated user's ID directly from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        toast.error('Authentication error. Please sign in again.');
        setCheckingStatus(false);
        return;
      }

      const authenticatedUserId = user.id;
      console.log('Authenticated user ID:', authenticatedUserId);

      // Get organizer from KV store via server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/${authenticatedUserId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const { organizer } = await response.json();
        setIsSetupComplete(organizer?.subaccount_setup_complete || false);
        if (organizer?.bank_name) setBankName(organizer.bank_name);
        if (organizer?.bank_code) setBankCode(organizer.bank_code);
        if (organizer?.account_number) setAccountNumber(organizer.account_number);
        if (organizer?.account_name) setAccountName(organizer.account_name);
      } else {
        // Organizer not found - they haven't set up yet
        setIsSetupComplete(false);
      }
    } catch (error) {
      console.error('Error in checkOrganizerStatus:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleBankChange = (value: string) => {
    const selectedBank = banks.find(bank => bank.code === value);
    if (selectedBank) {
      setBankCode(selectedBank.code);
      setBankName(selectedBank.name);
      // Reset verification when bank changes
      setIsVerified(false);
      setAccountName('');
      setVerificationError('');
    }
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value);
    // Reset verification when account number changes
    setIsVerified(false);
    setAccountName('');
    setVerificationError('');
    
    // Auto-verify when 10 digits entered and bank is selected
    if (value.length === 10 && bankCode) {
      verifyAccount(value, bankCode);
    }
  };

  const verifyAccount = async (accNum: string, bCode: string) => {
    setVerifying(true);
    setVerificationError('');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/verify-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            account_number: accNum,
            bank_code: bCode,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.verified) {
        setIsVerified(true);
        setAccountName(result.account_name);
        toast.success(`Account verified: ${result.account_name}`);
      } else {
        setIsVerified(false);
        setAccountName('');
        setVerificationError(result.error || 'Could not verify account');
        toast.error(result.error || 'Invalid account number');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setIsVerified(false);
      setAccountName('');
      setVerificationError('Failed to verify account. Please try again.');
      toast.error('Failed to verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Get the authenticated user's ID directly from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        toast.error('Authentication error. Please sign in again.');
        setLoading(false);
        return;
      }

      const authenticatedUserId = user.id;
      console.log('=== STARTING BANK DETAILS SUBMISSION ===');
      console.log('Authenticated User ID:', authenticatedUserId);
      console.log('Bank Code:', bankCode);
      console.log('Account Number:', accountNumber);
      console.log('Account Name:', accountName);

      let subaccountCode = null;

      // Try to send to Make.com webhook
      try {
        const webhookPayload = {
          organizer_id: authenticatedUserId,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
          email: userEmail,
          business_name: userName,
        };

        console.log('=== SENDING TO MAKE.COM WEBHOOK ===');
        console.log('Webhook URL:', WEBHOOK_ORGANIZER_ONBOARDING);
        console.log('Payload:', JSON.stringify(webhookPayload, null, 2));

        const response = await fetch(WEBHOOK_ORGANIZER_ONBOARDING, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('=== MAKE.COM RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response Body:', responseText);

        if (response.ok) {
          try {
            const result = JSON.parse(responseText);
            console.log('✅ Parsed webhook response:', result);
            subaccountCode = result.subaccount_code || result.subaccount_id || null;
            
            if (subaccountCode) {
              console.log('✅ Received subaccount code:', subaccountCode);
              toast.success('Paystack subaccount created successfully!');
            } else {
              console.warn('⚠️ Webhook succeeded but no subaccount_code in response');
              toast.warning('Webhook received but subaccount code not returned. Check Make.com logs.');
            }
          } catch (parseError) {
            console.error('❌ Failed to parse webhook response as JSON:', parseError);
            console.log('Raw response:', responseText);
            
            // Check if response contains "Accepted" or success indicators
            if (responseText.includes('Accepted') || responseText.includes('success') || responseText.includes('200')) {
              console.log('✅ Webhook appears to have succeeded (non-JSON response)');
              toast.info('Webhook triggered successfully. Subaccount will be created in Make.com.');
            } else {
              toast.warning('Webhook responded but format unclear. Check Make.com for subaccount creation.');
            }
          }
        } else {
          console.error('❌ Make.com webhook returned error');
          console.error('Status:', response.status);
          console.error('Body:', responseText);
          toast.error(`Webhook error: ${response.status} - ${responseText.substring(0, 100)}`);
        }
      } catch (webhookError) {
        console.error('❌ ERROR CALLING MAKE.COM WEBHOOK:', webhookError);
        console.error('Error details:', {
          message: webhookError.message,
          stack: webhookError.stack,
          name: webhookError.name
        });
        toast.error(`Webhook connection failed: ${webhookError.message}`);
      }

      // Update organizer record with bank details and subaccount_id
      console.log('Updating database with bank details...');
      const updateData = {
        user_id: authenticatedUserId,
        email: userEmail,
        name: userName,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        paystack_subaccount_id: subaccountCode,
        // Since Paystack verified the account and Make.com will create the subaccount,
        // the organizer is ready to go! No admin approval needed.
        created_at: new Date().toISOString(),
      };
      
      console.log('Saving organizer data:', updateData);

      // Save to KV store via server endpoint
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error('Failed to save organizer data:', errorData);
        throw new Error(errorData.error || 'Failed to save organizer data');
      }

      const saveResult = await saveResponse.json();
      console.log('Organizer data saved successfully:', saveResult);

      toast.success('Bank details saved successfully!');
      
      // Refresh the status
      await checkOrganizerStatus();

      // Trigger refresh in parent component
      if (onRefresh) {
        onRefresh();
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting bank details:', error);
      toast.error(`Failed to save bank details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Checking setup status...</p>
        </CardContent>
      </Card>
    );
  }

  if (isSetupComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Bank Account Verified</CardTitle>
              <CardDescription>Your payout account is set up and ready</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Setup Complete!</strong> You'll receive payouts directly to your bank account for every ticket sold.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm">Payout Account Details:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Bank:</strong> {bankName}</p>
              <p><strong>Account Number:</strong> {accountNumber}</p>
              <p><strong>Account Name:</strong> {accountName}</p>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              You're all set! Start creating events to receive instant payouts.
            </p>
            {onComplete && (
              <Button onClick={onComplete} className="w-full">
                Continue to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Landmark className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <CardTitle>Setup Your Payout Account</CardTitle>
            <CardDescription>
              Add your bank account to receive instant payouts for ticket sales
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Direct Payouts:</strong> Your ticket sales will be automatically split - you'll receive your earnings minus a 5% platform fee, sent directly to your bank account.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bank">Bank Name</Label>
            <Select value={bankCode} onValueChange={handleBankChange} required disabled={loadingBanks}>
              <SelectTrigger>
                <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Select your bank"} />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingBanks && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading banks from Paystack...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <div className="relative">
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="0123456789"
                maxLength={10}
                disabled={!bankCode}
                required
                className={
                  verifying ? 'pr-10' : 
                  isVerified ? 'pr-10 border-green-500' : 
                  verificationError ? 'pr-10 border-red-500' : ''
                }
              />
              {verifying && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {isVerified && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
              )}
              {verificationError && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
              )}
            </div>
            {!bankCode && (
              <p className="text-xs text-muted-foreground">
                Please select a bank first
              </p>
            )}
            {verifying && (
              <p className="text-xs text-blue-600">
                Verifying account number...
              </p>
            )}
            {verificationError && (
              <p className="text-xs text-red-600">
                {verificationError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={accountName}
              readOnly
              placeholder={isVerified ? accountName : "Will be auto-filled after verification"}
              className={isVerified ? 'bg-green-50 border-green-300' : 'bg-muted'}
              required
            />
            {isVerified ? (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Account verified successfully
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter your 10-digit account number to auto-verify
              </p>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <h4>What happens next?</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Your bank details will be securely sent to Paystack</li>
              <li>A payout account (subaccount) will be created</li>
              <li>You'll receive payments automatically for each ticket sold</li>
              <li>Platform commission (5%) is deducted automatically</li>
            </ol>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isVerified || verifying}>
            {loading ? 'Setting Up Account...' : 
             verifying ? 'Verifying Account...' :
             !isVerified ? 'Verify Account Number First' :
             'Complete Setup'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}