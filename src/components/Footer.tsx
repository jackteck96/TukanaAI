import { Link } from "react-router-dom";
import { FileText, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
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
              <span className="text-xl font-bold text-foreground">DocFlow</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Plataforma completa para gestão de documentos empresariais com segurança e eficiência.
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Links Rápidos</h3>
            <div className="space-y-2">
              <Link to="/recursos" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Recursos
              </Link>
              <Link to="/precos" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Preços
              </Link>
              <Link to="/sobre" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Sobre
              </Link>
              <Link to="/contato" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Contato
              </Link>
            </div>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
            <div className="space-y-2">
              <Link to="/ajuda" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Central de Ajuda
              </Link>
              <Link to="/tutoriais" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Tutoriais
              </Link>
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                FAQ
              </Link>
              <Link to="/status" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Status do Sistema
              </Link>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contato@docflow.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+55 (11) 9999-9999</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>São Paulo, SP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 DocFlow. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;