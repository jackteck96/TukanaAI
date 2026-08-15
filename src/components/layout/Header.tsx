import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { LOGO_URL as logo } from "@/lib/assets";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Tukana Ai Logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              {t('header.nav.home')}
            </Link>
            <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
              {t('header.nav.howItWorks')}
            </a>
            <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">
              {t('header.nav.benefits')}
            </a>
            <a href="#para-quem" className="text-muted-foreground hover:text-primary transition-colors">
              {t('header.nav.forWho')}
            </a>
            <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">
              {t('header.nav.plans')}
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('header.logout')}
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline">{t('header.login')}</Button>
                </Link>
                <a href="#planos">
                  <Button variant="hero">{t('header.subscribe')}</Button>
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
                {t('header.nav.home')}
              </Link>
              <a href="#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                {t('header.nav.howItWorks')}
              </a>
              <a href="#beneficios" className="text-muted-foreground hover:text-primary transition-colors">
                {t('header.nav.benefits')}
              </a>
              <a href="#para-quem" className="text-muted-foreground hover:text-primary transition-colors">
                {t('header.nav.forWho')}
              </a>
              <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">
                {t('header.nav.plans')}
              </a>
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('header.logout')}
                  </Button>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">{t('header.login')}</Button>
                    </Link>
                    <a href="#planos">
                      <Button variant="hero" className="w-full">{t('header.subscribe')}</Button>
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