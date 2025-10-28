import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: "Senha deve conter ao menos: 1 maiúscula, 1 minúscula e 1 número" 
  });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se há um token de reset na URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Definir a sessão com os tokens da URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      // Se não há tokens, redirecionar para login
      toast({
        variant: "destructive",
        title: "Link inválido",
        description: "Este link de recuperação é inválido ou expirou",
      });
      navigate("/login");
    }
  }, [searchParams, navigate, toast]);

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      setPasswordValid(true);
      return true;
    } catch {
      setPasswordValid(password.length > 0 ? false : null);
      return false;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senha
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
        return;
      }
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "As senhas não coincidem",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao redefinir senha",
        description: error.message,
      });
    } else {
      toast({
        title: "Senha redefinida com sucesso!",
        description: "Agora você pode fazer login com sua nova senha",
      });
      
      // Aguardar um pouco e redirecionar para login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/beautiful-lotus.svg" 
              alt="Logo" 
              className="w-12 h-12"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Sparkles className="w-12 h-12 text-primary hidden" />
          </div>
          <CardTitle className="text-3xl">Nova Senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {passwordValid !== null && (
                  <div className="absolute right-2 top-2">
                    {passwordValid ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <XCircle className="h-5 w-5 text-red-500" />
                    }
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">Mín. 8 caracteres, 1 maiúscula, 1 minúscula e 1 número</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate("/login")}
            >
              Voltar ao Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}