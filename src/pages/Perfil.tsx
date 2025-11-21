import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, FileText, X, Loader2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Perfil() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    checkUserAndRole();
  }, []);

  const checkUserAndRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setUser(session.user);

    // Check if user is owner
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    // Se não houver erro e for owner, redirecionar para admin
    if (!rolesError && roles?.some(r => r.role === "owner")) {
      setIsOwner(true);
      navigate("/admin");
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    // Inicializar formulário de edição
    if (profileData) {
      setEditForm({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        email: session.user.email || ""
      });
    }

    // Load appointments
    loadAppointments(session.user.id);
  };

  const loadAppointments = async (userId: string) => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services (name, price, duration_minutes)
      `)
      .eq("client_id", userId)
      .order("appointment_date", { ascending: false });

    if (!error) {
      setAppointments(data || []);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const labels: Record<string, string> = {
      pending: t('profile.pending'),
      confirmed: t('profile.confirmed'),
      cancelled: t('profile.cancelled'),
      completed: t('profile.completed'),
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleCancel = async (appointmentId: string) => {
    if (!cancellationReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o motivo do cancelamento.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason: cancellationReason,
          cancelled_by: "client",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "✅ Consulta Cancelada",
        description: "Sua consulta foi cancelada com sucesso. Você pode reagendar quando desejar.",
      });

      // Recarregar appointments
      if (user) {
        loadAppointments(user.id);
      }
      
      setCancellationReason("");
      setSelectedApt(null);
    } catch (error: any) {
      console.error("Erro ao cancelar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao cancelar consulta: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canCancelAppointment = (apt: any) => {
    if (apt.status !== "confirmed" && apt.status !== "pending") return false;
    
    // Verificar se é pelo menos 4 horas antes
    const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment >= 4;
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Se o email mudou, atualizar email do auth
      if (editForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email
        });

        if (emailError) {
          // Se houve erro ao atualizar email, reverter mudanças do perfil
          throw new Error("Erro ao atualizar email: " + emailError.message);
        }

        toast({
          title: "✅ Perfil Atualizado",
          description: "Um email de confirmação foi enviado para o novo endereço. Verifique sua caixa de entrada.",
        });
      } else {
        toast({
          title: "✅ Perfil Atualizado",
          description: "Suas informações foram atualizadas com sucesso!",
        });
      }

      // Recarregar dados
      checkUserAndRole();
      setIsEditingProfile(false);

    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar perfil: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('profile.title')}</h1>
            <p className="text-muted-foreground">
              {t('profile.welcome')}, {profile?.full_name || user?.email}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.email')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Seu email"
                  />
                ) : (
                  <p className="text-muted-foreground">{user?.email}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('profile.name')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <Input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile?.full_name || t('profile.notProvided')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('profile.phone')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <Input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Seu telefone"
                  />
                ) : (
                  <p className="text-muted-foreground">{profile?.phone || t('profile.notProvided')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botões de Edição */}
          <div className="flex justify-end gap-2 mb-6">
            {isEditingProfile ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    // Resetar formulário
                    if (profile) {
                      setEditForm({
                        full_name: profile.full_name || "",
                        phone: profile.phone || "",
                        email: user?.email || ""
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>

          <Card className="shadow-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('profile.appointments')}</CardTitle>
                  <CardDescription>{t('profile.appointmentsHistory')}</CardDescription>
                </div>
                <Button onClick={() => navigate("/agendar")}>
                  {t('profile.bookNow')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('profile.noAppointments')}
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {apt.services?.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(apt.appointment_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {apt.appointment_time}
                              </span>
                            </div>
                            {apt.notes && (
                              <p className="text-sm text-muted-foreground flex items-start gap-1">
                                <FileText className="w-4 h-4 mt-0.5" />
                                {apt.notes}
                              </p>
                            )}
                            
                            {apt.cancellation_reason && (
                              <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                                <strong>Motivo do cancelamento:</strong> {apt.cancellation_reason}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            {getStatusBadge(apt.status)}
                            <p className="text-lg font-bold text-primary">
                              € {apt.services?.price}
                            </p>
                            
                            {canCancelAppointment(apt) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setSelectedApt(apt)}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Cancelar Consulta</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja cancelar esta consulta? Por favor, informe o motivo.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="client-reason">Motivo do Cancelamento</Label>
                                      <Textarea
                                        id="client-reason"
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Ex: Compromisso surgiu, problemas de saúde, reagendar para outra data..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                                      <p className="text-sm text-amber-800">
                                        ⚠️ Cancelamentos devem ser feitos com pelo menos 4 horas de antecedência.
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => handleCancel(apt.id)}
                                      variant="destructive"
                                      className="w-full"
                                      disabled={isLoading || !cancellationReason.trim()}
                                    >
                                      {isLoading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Cancelando...
                                        </>
                                      ) : (
                                        "Confirmar Cancelamento"
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            {!canCancelAppointment(apt) && (apt.status === "confirmed" || apt.status === "pending") && (
                              <p className="text-xs text-muted-foreground">
                                Cancelamento não disponível<br/>
                                (menos de 4h de antecedência)
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
