import { useState, useEffect } from 'react';
import { Settings, User, Landmark, ArrowLeft, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { SubaccountDebugger } from './SubaccountDebugger';
import { OrganizerBankStatusDisplay } from './OrganizerBankStatusDisplay';
import { supabase } from '../lib/supabase';

type ProfileSettingsProps = {
  userId: string;
  userEmail: string;
  userName: string;
  onBack?: () => void;
};

type OrganizerProfile = {
  user_id: string;
  email: string;
  name: string;
  bank_name?: string;
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  paystack_subaccount_id?: string;
  subaccount_setup_complete?: boolean;
  created_at?: string;
};

export function ProfileSettings({ userId, userEmail, userName, onBack }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [verifyingSubaccount, setVerifyingSubaccount] = useState(false);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoadingProfile(true);
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
        console.log('📊 Loaded organizer profile:', organizer);
        setProfile(organizer);
        if (organizer.name) setName(organizer.name);
        if (organizer.email) setEmail(organizer.email);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleVerifySubaccount = async () => {
    setVerifyingSubaccount(true);
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
      
      if (result.verified) {
        toast.success(result.message || 'Subaccount verified successfully!');
        await loadProfile(); // Reload profile to show updated status
      } else {
        toast.error(result.message || 'Subaccount verification failed');
      }
    } catch (error) {
      console.error('Error verifying subaccount:', error);
      toast.error('Failed to verify subaccount. Please try again.');
    } finally {
      setVerifyingSubaccount(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the authenticated user's ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('Authentication error. Please sign in again.');
        setLoading(false);
        return;
      }

      const updateData = {
        ...profile,
        user_id: user.id,
        email: email,
        name: name,
        created_at: profile?.created_at || new Date().toISOString(),
      };

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
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Information Card */}
      <Card>
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
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This email will be used for all event and payout notifications
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating Profile...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bank Account Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Landmark className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Payout Account</CardTitle>
              <CardDescription>
                Bank account for receiving ticket sales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.account_number && profile?.account_name ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Payout account active</strong> - You're all set to receive instant payments
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{profile.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-medium font-mono">{profile.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium">{profile.account_name}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Note: To change your bank account, please contact support.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Landmark className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Bank account not set up yet.</strong> Complete your payout account setup to start receiving payments.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                Go back to your dashboard and click "Setup Payout Account" to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your organizer account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{userId}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Created</span>
              <span>
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Account Status</span>
              <span className={profile?.subaccount_setup_complete ? 'text-green-600' : 'text-amber-600'}>
                {profile?.subaccount_setup_complete ? 'Verified' : 'Pending Setup'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subaccount Debugger - Shows only if having issues */}
      <SubaccountDebugger userId={userId} />

      {/* ORGANIZER Bank Setup Flow - Only show if not complete */}
      {!profile?.subaccount_setup_complete && (
        <OrganizerBankStatusDisplay 
          organizerData={profile}
        />
      )}
    </div>
  );
}