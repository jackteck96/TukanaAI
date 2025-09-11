-- Create process_notes table for communication within processes
CREATE TABLE public.process_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.process_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for process notes
CREATE POLICY "Users can view notes from authorized processes" 
ON public.process_notes 
FOR SELECT 
USING (can_access_process(process_id) AND (company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "Users can create notes for authorized processes" 
ON public.process_notes 
FOR INSERT 
WITH CHECK (can_access_process(process_id) AND (company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

CREATE POLICY "Users can update their own notes from authorized processes" 
ON public.process_notes 
FOR UPDATE 
USING (user_id = auth.uid() AND can_access_process(process_id) AND (company_id IN ( SELECT profiles.company_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_process_notes_updated_at
BEFORE UPDATE ON public.process_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();