import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const reportSchema = z.object({
  category: z.string().min(1, "Selecione uma categoria"),
  subject: z.string().min(5, "Assunto deve ter pelo menos 5 caracteres").max(100, "Assunto muito longo"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres").max(2000, "Descrição muito longa"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportProblemDialogProps {
  trigger?: React.ReactNode;
  userType: "empresa" | "cliente";
}

const categories = [
  { value: "bug", label: "Bug / Erro no sistema" },
  { value: "usability", label: "Dificuldade de uso" },
  { value: "feature", label: "Sugestão de melhoria" },
  { value: "document", label: "Problema com documento" },
  { value: "signature", label: "Problema com assinatura" },
  { value: "notification", label: "Problema com notificação" },
  { value: "other", label: "Outro" },
];

export function ReportProblemDialog({ trigger, userType }: ReportProblemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-problem-report", {
        body: {
          userEmail: user?.email || "Não identificado",
          userId: user?.id || "Não identificado",
          userType,
          category: data.category,
          subject: data.subject,
          description: data.description,
        },
      });

      if (error) throw error;

      toast.success("Problema relatado com sucesso! Obrigado pelo feedback.");
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao enviar relatório:", error);
      toast.error("Erro ao enviar relatório. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <AlertTriangle className="h-4 w-4" />
            Relatar Problema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Relatar Problema
          </DialogTitle>
          <DialogDescription className="text-base">
            Descreva o problema encontrado e nossa equipe irá analisar o mais breve possível.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione a categoria do problema" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Resumo do problema"
              {...register("subject")}
              className={errors.subject ? "border-destructive" : ""}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição detalhada *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes: o que aconteceu, o que você esperava que acontecesse, passos para reproduzir..."
              rows={5}
              {...register("description")}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Informações incluídas automaticamente:</strong>
            <br />• E-mail: {user?.email || "Não identificado"}
            <br />• Tipo de usuário: {userType === "empresa" ? "Empresa" : "Cliente"}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Relatório
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
