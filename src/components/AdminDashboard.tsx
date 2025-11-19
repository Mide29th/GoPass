import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AdminOverview } from './admin/AdminOverview';
import { AdminOrganizers } from './admin/AdminOrganizers';
import { AdminEvents } from './admin/AdminEvents';
import { AdminTickets } from './admin/AdminTickets';
import { AdminSettings } from './admin/AdminSettings';
import { AdminPendingApprovals } from './admin/AdminPendingApprovals';
import { AdminBackupRestore } from './admin/AdminBackupRestore';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Ticket, 
  Settings, 
  LogOut,
  Shield,
  UserCheck,
  Bell,
  Database
} from 'lucide-react';

type AdminDashboardProps = {
  adminId: string;
  adminToken: string;
  onLogout: () => void;
};

export function AdminDashboard({ adminId, adminToken, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/pending-subaccounts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Pending count fetch failed:', response.status);
        return;
      }

      // Read response as text first, then parse
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        console.error('Empty response from server');
        return;
      }
      
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        console.error('Non-JSON response:', trimmed.substring(0, 200));
        return;
      }
      
      const data = JSON.parse(trimmed);
      setPendingCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">GoPass Admin</h1>
                <p className="text-xs text-muted-foreground">Administration Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setActiveTab('pendingApprovals')}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <>
                    <span className="absolute top-0 right-0 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {pendingCount}
                    </Badge>
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="pendingApprovals" className="gap-2 relative">
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Approvals</span>
                {pendingCount > 0 && (
                  <Badge className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-red-500 text-white text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="organizers" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Organizers</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="backupRestore" className="gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Backup/Restore</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <AdminOverview adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="organizers">
            <AdminOrganizers adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="events">
            <AdminEvents adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="tickets">
            <AdminTickets adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="pendingApprovals">
            <AdminPendingApprovals adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="backupRestore">
            <AdminBackupRestore adminToken={adminToken} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}