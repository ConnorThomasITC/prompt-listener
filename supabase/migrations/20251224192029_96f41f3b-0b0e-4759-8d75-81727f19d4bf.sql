-- Create enum for call status
CREATE TYPE public.call_status AS ENUM ('live', 'ended', 'failed');

-- Create enum for call direction
CREATE TYPE public.call_direction AS ENUM ('inbound', 'outbound');

-- Create enum for speaker type
CREATE TYPE public.speaker_type AS ENUM ('caller', 'agent', 'unknown');

-- Create calls table
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status call_status NOT NULL DEFAULT 'live',
  direction call_direction NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  agent_name TEXT,
  queue_or_dn TEXT,
  ticket_id TEXT,
  has_ticket_update BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transcript_segments table
CREATE TABLE public.transcript_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  speaker speaker_type NOT NULL DEFAULT 'unknown',
  text TEXT NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables (open for now since no auth yet)
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (will add auth later)
CREATE POLICY "Allow public read access on calls"
  ON public.calls FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on calls"
  ON public.calls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on calls"
  ON public.calls FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on transcript_segments"
  ON public.transcript_segments FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on transcript_segments"
  ON public.transcript_segments FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_started_at ON public.calls(started_at DESC);
CREATE INDEX idx_transcript_segments_call_id ON public.transcript_segments(call_id);
CREATE INDEX idx_transcript_segments_timestamp ON public.transcript_segments(timestamp);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transcript_segments;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for calls updated_at
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();