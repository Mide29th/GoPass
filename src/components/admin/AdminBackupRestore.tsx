import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle,
  CheckCircle,
  FileJson,
  Calendar,
  HardDrive
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Alert, AlertDescription } from '../ui/alert';
import { downloadBackup, parseBackupFile } from '../../utils/exportUtils';

type AdminBackupRestoreProps = {
  adminToken: string;
};

export function AdminBackupRestore({ adminToken }: AdminBackupRestoreProps) {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      // Fetch all data from server
      const [organizersRes, eventsRes, ticketsRes, settingsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/organizers`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/events`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/tickets`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/settings`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }),
      ]);

      // Helper function to safely parse JSON responses
      const safeParseJSON = async (response: Response, dataType: string) => {
        if (!response.ok) {
          console.error(`${dataType} fetch failed:`, response.status, response.statusText);
          return null;
        }
        
        try {
          // Read response as text first (can only read once!)
          const text = await response.text();
          
          if (!text || text.trim().length === 0) {
            console.warn(`${dataType} returned empty response`);
            return null;
          }
          
          // Check if response looks like JSON
          const trimmed = text.trim();
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            console.error(`${dataType} returned non-JSON response:`, trimmed.substring(0, 200));
            return null;
          }
          
          return JSON.parse(trimmed);
        } catch (parseError) {
          console.error(`${dataType} JSON parse error:`, parseError);
          return null;
        }
      };

      const organizers = await safeParseJSON(organizersRes, 'Organizers');
      const events = await safeParseJSON(eventsRes, 'Events');
      const tickets = await safeParseJSON(ticketsRes, 'Tickets');
      const settings = await safeParseJSON(settingsRes, 'Settings');

      // Check if we got any data
      if (!organizers && !events && !tickets && !settings) {
        throw new Error('Failed to fetch any data from server. Please check server logs.');
      }

      // Create backup with available data
      downloadBackup({
        organizers: organizers?.organizers || [],
        events: events?.events || [],
        tickets: tickets?.tickets || [],
        settings: settings || { commission_percentage: 5 },
      });

      setLastBackup(new Date());
      toast.success('✅ Backup downloaded successfully!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create backup');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    try {
      // Parse backup file
      const backup = await parseBackupFile(file);
      
      console.log('📦 Restoring backup from:', backup.timestamp);
      console.log('📊 Data counts:', {
        organizers: backup.data.organizers.length,
        events: backup.data.events.length,
        tickets: backup.data.tickets.length,
      });

      // Send restore request to server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/restore-backup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify(backup.data),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Restore failed:', response.status, errorText);
        
        let errorMessage = 'Restore failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText.substring(0, 100) || errorMessage;
        }
        throw new Error(errorMessage);
      }

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
      toast.success(`✅ Backup restored! ${result.restored_count} records imported.`);
      
      // Reload page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(error.message || 'Failed to restore backup');
    } finally {
      setRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Backup & Restore</h2>
        <p className="text-muted-foreground">Manage your database backups and restore data</p>
      </div>

      {/* Warning Alert */}
      <Alert className="border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Restoring a backup will overwrite all existing data. Make sure to create a backup before restoring!
        </AlertDescription>
      </Alert>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Create Backup</CardTitle>
              <CardDescription>
                Download a complete backup of all your data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup Includes:
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>All organizers and their bank details</li>
              <li>All events with ticket types and settings</li>
              <li>All tickets and purchase records</li>
              <li>Platform settings and configuration</li>
            </ul>
          </div>

          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Last backup: {lastBackup.toLocaleString()}
            </div>
          )}

          <Button 
            onClick={handleBackup} 
            disabled={backingUp}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {backingUp ? 'Creating Backup...' : 'Download Complete Backup'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Backup file will be saved as JSON with timestamp
          </p>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Restore from Backup</CardTitle>
              <CardDescription>
                Upload and restore a previous backup file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This will replace ALL existing data with the backup data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={restoring}
              className="hidden"
              id="restore-file"
            />
            <label htmlFor="restore-file" className="cursor-pointer">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <FileJson className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {restoring ? 'Restoring backup...' : 'Click to upload backup file'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    JSON files only
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={restoring}>
                  <Upload className="w-4 h-4 mr-2" />
                  {restoring ? 'Restoring...' : 'Select Backup File'}
                </Button>
              </div>
            </label>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4" />
              Restore Process:
            </h4>
            <ol className="text-sm space-y-1 ml-6 list-decimal">
              <li>Select a valid GoPass backup JSON file</li>
              <li>System validates the backup structure</li>
              <li>All current data is replaced with backup data</li>
              <li>Page reloads to show restored data</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Backup Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Regular backups:</strong> Download backups daily or after major changes</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Safe storage:</strong> Keep backup files in a secure location</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Before updates:</strong> Always backup before making major changes</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Test restores:</strong> Periodically test backup restoration in a safe environment</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}