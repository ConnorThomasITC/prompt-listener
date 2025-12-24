import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCallStore } from '@/store/callStore';
import { Phone, Settings, Activity, Wifi, WifiOff } from 'lucide-react';

export const Header = () => {
  const location = useLocation();
  const calls = useCallStore((state) => state.calls);
  const systemStatus = useCallStore((state) => state.systemStatus);
  
  const liveCallsCount = useMemo(() => {
    return calls.filter((call) => call.status === 'live').length;
  }, [calls]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Phone },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Call Transcription Console</h1>
              <p className="text-xs text-muted-foreground">MSP Helpdesk</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                              (item.href === '/dashboard' && location.pathname === '/');
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Live Calls Badge */}
            {liveCallsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="live-indicator" />
                <span className="text-sm font-medium text-success">
                  {liveCallsCount} Live
                </span>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {systemStatus.backendConnected ? (
                <div className="flex items-center gap-1.5 text-success text-sm">
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-destructive text-sm">
                  <WifiOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
