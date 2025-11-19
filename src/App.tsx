import { useState, useEffect } from 'react';
import { EventCreationForm } from './components/EventCreationForm';
import { TicketPurchase } from './components/TicketPurchase';
import { TicketDisplay } from './components/TicketDisplay';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { CheckInScanner } from './components/CheckInScanner';
import { EventBrowser } from './components/EventBrowser';
import { AuthForm } from './components/AuthForm';
import { OrganizerHub } from './components/OrganizerHub';
import { BankDetailsForm } from './components/BankDetailsForm';
import { BankSetupOnboarding } from './components/BankSetupOnboarding';
import { ProfileSettings } from './components/ProfileSettings';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSetupHelper } from './components/AdminSetupHelper';
import { Toaster } from './components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { initializeTables, isSupabaseConfigured } from './lib/supabase';
import { Ticket, Calendar, Database, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';

type View = 'select' | 'auth' | 'organizer-hub' | 'bank-setup' | 'profile-settings' | 'create-event' | 'browse-events' | 'buy-ticket' | 'view-ticket' | 'dashboard' | 'check-in' | 'admin-login' | 'admin-dashboard';

export default function App() {
  const [view, setView] = useState<View>('select');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [purchasedTicketId, setPurchasedTicketId] = useState<string>('');
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [showBankOnboarding, setShowBankOnboarding] = useState(false);
  const [isNewSignup, setIsNewSignup] = useState(false);
  
  // Refresh counter to force OrganizerHub to re-check bank setup
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string>('');

  useEffect(() => {
    const connected = isSupabaseConfigured();
    setSupabaseConnected(connected);
    if (connected) {
      initializeTables();
    }
  }, []);

  const handleAuthSuccess = (uid: string, token: string, name: string, email: string) => {
    setIsAuthenticated(true);
    setUserId(uid);
    setAccessToken(token);
    setUserName(name);
    setUserEmail(email);
    setView('organizer-hub');
  };

  const handleAuthSuccessFromEventCreation = (uid: string, token: string, name: string, email: string) => {
    setIsAuthenticated(true);
    setUserId(uid);
    setAccessToken(token);
    setUserName(name);
    setUserEmail(email);
    // Stay on the create-event view so they can save
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserId('');
    setAccessToken('');
    setUserName('');
    setUserEmail('');
    setView('select');
  };

  const handleAdminLogin = (aid: string, token: string) => {
    setIsAdminAuthenticated(true);
    setAdminId(aid);
    setAdminToken(token);
    setView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminId('');
    setAdminToken('');
    setView('select');
  };

  const handleEventCreated = (eventId: string) => {
    setSelectedEventId(eventId);
    setView('organizer-hub');
  };

  const handlePurchaseComplete = (orderId: string, ticketId: string) => {
    setPurchasedTicketId(ticketId);
    setView('view-ticket');
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setView('buy-ticket');
  };

  // Show Supabase connection required screen
  if (!supabaseConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Supabase Connection Required</CardTitle>
                <CardDescription>Connect your Supabase project to get started</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Backend Database Needed</AlertTitle>
              <AlertDescription className="text-blue-800 space-y-2">
                <p>
                  This application requires Supabase to store events, tickets, and attendee information.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3>Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>
                  <strong>Connect Supabase:</strong> Click the Supabase connection button in your Figma Make interface to connect your Supabase project
                </li>
                <li>
                  <strong>Set up Database:</strong> Once connected, go to your Supabase project dashboard → SQL Editor
                </li>
                <li>
                  <strong>Run SQL Script:</strong> Copy the SQL from <code className="bg-muted px-1 rounded">/lib/database-setup.sql</code> and run it to create the necessary tables
                </li>
                <li>
                  <strong>Refresh:</strong> Reload this application after connecting Supabase
                </li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm mb-2">What you'll be able to do:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Create and manage events</li>
                <li>✓ Sell tickets with multiple pricing tiers</li>
                <li>✓ Receive real-time sale notifications</li>
                <li>✓ Track attendee check-ins</li>
                <li>✓ Generate QR code tickets</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'auth':
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
      
      case 'organizer-hub':
        return (
          <OrganizerHub
            userId={userId}
            userName={userName}
            userEmail={userEmail}
            onLogout={handleLogout}
            onCreateEvent={() => setView('create-event')}
            onViewDashboard={(eventId) => {
              setSelectedEventId(eventId);
              setView('dashboard');
            }}
            onCheckIn={(eventId) => {
              setSelectedEventId(eventId);
              setView('check-in');
            }}
            onBankSetup={() => setView('bank-setup')}
            onProfileSettings={() => setView('profile-settings')}
            refreshCounter={refreshCounter}
          />
        );
      
      case 'create-event':
        return (
          <EventCreationForm 
            onEventCreated={handleEventCreated}
            userId={userId}
            userEmail={userEmail}
            onAuthSuccess={handleAuthSuccessFromEventCreation}
          />
        );
      
      case 'browse-events':
        return (
          <EventBrowser 
            onSelectEvent={handleSelectEvent}
          />
        );
      
      case 'buy-ticket':
        return (
          <TicketPurchase 
            eventId={selectedEventId} 
            onPurchaseComplete={handlePurchaseComplete}
          />
        );
      
      case 'view-ticket':
        return <TicketDisplay ticketId={purchasedTicketId} />;
      
      case 'dashboard':
        return (
          <OrganizerDashboard 
            eventId={selectedEventId}
            onCheckIn={() => setView('check-in')}
            onBack={() => setView('organizer-hub')}
          />
        );
      
      case 'check-in':
        return (
          <CheckInScanner
            eventId={selectedEventId}
            onBack={() => setView('dashboard')}
          />
        );
      
      case 'bank-setup':
        return (
          <BankDetailsForm
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            onComplete={() => setView('organizer-hub')}
            onBack={() => setView('organizer-hub')}
            onRefresh={() => setRefreshCounter(prev => prev + 1)}
          />
        );
      
      case 'profile-settings':
        return (
          <ProfileSettings
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            onBack={() => setView('organizer-hub')}
          />
        );
      
      case 'admin-login':
        return <AdminLogin onLoginSuccess={handleAdminLogin} />;
      
      case 'admin-dashboard':
        return <AdminDashboard adminId={adminId} adminToken={adminToken} onLogout={handleAdminLogout} />;
      
      default:
        return (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center space-y-4 mb-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Ticket className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl">GoPass</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create events, sell tickets, and manage check-ins with real-time notifications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Organizer Section */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>For Organizers</CardTitle>
                      <CardDescription>Create and manage your events</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => setView('create-event')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm mb-2">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Secure organizer account</li>
                      <li>✓ Dashboard for all events</li>
                      <li>✓ Attendee repository</li>
                      <li>✓ Real-time sale notifications</li>
                      <li>✓ Multiple ticket types</li>
                      <li>✓ Check-in management</li>
                      <li>✓ Revenue tracking</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Attendee Section */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>For Attendees</CardTitle>
                      <CardDescription>Browse and purchase event tickets</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => setView('browse-events')}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Browse Events
                  </Button>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm mb-2">What you get:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Search by name, organizer & date</li>
                      <li>✓ Instant ticket delivery</li>
                      <li>✓ Email confirmation</li>
                      <li>✓ QR code for entry</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Organizer Login/Signup Button */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-background">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg">Existing Organizer?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to access your dashboard, view all events, and manage attendees
                  </p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    onClick={() => setView('auth')}
                    size="lg"
                  >
                    Login / Sign Up
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Demo Instructions */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    1
                  </div>
                  <h3>Create Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Organizers create events with ticket types and pricing
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    2
                  </div>
                  <h3>Sell Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Share event ID with attendees who can purchase tickets instantly
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    3
                  </div>
                  <h3>Check-In</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan QR codes or enter ticket IDs to check in attendees
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Data Helper */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Demo Payment Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
                <p><strong>Expiry:</strong> Any future date (e.g., 12/25)</p>
                <p><strong>CVV:</strong> Any 3 digits (e.g., 123)</p>
                <p className="text-xs text-muted-foreground pt-2">
                  Note: This is a demo. No real payments are processed.
                </p>
              </CardContent>
            </Card>

            {/* Admin Access */}
            <div className="text-center pt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setView('admin-login')}
              >
                <Shield className="w-3 h-3 mr-1" />
                Admin Access
              </Button>
            </div>
          </div>
        );
    }
  };

  const getBackButton = () => {
    switch (view) {
      case 'auth':
        return { text: '← Back to Home', onClick: () => setView('select') };
      case 'create-event':
        return { 
          text: isAuthenticated ? '← Back to Dashboard' : '← Back to Home', 
          onClick: () => setView(isAuthenticated ? 'organizer-hub' : 'select') 
        };
      case 'browse-events':
        return { text: '← Back to Home', onClick: () => setView('select') };
      case 'buy-ticket':
        return { text: '← Back to Events', onClick: () => setView('browse-events') };
      case 'view-ticket':
        return { text: '← Back to Home', onClick: () => setView('select') };
      default:
        return null;
    }
  };

  const backButton = getBackButton();

  return (
    <div className="min-h-screen bg-background">
      {backButton && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <Button variant="ghost" onClick={backButton.onClick}>
              {backButton.text}
            </Button>
          </div>
        </div>
      )}
      
      <div className="container mx-auto py-6">
        {renderView()}
      </div>
      
      <Toaster />
    </div>
  );
}