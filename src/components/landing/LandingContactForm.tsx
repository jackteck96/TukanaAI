import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const getLandingContactSchema = (t: TFunction) =>
  z.object({
    fullName: z.string().trim().min(2, t("contactForm.validation.fullNameMin")).max(100, t("contactForm.validation.fullNameMax")),
    email: z.string().trim().email(t("contactForm.validation.emailInvalid")).max(255, t("contactForm.validation.emailMax")),
    phone: z
      .string()
      .trim()
      .min(8, t("contactForm.validation.phoneMin"))
      .max(20, t("contactForm.validation.phoneMax"))
      .regex(/^[+()\-.\s\d]+$/, t("contactForm.validation.phoneInvalid")),
    message: z.string().trim().min(10, t("contactForm.validation.messageMin")).max(1000, t("contactForm.validation.messageMax")),
  });

type LandingContactData = z.infer<ReturnType<typeof getLandingContactSchema>>;

const LandingContactForm = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LandingContactData>({
    resolver: zodResolver(getLandingContactSchema(t)),
  });

  const onSubmit = async (data: LandingContactData) => {
    setIsSubmitting(true);
    setSent(false);
    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          company: "",
          message: data.message,
        },
      });

      if (error) throw error;

      setSent(true);
      reset();
      toast.success(t("contactForm.toastSuccess"));
    } catch (error) {
      console.error("Erro ao enviar formulário de contato:", error);
      toast.error(t("contactForm.toastError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-4xl gap-4 text-left md:grid-cols-2" noValidate>
      <div className="space-y-2">
        <Label htmlFor="landing-contact-name">{t("contactForm.fullNameLabel")}</Label>
        <Input
          id="landing-contact-name"
          autoComplete="name"
          placeholder={t("contactForm.fullNamePlaceholder")}
          aria-invalid={Boolean(errors.fullName)}
          className={`h-12 border-border/70 bg-background/80 ${errors.fullName ? "border-destructive" : ""}`}
          {...register("fullName")}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="landing-contact-email">{t("contactForm.emailLabel")}</Label>
        <Input
          id="landing-contact-email"
          type="email"
          autoComplete="email"
          placeholder={t("contactForm.emailPlaceholder")}
          aria-invalid={Boolean(errors.email)}
          className={`h-12 border-border/70 bg-background/80 ${errors.email ? "border-destructive" : ""}`}
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="landing-contact-phone">{t("contactForm.phoneLabel")}</Label>
        <Input
          id="landing-contact-phone"
          type="tel"
          autoComplete="tel"
          placeholder={t("contactForm.phonePlaceholder")}
          aria-invalid={Boolean(errors.phone)}
          className={`h-12 border-border/70 bg-background/80 ${errors.phone ? "border-destructive" : ""}`}
          {...register("phone")}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="landing-contact-message">{t("contactForm.messageLabel")}</Label>
        <Textarea
          id="landing-contact-message"
          rows={5}
          placeholder={t("contactForm.messagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          className={`resize-none border-border/70 bg-background/80 ${errors.message ? "border-destructive" : ""}`}
          {...register("message")}
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <div className="flex flex-col items-center gap-3 md:col-span-2">
        <Button type="submit" size="lg" className="w-full rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90 md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("contactForm.sendingButton")}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t("contactForm.sendButton")}
            </>
          )}
        </Button>
        {sent && <p className="text-sm font-medium text-primary">{t("contactForm.toastSuccess")}</p>}
      </div>
    </form>
  );
};

export default LandingContactForm;
