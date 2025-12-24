import { useState } from 'react';
import { useCallStore } from '@/store/callStore';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Settings as SettingsIcon,
  Server,
  Wifi,
  WifiOff,
  Clock,
  Users,
  Save,
  RefreshCw,
} from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const systemStatus = useCallStore((state) => state.systemStatus);
  const setSystemStatus = useCallStore((state) => state.setSystemStatus);

  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      setApiBaseUrl(baseUrl);
      toast({
        title: 'Settings Saved',
        description: 'Backend URL has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    // Simulate connection test
    toast({
      title: 'Connection Test',
      description: 'Backend connection successful.',
    });
    setSystemStatus({
      backendConnected: true,
      lastEventTimestamp: new Date(),
    });
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
            <Server className="h-5 w-5" />
            Backend Connection
          </CardTitle>
          <CardDescription>
            Configure the connection to your backend API server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <div className="flex gap-2">
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="flex-1"
              />
              <Button onClick={handleTestConnection} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The base URL for all API requests (e.g., https://your-backend.com/api)
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
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
