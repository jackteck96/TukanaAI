CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'M&A',
  cover_image_url text,
  author text,
  reading_minutes integer,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contents TO authenticated;
GRANT ALL ON public.contents TO service_role;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published contents" ON public.contents FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Platform admins read all contents" ON public.contents FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins insert contents" ON public.contents FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins update contents" ON public.contents FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins delete contents" ON public.contents FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON public.contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read content images" ON storage.objects FOR SELECT USING (bucket_id = 'content-images');
CREATE POLICY "Platform admins upload content images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content-images' AND public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins update content images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'content-images' AND public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins delete content images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'content-images' AND public.is_platform_admin(auth.uid()));