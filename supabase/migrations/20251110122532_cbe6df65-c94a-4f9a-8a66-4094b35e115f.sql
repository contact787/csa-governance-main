-- Create roma_reports table
CREATE TABLE public.roma_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  identified_problem TEXT NOT NULL,
  service_activity TEXT NOT NULL,
  outcome_short_term TEXT NOT NULL,
  outcome_intermediate_term TEXT,
  outcome_long_term TEXT,
  outcome_indicator_short_term TEXT NOT NULL,
  outcome_indicator_intermediate_term TEXT,
  outcome_indicator_long_term TEXT,
  actual_results_short_term TEXT NOT NULL,
  actual_results_intermediate_term TEXT,
  actual_results_long_term TEXT,
  measurement_tool TEXT NOT NULL,
  data_source TEXT NOT NULL,
  frequency_data_collection TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roma_reports ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view all reports (organization-wide access)
CREATE POLICY "All authenticated users can view all reports" 
ON public.roma_reports 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policy: Users can create their own reports
CREATE POLICY "Users can create their own reports" 
ON public.roma_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports" 
ON public.roma_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete their own reports" 
ON public.roma_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_roma_reports_updated_at
BEFORE UPDATE ON public.roma_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();