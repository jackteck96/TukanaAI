-- Add foreign key from global_document_types to global_document_categories
ALTER TABLE public.global_document_types
ADD CONSTRAINT global_document_types_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.global_document_categories(id)
ON DELETE SET NULL;