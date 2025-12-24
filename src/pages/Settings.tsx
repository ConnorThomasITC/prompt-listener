import { useState } from 'react';
import { useCallStore } from '@/store/callStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Clock,
  Users,
  RefreshCw,
  Database,
} from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const systemStatus = useCallStore((state) => state.systemStatus);
  const setSystemStatus = useCallStore((state) => state.setSystemStatus);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Test by fetching from the database
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/calls?limit=1`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      
      if (response.ok) {
        toast({
          title: 'Connection Test',
          description: 'Backend connection successful.',
        });
        setSystemStatus({
          backendConnected: true,
          lastEventTimestamp: new Date(),
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to backend.',
        variant: 'destructive',
      });
      setSystemStatus({ backendConnected: false });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your Call Transcription Console
          </p>
        </div>
      </div>

      {/* Backend Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backend Connection
          </CardTitle>
          <CardDescription>
            Connected to Lovable Cloud for data persistence and real-time updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Your app is connected to Lovable Cloud which provides:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Real-time database for calls and transcripts</li>
              <li>• Backend functions for ticket updates</li>
              <li>• Automatic real-time sync across clients</li>
            </ul>
          </div>

          <Button onClick={handleTestConnection} disabled={testing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current status of your system connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Status */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                {systemStatus.backendConnected ? (
                  <Wifi className="h-5 w-5 text-success" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">Backend</span>
              </div>
              <p
                className={`text-sm ${
                  systemStatus.backendConnected ? 'text-success' : 'text-destructive'
                }`}
              >
                {systemStatus.backendConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            {/* Last Event */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Last Event</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {systemStatus.lastEventTimestamp
                  ? format(systemStatus.lastEventTimestamp, 'HH:mm:ss')
                  : 'No events yet'}
              </p>
            </div>

            {/* Active Connections */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Connections</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {systemStatus.activeConnections} active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Call Transcription Console</strong> v1.0.0
          </p>
          <p>
            A real-time call monitoring and transcription solution for MSP helpdesks.
            Integrates with 3CX phone systems and ConnectWise Manage PSA.
          </p>
          <p className="pt-2 text-xs">
            Powered by ElevenLabs Speech-to-Text technology.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
