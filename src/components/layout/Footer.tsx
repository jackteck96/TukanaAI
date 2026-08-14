import { Link } from "react-router-dom";
import { FileText, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Fuzen</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks.title')}</h3>
            <div className="space-y-2">
              {/* TODO: /recursos has no page yet (dead route, 404s). Build it or repoint this link. */}
              <Link to="/recursos" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.quickLinks.resources')}
              </Link>
              <a href="/#planos" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.quickLinks.pricing')}
              </a>
              {/* TODO: /sobre has no page yet (dead route, 404s). Build it or repoint this link. */}
              <Link to="/sobre" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.quickLinks.about')}
              </Link>
              <ContactFormDialog
                trigger={
                  <button className="block text-muted-foreground hover:text-primary transition-colors text-sm text-left">
                    {t('footer.quickLinks.contact')}
                  </button>
                }
              />
            </div>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.support.title')}</h3>
            {/* TODO: none of /ajuda, /tutoriais, /faq, /status have pages yet (dead routes, 404 today). Build them or repoint these links. */}
            <div className="space-y-2">
              <Link to="/ajuda" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.support.helpCenter')}
              </Link>
              <Link to="/tutoriais" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.support.tutorials')}
              </Link>
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.support.faq')}
              </Link>
              <Link to="/status" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.support.status')}
              </Link>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.contact.title')}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contato@fuzen.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+55 (11) 9999-9999</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{t('footer.contact.location')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/politica-privacidade" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.privacyPolicy')}
              </Link>
              <Link to="/termos-de-uso" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.termsOfService')}
              </Link>
              <Link to="/meus-dados-pessoais" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                {t('footer.myData')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;