import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, CheckCircle2, XCircle, AlertCircle, Landmark } from 'lucide-react';

interface OrganizerBankStatusDisplayProps {
  organizerData: any;
}

export function OrganizerBankStatusDisplay({ organizerData }: OrganizerBankStatusDisplayProps) {
  const hasBankDetails = organizerData?.bank_name && organizerData?.account_number;
  const hasSubaccountId = !!organizerData?.paystack_subaccount_id;
  const isActivated = organizerData?.subaccount_setup_complete;

  // Scenario 1: No bank details submitted yet
  if (!hasBankDetails) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Landmark className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-900">Bank Account Not Set Up</CardTitle>
              <CardDescription className="text-amber-700">
                You need to submit your bank details to receive payouts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-white border-amber-300">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <strong>Next Step:</strong> Complete the bank setup form to start receiving instant payouts for your ticket sales.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Scenario 2: Bank details submitted but no subaccount ID (Make.com issue)
  if (hasBankDetails && !hasSubaccountId) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-orange-900">Processing Bank Details</CardTitle>
              <CardDescription className="text-orange-700">
                Your bank information is being verified
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-white border-orange-300">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Status:</strong> Your bank details have been submitted and are being processed through our payment provider.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-4 rounded-lg space-y-3 border">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="font-medium">{organizerData.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-medium font-mono">{organizerData.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="font-medium">{organizerData.account_name}</p>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              💡 This usually takes a few minutes. If it's been longer, please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Scenario 3: Has subaccount ID but waiting for admin approval
  if (hasSubaccountId && !isActivated) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Pending Admin Approval</CardTitle>
              <CardDescription className="text-blue-700">
                Your payout account is awaiting verification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-white border-blue-300">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Almost there!</strong> Your bank account has been submitted and is awaiting admin verification. You'll be notified once approved.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-4 rounded-lg space-y-3 border">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="font-medium">{organizerData.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-medium font-mono">{organizerData.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="font-medium">{organizerData.account_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subaccount ID</p>
              <p className="font-mono text-xs text-muted-foreground">
                {organizerData.paystack_subaccount_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                <Clock className="w-3 h-3" />
                Awaiting Approval
              </span>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800 text-sm">
              ⚠️ <strong>Note:</strong> You cannot create events until your payout account is approved by an administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Scenario 4: Everything approved and activated
  if (isActivated) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-900">✅ Payout Account Approved</CardTitle>
              <CardDescription className="text-green-700">
                You're all set to receive instant payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-white border-green-300">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Approved!</strong> Your payout account is active. You'll receive instant payments to your bank account when tickets are sold.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-4 rounded-lg space-y-3 border">
            <div>
              <p className="text-xs text-muted-foreground">Bank Name</p>
              <p className="font-medium">{organizerData.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="font-medium font-mono">{organizerData.account_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="font-medium">{organizerData.account_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subaccount ID</p>
              <p className="font-mono text-xs text-muted-foreground">
                {organizerData.paystack_subaccount_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            {organizerData.activated_at && (
              <div>
                <p className="text-xs text-muted-foreground">Approved On</p>
                <p className="text-sm">
                  {new Date(organizerData.activated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              💰 You earn 95% of every ticket sale with automatic payouts to this account!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}