-- Fix RLS policies to require authentication for all sensitive tables

-- Drop existing overly permissive policies for processes table
DROP POLICY IF EXISTS "Anyone can view processes" ON public.processes;
DROP POLICY IF EXISTS "Anyone can create processes" ON public.processes;
DROP POLICY IF EXISTS "Anyone can update processes" ON public.processes;

-- Create secure policies for processes table that require authentication
CREATE POLICY "Authenticated users can view all processes" 
ON public.processes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create processes" 
ON public.processes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update processes" 
ON public.processes 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop existing overly permissive policies for documents table
DROP POLICY IF EXISTS "Anyone can view documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can create documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.documents;

-- Create secure policies for documents table that require authentication
CREATE POLICY "Authenticated users can view all documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create documents" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop existing overly permissive policies for document_reports table
DROP POLICY IF EXISTS "Anyone can view document reports" ON public.document_reports;
DROP POLICY IF EXISTS "Anyone can create document reports" ON public.document_reports;

-- Create secure policies for document_reports table that require authentication
CREATE POLICY "Authenticated users can view document reports" 
ON public.document_reports 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create document reports" 
ON public.document_reports 
FOR INSERT 
TO authenticated
WITH CHECK (true);