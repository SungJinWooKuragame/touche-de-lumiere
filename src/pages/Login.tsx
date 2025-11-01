import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Eye, EyeOff, CheckCircle, XCircle, Phone } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

// Validação para telefone internacional
const phoneSchema = z.string()
  .min(1, { message: "Telefone é obrigatório" })
  .regex(/^\+[1-9]\d{1,14}$/, { 
    message: "Formato inválido. Use: +[código país] [número] (ex: +33 6 80 53 73 29)" 
  });

const emailSchema = z.string().email({ message: "Email inválido" });
const passwordSchema = z.string()
  .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: "Senha deve conter ao menos: 1 maiúscula, 1 minúscula e 1 número" 
  });

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  
  // Estados para recuperação de senha
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Estados de validação
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  // Validação em tempo real do telefone
  const validatePhone = (phone: string) => {
    try {
      phoneSchema.parse(phone);
      setPhoneValid(true);
      return true;
    } catch {
      setPhoneValid(phone.length > 0 ? false : null);
      return false;
    }
  };

  // Validação em tempo real do email
  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setEmailValid(true);
      return true;
    } catch {
      setEmailValid(email.length > 0 ? false : null);
      return false;
    }
  };

  // Validação em tempo real da senha
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

  // Formatação do telefone
  const formatPhoneInput = (value: string) => {
    // Remove tudo exceto números e +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Garante que comece com +
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setSignupPhone(formatted);
    validatePhone(formatted);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setSignupEmail(email);
    validateEmail(email);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setSignupPassword(password);
    validatePassword(password);
  };

  // Função para recuperação de senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Email é obrigatório",
      });
      return;
    }

    setIsResetting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Se o reset foi bem-sucedido, enviar email personalizado
    if (!error) {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('custom-auth-email', {
          body: {
            email: resetEmail,
            type: 'reset_password',
            confirmationUrl: `${window.location.origin}/reset-password`,
            language: i18n.language,
          },
        });

        if (!fnError) {
          console.log('📧 Email de reset personalizado enviado com sucesso');
        } else {
          console.warn('⚠️ Falha ao enviar email de reset personalizado, será usado o padrão', fnError);
        }
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de reset personalizado:', emailError);
      }
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
      setForgotPasswordMode(false);
      setResetEmail("");
    }
    
    setIsResetting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
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

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos"
          : error.message,
      });
    } else {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta",
      });
      navigate("/");
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const validations = [
      { schema: emailSchema, value: signupEmail, field: "email" },
      { schema: passwordSchema, value: signupPassword, field: "password" },
      { schema: phoneSchema, value: signupPhone, field: "phone" },
      { schema: z.string().min(1), value: signupName, field: "name" }
    ];

    for (const validation of validations) {
      try {
        validation.schema.parse(validation.value);
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
    }

    // Verificar se as senhas coincidem
    if (signupPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "As senhas não coincidem",
      });
      return;
    }

    setIsLoading(true);
    
    // Verificar se o telefone já está cadastrado
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', signupPhone)
      .single();

    if (existingPhone) {
      toast({
        variant: "destructive",
        title: "Telefone já cadastrado",
        description: "Este número já está sendo usado por outra conta",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signupName,
          phone: signupPhone,
          language: i18n.language, // Capturar idioma atual
        },
      },
    });

    // Se o signup foi bem-sucedido, enviar email personalizado
    if (!error) {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('custom-auth-email', {
          body: {
            email: signupEmail,
            type: 'signup',
            confirmationUrl: `${window.location.origin}/auth/confirm`, // Será substituído pelo Supabase
            language: i18n.language,
            userName: signupName
          },
        });

        if (!fnError) {
          console.log('📧 Email personalizado enviado com sucesso');
        } else {
          console.warn('⚠️ Falha ao enviar email personalizado, será usado o padrão', fnError);
        }
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email personalizado:', emailError);
      }
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message === "User already registered" 
          ? "Este email já está cadastrado"
          : error.message,
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login",
      });
      navigate("/");
    }
    setIsLoading(false);
  };

  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  if (forgotPasswordMode) {
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
            <CardTitle className="text-3xl">Esqueci minha senha</CardTitle>
            <CardDescription>Digite seu email para receber um link de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isResetting}>
                {isResetting ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setForgotPasswordMode(false)}
              >
                Voltar ao login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-3xl">Touche de Lumière</CardTitle>
          <CardDescription>Acesse sua conta ou crie uma nova</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-sm" 
                  onClick={() => setForgotPasswordMode(true)}
                >
                  Esqueci minha senha
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={handleEmailChange}
                      required
                    />
                    {emailValid !== null && (
                      <div className="absolute right-2 top-2">
                        {emailValid ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-red-500" />
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2 h-5 w-5 text-gray-400" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+33 6 80 53 73 29"
                      value={signupPhone}
                      onChange={handlePhoneChange}
                      className="pl-10"
                      required
                    />
                    {phoneValid !== null && (
                      <div className="absolute right-2 top-2">
                        {phoneValid ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <XCircle className="h-5 w-5 text-red-500" />
                        }
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">Inclua o código do país com + (ex: +33 para França)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
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
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
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
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}