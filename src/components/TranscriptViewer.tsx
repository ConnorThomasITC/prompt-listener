import { useState, useEffect, useRef } from 'react';
import { TranscriptSegment } from '@/types/call';
import { SpeakerBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  isLive?: boolean;
}

export const TranscriptViewer = ({ segments, isLive = false }: TranscriptViewerProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom for live calls
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, isLive]);

  const getFullTranscript = () => {
    return segments
      .filter((s) => s.isFinal)
      .map((s) => `[${s.speaker.toUpperCase()}] ${s.text}`)
      .join('\n\n');
  };

  const handleCopy = async () => {
    const text = getFullTranscript();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Transcript copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getFullTranscript();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'Transcript saved as text file',
    });
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg mb-2">No transcript available</p>
        <p className="text-sm">Transcript segments will appear here as the call progresses.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {segments.filter((s) => s.isFinal).length} segments
          {isLive && (
            <span className="ml-2 text-success animate-pulse-subtle">● Live</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-1.5 text-success" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 scrollbar-thin pr-2"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className={cn(
              'transcript-line animate-fade-in',
              segment.speaker === 'caller' && 'transcript-caller',
              segment.speaker === 'agent' && 'transcript-agent',
              segment.speaker === 'unknown' && 'bg-muted border-l-2 border-muted-foreground',
              !segment.isFinal && 'opacity-70'
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-1">
              <SpeakerBadge speaker={segment.speaker} />
              <span className="text-xs text-muted-foreground">
                {format(segment.timestamp, 'HH:mm:ss')}
              </span>
            </div>
            <p className="text-foreground">
              {segment.text}
              {!segment.isFinal && (
                <span className="typing-indicator inline-flex ml-2">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
