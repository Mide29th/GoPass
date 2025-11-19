import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { Settings, Percent, Save, DollarSign } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Alert, AlertDescription } from '../ui/alert';
import { WEBHOOK_ORGANIZER_ONBOARDING } from '../../lib/webhooks-config';

type AdminSettingsProps = {
  adminToken: string;
};

export function AdminSettings({ adminToken }: AdminSettingsProps) {
  const [commissionPercentage, setCommissionPercentage] = useState('5');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/settings`,
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
        console.error('Settings fetch failed:', response.status, errorText);
        
        // Try to parse as JSON
        let errorMessage = 'Failed to fetch settings';
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
      if (result.commission_percentage) {
        setCommissionPercentage(result.commission_percentage.toString());
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const percentage = parseFloat(commissionPercentage);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({
            commission_percentage: percentage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateExample = () => {
    const percentage = parseFloat(commissionPercentage) || 5;
    const ticketPrice = 10000;
    const platformFee = (ticketPrice * percentage) / 100;
    const organizerGets = ticketPrice - platformFee;

    return {
      ticketPrice,
      platformFee,
      organizerGets,
      percentage,
    };
  };

  const example = calculateExample();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Platform Settings</h2>
        <p className="text-muted-foreground">Configure commission rates and platform settings</p>
      </div>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Commission Percentage</CardTitle>
              <CardDescription>
                Platform fee deducted from ticket sales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Important:</strong> This setting affects new subaccounts only. Existing organizers keep their current commission rate.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="commission">Platform Commission (%)</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                  className="pr-8"
                  disabled={loading}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button onClick={handleSave} disabled={saving || loading}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of each ticket sale that goes to GoPass platform
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Example Calculation
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Price:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                  }).format(example.ticketPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee ({example.percentage}%):</span>
                <span className="font-medium text-green-600">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                  }).format(example.platformFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Organizer Receives ({100 - example.percentage}%):</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 0,
                  }).format(example.organizerGets)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Make.com Webhook Configuration</CardTitle>
          <CardDescription>
            How to update commission in your Make.com scenario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm mb-2"><strong>Current Webhook URL:</strong></p>
            <code className="text-xs bg-background p-2 rounded block break-all">
              {WEBHOOK_ORGANIZER_ONBOARDING}
            </code>
          </div>

          <Alert>
            <AlertDescription>
              <strong>To apply the new commission percentage:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                <li>Go to your Make.com scenario (Organizer Onboarding)</li>
                <li>Click on the HTTP module (creates Paystack subaccount)</li>
                <li>Find the <code className="bg-muted px-1 rounded">percentage_charge</code> parameter</li>
                <li>Update it to: <code className="bg-muted px-1 rounded">{commissionPercentage}</code></li>
                <li>Save the scenario</li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                This ensures new organizers get the updated commission rate when they sign up.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}