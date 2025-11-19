import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../lib/supabase';

type AuthFormProps = {
  onAuthSuccess: (userId: string, accessToken: string, userName: string, userEmail: string) => void;
  embedded?: boolean;
};

export function AuthForm({ onAuthSuccess, embedded = false }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [signinData, setSigninData] = useState({ email: '', password: '' });
  const [isSignIn, setIsSignIn] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(signupData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const result = await response.json();
      console.log('Signup successful:', result);

      toast.success('Account created successfully!');
      setSignupData({ name: '', email: '', password: '' });
      
      // Check if we got a session back (auto-signin was successful)
      if (result.session) {
        console.log('Auto-signin successful, setting session...');
        
        // Set the session in the Supabase client
        const { error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (error) {
          console.error('Error setting session:', error);
          toast.error('Session error. Please sign in manually.');
          setIsSignIn(true);
        } else {
          // Session set successfully, call onAuthSuccess
          onAuthSuccess(
            result.user.id,
            result.session.access_token,
            result.user.user_metadata?.name || signupData.name,
            result.user.email
          );
        }
      } else if (result.needsManualSignIn) {
        // User created but auto-signin failed
        console.log('User created, but auto-signin failed. Switching to sign in form.');
        toast.info('Account created! Please sign in.');
        setIsSignIn(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/auth/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(signinData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign in');
      }

      const result = await response.json();
      console.log('Sign in successful:', result);

      // Set the session in the Supabase client
      if (result.session) {
        const { error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (error) {
          console.error('Error setting session:', error);
          throw error;
        }
      }

      toast.success('Signed in successfully!');

      if (onAuthSuccess) {
        onAuthSuccess(
          result.user.id,
          result.session.access_token,
          result.user.user_metadata?.name || result.user.email?.split('@')[0] || '',
          result.user.email
        );
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const tabsContent = (
    <Tabs defaultValue="signin">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={signinData.email}
              onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              value={signinData.password}
              onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              type="text"
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );

  if (embedded) {
    return tabsContent;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Organizer Portal</CardTitle>
          <CardDescription>Sign in or create an account to manage your events</CardDescription>
        </CardHeader>
        <CardContent>
          {tabsContent}
        </CardContent>
      </Card>
    </div>
  );
}