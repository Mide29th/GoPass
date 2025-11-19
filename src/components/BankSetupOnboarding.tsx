import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Landmark, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign,
  Zap,
  Shield
} from 'lucide-react';

type BankSetupOnboardingProps = {
  userName: string;
  onSetupNow: () => void;
  onSkip: () => void;
};

export function BankSetupOnboarding({ userName, onSetupNow, onSkip }: BankSetupOnboardingProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to GoPass, {userName}! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's set up your payout account so you can start earning
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Why Setup Bank Details */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Why add your bank details?
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Create events</strong> and sell tickets instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Receive automatic payouts</strong> directly to your bank account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Keep 95% of every ticket sale</strong> (only 5% platform fee)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Secure payments</strong> processed through Paystack</span>
              </li>
            </ul>
          </div>

          {/* How It Works */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Quick Setup Process (2 minutes)
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Enter Bank Details</p>
                  <p className="text-xs text-muted-foreground">Bank name, account number, and account name</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Automatic Verification</p>
                  <p className="text-xs text-muted-foreground">Our system creates your Paystack subaccount</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Admin Approval</p>
                  <p className="text-xs text-muted-foreground">Quick review (usually within minutes)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Start Creating Events!</p>
                  <p className="text-xs text-muted-foreground">You're ready to sell tickets and get paid</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Your information is secure</p>
              <p className="text-green-700 text-xs mt-1">
                Bank details are encrypted and stored securely. We use Paystack's verified payment infrastructure.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onSetupNow} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              Set Up Bank Details Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={onSkip} 
              variant="outline"
              size="lg"
              className="sm:w-32"
            >
              Skip for Now
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            You can set up your bank details anytime from Settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}