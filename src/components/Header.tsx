import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Fuzen</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Início
            </Link>
            <a href="#recursos" className="text-muted-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-muted-foreground hover:text-primary transition-colors">
              Preços
            </a>
            <Link to="/documentos" className="text-muted-foreground hover:text-primary transition-colors">
              Documentos
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <a href="#precos">
              <Button variant="hero">Começar Agora</Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Início
              </Link>
              <a href="#recursos" className="text-muted-foreground hover:text-primary transition-colors">
                Recursos
              </a>
              <a href="#precos" className="text-muted-foreground hover:text-primary transition-colors">
                Preços
              </a>
              <Link to="/documentos" className="text-muted-foreground hover:text-primary transition-colors">
                Documentos
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <a href="#precos">
                  <Button variant="hero" className="w-full">Começar Agora</Button>
                </a>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;