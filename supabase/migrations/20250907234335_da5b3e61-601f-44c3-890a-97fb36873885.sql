-- Create a comprehensive authorization system for the law firm platform

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'lawyer', 'staff', 'client');

-- Create profiles table to store user information and roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'staff',
  firm_id UUID, -- For multi-firm support in the future
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add user assignment to processes table
ALTER TABLE public.processes ADD COLUMN assigned_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.processes ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user can access process
CREATE OR REPLACE FUNCTION public.can_access_process(process_uuid UUID)
RETURNS BOOLEAN AS $$
  DECLARE
    user_role user_role;
    is_assigned BOOLEAN;
    is_creator BOOLEAN;
  BEGIN
    -- Get current user role
    SELECT public.get_current_user_role() INTO user_role;
    
    -- Admins can access everything
    IF user_role = 'admin' THEN
      RETURN TRUE;
    END IF;
    
    -- Check if user is assigned to or created the process
    SELECT 
      (assigned_user_id = auth.uid()),
      (created_by = auth.uid())
    INTO is_assigned, is_creator
    FROM public.processes 
    WHERE id = process_uuid;
    
    -- Lawyers and staff can access their assigned processes or ones they created
    IF user_role IN ('lawyer', 'staff') AND (is_assigned OR is_creator) THEN
      RETURN TRUE;
    END IF;
    
    -- Clients can only access processes where they are the client (by email match)
    IF user_role = 'client' THEN
      RETURN EXISTS (
        SELECT 1 FROM public.processes p
        JOIN public.profiles prof ON prof.id = auth.uid()
        WHERE p.id = process_uuid AND p.client_email = prof.email
      );
    END IF;
    
    RETURN FALSE;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update RLS policies for processes table
DROP POLICY IF EXISTS "Authenticated users can view all processes" ON public.processes;
DROP POLICY IF EXISTS "Authenticated users can create processes" ON public.processes;
DROP POLICY IF EXISTS "Authenticated users can update processes" ON public.processes;

CREATE POLICY "Users can view authorized processes" 
ON public.processes 
FOR SELECT 
TO authenticated
USING (public.can_access_process(id));

CREATE POLICY "Authorized users can create processes" 
ON public.processes 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'lawyer', 'staff')
);

CREATE POLICY "Users can update authorized processes" 
ON public.processes 
FOR UPDATE 
TO authenticated
USING (public.can_access_process(id))
WITH CHECK (public.can_access_process(id));

-- Update RLS policies for documents table
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can create documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;

CREATE POLICY "Users can view documents from authorized processes" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (public.can_access_process(process_id));

CREATE POLICY "Users can create documents for authorized processes" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (public.can_access_process(process_id));

CREATE POLICY "Users can update documents from authorized processes" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (public.can_access_process(process_id))
WITH CHECK (public.can_access_process(process_id));

-- Update RLS policies for document_reports table
DROP POLICY IF EXISTS "Authenticated users can view document reports" ON public.document_reports;
DROP POLICY IF EXISTS "Authenticated users can create document reports" ON public.document_reports;

CREATE POLICY "Users can view reports for authorized processes" 
ON public.document_reports 
FOR SELECT 
TO authenticated
USING (public.can_access_process(process_id));

CREATE POLICY "Users can create reports for authorized processes" 
ON public.document_reports 
FOR INSERT 
TO authenticated
WITH CHECK (public.can_access_process(process_id));

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'  -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();