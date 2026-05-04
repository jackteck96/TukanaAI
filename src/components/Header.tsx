import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Fuzen Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">Fuzen</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Início
            </Link>
            <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
              Como Funciona
            </a>
            <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#para-quem" className="text-muted-foreground hover:text-primary transition-colors">
              Para Quem
            </a>
            <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">
              Planos
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline">Login</Button>
                </Link>
                <a href="#planos">
                  <Button variant="hero">Assine já</Button>
                </a>
              </>
            )}
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
              <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                Como Funciona
              </a>
              <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">
                Benefícios
              </a>
              <a href="#para-quem" className="text-muted-foreground hover:text-primary transition-colors">
                Para Quem
              </a>
              <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">
                Planos
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <a href="#planos">
                      <Button variant="hero" className="w-full">Assine já</Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;