import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContentBody from "@/components/content/ContentBody";
import { CONTENT_CATEGORIES, Content, contentsTable, estimateReading, formatDate, slugify } from "@/lib/contents";

const schema = z.object({
  title: z.string().trim().min(3, "Título muito curto").max(200),
  slug: z.string().trim().min(3, "URL inválida").max(100).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  summary: z.string().trim().max(500).optional(),
  body: z.string().max(100000),
  category: z.string().min(1).max(60),
  author: z.string().trim().max(120).optional(),
  reading_minutes: z.number().int().min(1).max(300).nullable(),
});

type Draft = {
  id?: string; title: string; slug: string; summary: string; body: string; category: string;
  cover_image_url: string; author: string; reading_minutes: string; status: "draft" | "published"; published_at: string | null;
};

const empty: Draft = {
  title: "", slug: "", summary: "", body: "", category: "M&A", cover_image_url: "",
  author: "", reading_minutes: "", status: "draft", published_at: null,
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

const AdminConteudos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Content[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Content | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    const { data, error } = await contentsTable().select("*").order("updated_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const set = (k: keyof Draft, v: string) =>
    setEditing((d) => {
      if (!d) return d;
      const next = { ...d, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(v);
      return next;
    });

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Envie um arquivo de imagem");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("content-images").upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data, error: e2 } = await supabase.storage.from("content-images").createSignedUrl(path, TEN_YEARS);
    if (e2 || !data) throw e2 ?? new Error("Falha ao gerar link");
    return data.signedUrl;
  };

  const onCover = async (file?: File) => {
    if (!file) return;
    try { set("cover_image_url", await uploadImage(file)); }
    catch (e: any) { toast({ title: "Erro no upload", description: e.message, variant: "destructive" }); }
  };

  const onInlineImage = async (file?: File) => {
    if (!file) return;
    try { insert(`\n\n![Descrição da imagem](${await uploadImage(file)})\n\n`); }
    catch (e: any) { toast({ title: "Erro no upload", description: e.message, variant: "destructive" }); }
  };

  const insert = (before: string, after = "") => {
    const ta = bodyRef.current;
    if (!ta || !editing) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = editing.body.slice(s, e);
    set("body", editing.body.slice(0, s) + before + sel + after + editing.body.slice(e));
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length; });
  };

  const save = async (status: "draft" | "published") => {
    if (!editing) return;
    const parsed = schema.safeParse({
      ...editing,
      summary: editing.summary || undefined,
      author: editing.author || undefined,
      reading_minutes: editing.reading_minutes ? Number(editing.reading_minutes) : null,
    });
    if (!parsed.success) {
      toast({ title: "Verifique os campos", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSaving(true);
    const row = {
      ...parsed.data,
      summary: parsed.data.summary ?? null,
      author: parsed.data.author ?? null,
      reading_minutes: parsed.data.reading_minutes ?? estimateReading(parsed.data.body),
      cover_image_url: editing.cover_image_url || null,
      status,
      published_at: status === "published" ? editing.published_at ?? new Date().toISOString() : editing.published_at,
    };
    const { error } = editing.id
      ? await contentsTable().update(row).eq("id", editing.id)
      : await contentsTable().insert({ ...row, created_by: user?.id });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.code === "23505" ? "Já existe um conteúdo com essa URL." : error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "published" ? "Conteúdo publicado" : "Rascunho salvo" });
    setEditing(null);
    load();
  };

  const toggle = async (c: Content) => {
    const status = c.status === "published" ? "draft" : "published";
    const { error } = await contentsTable()
      .update({ status, published_at: c.published_at ?? (status === "published" ? new Date().toISOString() : null) })
      .eq("id", c.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await contentsTable().delete().eq("id", toDelete.id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else toast({ title: "Conteúdo excluído" });
    setToDelete(null);
    load();
  };

  const startEdit = (c?: Content) => {
    setSlugTouched(!!c);
    setEditing(c ? {
      id: c.id, title: c.title, slug: c.slug, summary: c.summary ?? "", body: c.body, category: c.category,
      cover_image_url: c.cover_image_url ?? "", author: c.author ?? "",
      reading_minutes: c.reading_minutes ? String(c.reading_minutes) : "", status: c.status, published_at: c.published_at,
    } : { ...empty });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Painel</Button></Link>
            <h1 className="text-xl font-semibold">Conteúdos da landing</h1>
          </div>
          {!editing && <Button size="sm" onClick={() => startEdit()}><Plus className="h-4 w-4 mr-1" />Novo conteúdo</Button>}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Título</Label><Input value={editing.title} onChange={(e) => set("title", e.target.value)} maxLength={200} /></div>
              <div>
                <Label>URL</Label>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">/conteudos/
                  <Input value={editing.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} maxLength={100} />
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={editing.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Resumo</Label><Textarea rows={2} value={editing.summary} onChange={(e) => set("summary", e.target.value)} maxLength={500} /></div>
              <div><Label>Autor (opcional)</Label><Input value={editing.author} onChange={(e) => set("author", e.target.value)} maxLength={120} /></div>
              <div><Label>Tempo de leitura em min (vazio = automático)</Label><Input type="number" min={1} value={editing.reading_minutes} onChange={(e) => set("reading_minutes", e.target.value)} /></div>
              <div className="md:col-span-2">
                <Label>Imagem de capa</Label>
                <div className="flex items-center gap-3 mt-1">
                  {editing.cover_image_url && <img src={editing.cover_image_url} alt="" className="h-16 w-28 object-cover rounded" />}
                  <Input type="file" accept="image/*" onChange={(e) => onCover(e.target.files?.[0])} className="max-w-xs" />
                  {editing.cover_image_url && <Button variant="ghost" size="sm" onClick={() => set("cover_image_url", "")}>Remover</Button>}
                </div>
              </div>
            </div>

            <Tabs defaultValue="edit">
              <TabsList><TabsTrigger value="edit">Escrever</TabsTrigger><TabsTrigger value="preview">Pré-visualizar</TabsTrigger></TabsList>
              <TabsContent value="edit" className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n## ", "")}>Título</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n### ", "")}>Subtítulo</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("**", "**")}><b>N</b></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("*", "*")}><i>I</i></Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n- ")}>Lista</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n1. ")}>Lista numerada</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n> ")}>Citação</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("[", "](https://)")}>Link</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => insert("\n\n[https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=)\n\n")}>Vídeo</Button>
                  <label className="inline-flex">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onInlineImage(e.target.files?.[0])} />
                    <span className="inline-flex items-center h-9 px-3 rounded-md border border-input text-sm cursor-pointer hover:bg-accent"><Upload className="h-3.5 w-3.5 mr-1" />Imagem</span>
                  </label>
                </div>
                <Textarea ref={bodyRef} rows={18} value={editing.body} onChange={(e) => set("body", e.target.value)} className="font-mono text-sm" placeholder="Escreva o conteúdo aqui..." />
                <p className="text-xs text-muted-foreground">Dica: um link do YouTube ou Vimeo sozinho numa linha vira vídeo incorporado.</p>
              </TabsContent>
              <TabsContent value="preview"><div className="dark rounded-lg bg-background text-foreground p-6 border"><ContentBody body={editing.body} /></div></TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Salvar rascunho</Button>
              <Button onClick={() => save("published")} disabled={saving}>Publicar</Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum conteúdo ainda.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "published" ? "default" : "secondary"}>{c.status === "published" ? "Publicado" : "Rascunho"}</Badge>
                    <span className="text-xs text-muted-foreground">{c.category}</span>
                  </div>
                  <p className="font-medium truncate mt-1">{c.title}</p>
                  <p className="text-xs text-muted-foreground">/conteudos/{c.slug} {c.published_at && `· ${formatDate(c.published_at)}`}</p>
                </div>
                {c.status === "published" && (
                  <a href={`/conteudos/${c.slug}`} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></a>
                )}
                <Button variant="outline" size="sm" onClick={() => toggle(c)}>{c.status === "published" ? "Despublicar" : "Publicar"}</Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminConteudos;
