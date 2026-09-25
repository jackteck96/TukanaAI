import { supabase } from "@/integrations/supabase/client";

export interface Content {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  category: string;
  cover_image_url: string | null;
  author: string | null;
  reading_minutes: number | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Table added after types generation; keep access untyped here only.
export const contentsTable = () => (supabase as any).from("contents");

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

export const estimateReading = (body: string) =>
  Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200));

export const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "";

export const CONTENT_CATEGORIES = ["M&A", "Jurídico", "Tecnologia", "Financeiro", "Operações", "Notícias"];
