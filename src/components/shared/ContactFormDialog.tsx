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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { useTranslation, TFunction } from "react-i18next";

// A function, not a module-level constant, because the validation messages need t()
// which is only available inside the component (via the useTranslation hook).
const getContactSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().min(2, t('contactForm.validation.fullNameMin')).max(100, t('contactForm.validation.fullNameMax')),
    email: z.string().email(t('contactForm.validation.emailInvalid')).max(255, t('contactForm.validation.emailMax')),
    phone: z.string().max(20, t('contactForm.validation.phoneMax')).optional().or(z.literal("")),
    company: z.string().max(100, t('contactForm.validation.companyMax')).optional(),
    message: z.string().min(10, t('contactForm.validation.messageMin')).max(500, t('contactForm.validation.messageMax')),
  });

type ContactFormData = z.infer<ReturnType<typeof getContactSchema>>;

interface ContactFormDialogProps {
  trigger?: React.ReactNode;
}

export function ContactFormDialog({ trigger }: ContactFormDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(getContactSchema(t)),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || "",
          company: data.company || "",
          message: data.message,
        },
      });

      if (error) throw error;

      toast.success(t('contactForm.toastSuccess'));
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error(t('contactForm.toastError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="lg"
            variant="outline"
            className="group text-lg px-10 py-6 rounded-2xl border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
          >
            <MessageSquare className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            {t('contactForm.triggerButton')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t('contactForm.dialogTitle')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('contactForm.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('contactForm.fullNameLabel')}</Label>
            <Input
              id="fullName"
              placeholder={t('contactForm.fullNamePlaceholder')}
              {...register("fullName")}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('contactForm.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('contactForm.emailPlaceholder')}
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('contactForm.phoneLabel')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('contactForm.phonePlaceholder')}
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">{t('contactForm.companyLabel')}</Label>
            <Input
              id="company"
              placeholder={t('contactForm.companyPlaceholder')}
              {...register("company")}
              className={errors.company ? "border-destructive" : ""}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('contactForm.messageLabel')}</Label>
            <Textarea
              id="message"
              placeholder={t('contactForm.messagePlaceholder')}
              rows={4}
              {...register("message")}
              className={errors.message ? "border-destructive" : ""}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:shadow-elegant transition-all duration-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('contactForm.sendingButton')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('contactForm.sendButton')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
