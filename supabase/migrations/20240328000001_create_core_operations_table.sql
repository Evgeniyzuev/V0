--1. Create core_operations table
CREATE TABLE IF NOT EXISTS public.core_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('interest', 'transfer', 'reinvest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS core_operations_user_id_idx ON public.core_operations(user_id);
CREATE INDEX IF NOT EXISTS core_operations_created_at_idx ON public.core_operations(created_at DESC);

-- Add RLS policies
ALTER TABLE public.core_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own operations"
  ON public.core_operations FOR SELECT
  USING (auth.uid() = user_id);

-- Function to log core operations
CREATE OR REPLACE FUNCTION public.log_core_operation(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_operation_id UUID;
BEGIN
  INSERT INTO public.core_operations (user_id, amount, type)
  VALUES (p_user_id, p_amount, p_type)
  RETURNING id INTO v_operation_id;
  
  RETURN v_operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 