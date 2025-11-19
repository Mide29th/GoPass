import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Shield, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type AdminLoginProps = {
  onLoginSuccess: (adminId: string, adminToken: string) => void;
};

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      // Read response as text first
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

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Admin login successful!');
      onLoginSuccess(result.admin_id, result.token);
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-purple-500/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Access the GoPass administration panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-purple-50 border-purple-200">
            <Shield className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              This area is restricted to authorized administrators only.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>First time setup?</strong> Run the SQL in <code className="bg-background px-1 rounded">/ADMIN_SETUP.sql</code> via Supabase SQL Editor to create your admin account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}