import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, Calendar, LogOut, User, Settings, Phone, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Verificar se está na página admin
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    const checkUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(roleData?.role || null);
      }
    };

    checkUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkUserAndRole();
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Verificar se é owner no admin
  const isOwnerInAdmin = isAdminPage && userRole === 'owner';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-soft">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Flor de lótus linda personalizada */}
            <img 
              src="/beautiful-lotus.svg" 
              alt="Therapy Flow Logo" 
              className="w-8 h-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 filter hover:brightness-110"
              onError={(e) => {
                // Fallback para ícone SVG se a imagem não carregar
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback SVG logo */}
            <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center hidden">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent max-w-[180px] truncate">
            {t('nav.brand')}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Botões de navegação com ícones e restrições para admin */}
          <div className="relative group">
            <button 
              onClick={() => {
                if (!isOwnerInAdmin) {
                  document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              disabled={isOwnerInAdmin}
              className={`flex items-center gap-2 transition-smooth hidden md:flex ${
                isOwnerInAdmin 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-foreground/80 hover:text-primary cursor-pointer'
              }`}
              title={isOwnerInAdmin ? 'Clique no nome do site para voltar à home' : undefined}
            >
              <Briefcase className="w-4 h-4" />
              {t('nav.services')}
            </button>
            {isOwnerInAdmin && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Clique no nome do site para voltar à home
              </div>
            )}
          </div>

          <div className="relative group">
            <button 
              onClick={() => {
                if (!isOwnerInAdmin) {
                  document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              disabled={isOwnerInAdmin}
              className={`flex items-center gap-2 transition-smooth hidden md:flex ${
                isOwnerInAdmin 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-foreground/80 hover:text-primary cursor-pointer'
              }`}
              title={isOwnerInAdmin ? 'Clique no nome do site para voltar à home' : undefined}
            >
              <Phone className="w-4 h-4" />
              {t('nav.contact')}
            </button>
            {isOwnerInAdmin && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Clique no nome do site para voltar à home
              </div>
            )}
          </div>

          {/* Botão adicional se necessário */}
          {userRole === 'owner' && (
            <div className="relative group">
              <button 
                onClick={() => {
                  if (!isOwnerInAdmin) {
                    navigate('/admin');
                  }
                }}
                disabled={isOwnerInAdmin}
                className={`flex items-center gap-2 transition-smooth hidden md:flex ${
                  isOwnerInAdmin 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-foreground/80 hover:text-primary cursor-pointer'
                }`}
                title={isOwnerInAdmin ? 'Clique no nome do site para voltar à home' : undefined}
              >
                <Settings className="w-4 h-4" />
                Admin
              </button>
              {isOwnerInAdmin && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Clique no nome do site para voltar à home
                </div>
              )}
            </div>
          )}

          <LanguageSelector />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/agendar")} className="hidden sm:flex">
                <Calendar className="w-4 h-4" />
                {t('nav.book')}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/perfil")}>
                <User className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:flex">
                {t('nav.login')}
              </Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/login?tab=signup")}>
                {t('nav.signup')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
