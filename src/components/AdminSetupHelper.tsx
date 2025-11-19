import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Alert, AlertDescription } from './ui/alert';

export function AdminSetupHelper() {
  const [email, setEmail] = useState('admin@gopass.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/setup-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Setup failed');
      }

      toast.success('Admin account created successfully!');
      setSuccess(true);
    } catch (error: any) {
      console.error('Admin setup error:', error);
      toast.error(error.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-green-500/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">Setup Complete!</CardTitle>
            <CardDescription>
              Your admin account has been created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> You can now login to the admin dashboard.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Your Admin Credentials:</p>
              <p className="text-xs text-muted-foreground">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Password:</strong> (the one you just entered)
              </p>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.location.reload()}
            >
              Go to Admin Login
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Click the "Admin Access" button at the bottom of the home page to login
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-purple-500/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <CardDescription>
            Create your GoPass admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>One-time setup:</strong> This creates your admin account. You only need to do this once.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gopass.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This will be your login email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters (keep it secure!)
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Only one admin account can exist. If you already created one, use the login page instead.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
