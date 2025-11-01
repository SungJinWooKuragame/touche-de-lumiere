import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, X, Check, Loader2, Edit, Trash2, Plus, Settings, Save, ExternalLink, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoogleCalendarAPI } from "@/lib/google-calendar-api";
import { useTranslation } from "react-i18next";

// Função para enviar notificações por email
const sendNotificationEmail = async (to: string, type: string, data: any) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
      body: { to, type, data }
    });

    if (error) throw error;
    
    console.log(`📧 Email ${type} enviado para ${to}:`, result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error(`❌ Erro ao enviar email ${type}:`, error);
    return { success: false, error: error.message };
  }
};

// Função para enviar notificações por WhatsApp
const sendWhatsAppNotification = async (to: string, type: string, data: any) => {
  try {
    // Verificar se o telefone tem formato válido
    if (!to || !to.startsWith('+')) {
      console.log('⚠️ Telefone inválido para WhatsApp:', to);
      return { success: false, error: 'Telefone inválido' };
    }

    const { data: result, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to, type, data }
    });

    if (error) throw error;
    
    console.log(`📱 WhatsApp ${type} enviado para ${to}:`, result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error(`❌ Erro ao enviar WhatsApp ${type}:`, error);
    return { success: false, error: error.message };
  }
};

// Função para enviar todas as notificações
const sendAllNotifications = async (appointment: any, type: 'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder', cancellationReason?: string) => {
  const notifications = [];
  
  const notificationData = {
    clientName: appointment.profiles?.full_name || 'Cliente',
    serviceName: appointment.services?.name || 'Serviço',
    appointmentDate: appointment.appointment_date,
    appointmentTime: appointment.appointment_time,
    cancellationReason,
    ownerPhone: '+55 (44) 99999-9999', // Substitua pelo seu telefone
    appointmentId: appointment.id
  };

  // Enviar email se disponível
  if (appointment.profiles?.email) {
    notifications.push(
      sendNotificationEmail(appointment.profiles.email, type, notificationData)
        .then(result => ({ channel: 'email', ...result }))
    );
  }

  // Enviar WhatsApp se disponível e válido
  if (appointment.profiles?.phone) {
    notifications.push(
      sendWhatsAppNotification(appointment.profiles.phone, type, notificationData)
        .then(result => ({ channel: 'whatsapp', ...result }))
    );
  }

  const results = await Promise.all(notifications);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`📊 Notificações enviadas: ${successCount}/${totalCount}`, results);
  
  return {
    total: totalCount,
    successful: successCount,
    results
  };
};

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Função para abrir Google Calendar
  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank');
  };

  // Função para limpar todos os agendamentos (APENAS PARA TESTES)
  const clearAllAppointments = async () => {
    const pendingCount = appointments.filter(a => a.status === "pending").length;
    const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
    
    const confirmed = confirm(`⚠️ ATENÇÃO: OPERAÇÃO DESTRUTIVA! ⚠️

Isso vai DELETAR PERMANENTEMENTE todos os agendamentos:
- Pendentes: ${pendingCount}
- Confirmados: ${confirmedCount} 
- Total: ${appointments.length}

Esta ação NÃO PODE ser desfeita!

Tem absoluta certeza que deseja continuar?`);

    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      console.log(`🗑️ Tentando deletar ${appointments.length} agendamentos...`);
      
      // Método direto: deletar todos os IDs um por um
      let deletedCount = 0;
      
      for (const appointment of appointments) {
        try {
          const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", appointment.id);
            
          if (!error) {
            deletedCount++;
            console.log(`✅ Deletado: ${appointment.id}`);
          } else {
            console.error(`❌ Erro ao deletar ${appointment.id}:`, error);
          }
        } catch (err) {
          console.error(`💀 Falha crítica ao deletar ${appointment.id}:`, err);
        }
      }
      
      console.log(`🎯 Resultado: ${deletedCount}/${appointments.length} agendamentos deletados`);

      if (deletedCount > 0) {
        toast({
          title: "🧹 LIMPEZA REALIZADA!",
          description: `${deletedCount} de ${appointments.length} agendamentos foram DELETADOS!`,
          duration: 4000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Falha na Limpeza",
          description: "Nenhum agendamento foi deletado. Verifique as permissões.",
        });
      }

      // Forçar reload da lista
      await loadAppointments();
      
    } catch (error: any) {
      console.error("💀 Erro na limpeza:", error);
      toast({
        variant: "destructive",
        title: "Erro na Limpeza",
        description: `Erro: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para limpar apenas agendamentos antigos (mais de 30 dias)
  const clearOldAppointments = async (daysOld: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate < cutoffDate;
    });

    if (oldAppointments.length === 0) {
      toast({
        title: "🔍 Nenhum Agendamento Antigo",
        description: `Não há agendamentos com mais de ${daysOld} dias para limpar.`,
      });
      return;
    }

    const confirmed = confirm(`🧹 LIMPEZA DE AGENDAMENTOS ANTIGOS

Isso vai deletar ${oldAppointments.length} agendamentos com mais de ${daysOld} dias:
- Data limite: ${cutoffDate.toLocaleDateString('pt-BR')}
- Total a deletar: ${oldAppointments.length} de ${appointments.length}

Esta ação NÃO PODE ser desfeita!

Deseja continuar?`);

    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      console.log(`🗑️ Deletando ${oldAppointments.length} agendamentos antigos...`);
      
      let deletedCount = 0;
      
      for (const appointment of oldAppointments) {
        try {
          const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", appointment.id);
            
          if (!error) {
            deletedCount++;
            console.log(`✅ Deletado agendamento antigo: ${appointment.id} (${appointment.appointment_date})`);
          } else {
            console.error(`❌ Erro ao deletar ${appointment.id}:`, error);
          }
        } catch (err) {
          console.error(`💀 Falha ao deletar ${appointment.id}:`, err);
        }
      }
      
      console.log(`🎯 Resultado: ${deletedCount}/${oldAppointments.length} agendamentos antigos deletados`);

      toast({
        title: "🧹 Limpeza Concluída!",
        description: `${deletedCount} agendamentos antigos foram removidos (${daysOld}+ dias)`,
        duration: 4000,
      });

      // Recarregar lista
      await loadAppointments();
      
    } catch (error: any) {
      console.error("💀 Erro na limpeza de antigos:", error);
      toast({
        variant: "destructive",
        title: "Erro na Limpeza",
        description: `Erro: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [servicePreview, setServicePreview] = useState<any>({});
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  
  // Estados para organização por cliente
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [clientPrices, setClientPrices] = useState<Record<string, number>>({});
  
  const [googleCalendarSettings, setGoogleCalendarSettings] = useState({
    client_id: "",
    client_secret: "",
    connected: false,
    email: ""
  });
  const [googleCredentials, setGoogleCredentials] = useState<any>(null);
  
  // Estados para gestão de horários
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [dateBlocks, setDateBlocks] = useState<any[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<any[]>([]);
  const [isOperatingHoursLoading, setIsOperatingHoursLoading] = useState(false);

  useEffect(() => {
    checkOwnerRole();
    loadGoogleCalendarSettings();
    handleGoogleCallback(); // Verificar se retornou do Google OAuth
    verifyGoogleCredentials(); // Verificar credenciais existentes
    loadOperatingHours(); // Carregar horários de funcionamento
    loadDateBlocks(); // Carregar bloqueios de datas
    
    // Reset retry flags on page load for clean error recovery state
    localStorage.removeItem('google_oauth_retry_count');
    localStorage.removeItem('google_oauth_retry_timestamp');
  }, []);

  // Verificar se as credenciais salvas ainda são válidas
  const verifyGoogleCredentials = () => {
    try {
      const credentials = localStorage.getItem('google_calendar_credentials');
      if (credentials) {
        const creds = JSON.parse(credentials);
        const now = Math.floor(Date.now() / 1000);
        const expiry = creds.expiry_date || creds.expires_at || 0;
        
        if (expiry > 0 && now > expiry) {
          console.log('🧹 Removendo token expirado na inicialização...');
          localStorage.removeItem('google_calendar_credentials');
          localStorage.removeItem('google_calendar_email');
          setGoogleCredentials(null);
          setGoogleCalendarSettings(prev => ({
            ...prev,
            connected: false,
            email: ''
          }));
        } else if (creds.access_token) {
          console.log('✅ Token válido encontrado na inicialização');
          setGoogleCredentials(creds);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar credenciais:', error);
      localStorage.removeItem('google_calendar_credentials');
    }
  };

  const checkOwnerRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles?.some(r => r.role === "owner")) {
      navigate("/perfil");
      return;
    }

    loadAppointments();
    loadServices();
    loadSiteSettings();
  };

  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*");

    if (!error && data) {
      const settingsMap = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      setSiteSettings(settingsMap);
    }
  };

  const loadGoogleCalendarSettings = async () => {
    try {
      // Carregar credenciais do localStorage
      const localCredentials = localStorage.getItem('google_calendar_credentials');
      const connectedEmail = localStorage.getItem('google_calendar_email');
      
      console.log('🔍 Carregando configurações Google Calendar...');
      console.log('📋 Credenciais locais:', localCredentials ? 'Encontradas' : 'Não encontradas');
      console.log('📧 Email conectado:', connectedEmail);
      
      if (localCredentials) {
        const credentials = JSON.parse(localCredentials);
        
        // Verificar se token não expirou
        const now = Math.floor(Date.now() / 1000);
        const expiry = credentials.expiry_date || credentials.expires_at || 0;
        const isExpired = expiry > 0 && now > expiry;
        
        console.log('🔑 Credenciais decodificadas:', {
          has_client_id: !!credentials.client_id,
          has_client_secret: !!credentials.client_secret,
          has_access_token: !!credentials.access_token,
          expires_at: credentials.expires_at ? new Date(credentials.expires_at).toLocaleString() : 'N/A',
          is_expired: isExpired
        });
        
        if (isExpired) {
          console.log('🧹 Token expirado detectado em loadGoogleCalendarSettings, removendo...');
          localStorage.removeItem('google_calendar_credentials');
          localStorage.removeItem('google_calendar_email');
          setGoogleCalendarSettings(prev => ({
            ...prev,
            client_id: credentials.client_id || "",
            client_secret: credentials.client_secret || "",
            connected: false,
            email: ""
          }));
        } else {
          setGoogleCalendarSettings(prev => ({
            ...prev,
            client_id: credentials.client_id || "",
            client_secret: credentials.client_secret || "",
            connected: !!credentials.access_token && !!connectedEmail,
            email: connectedEmail || ""
          }));
        }
      }

      // Verificar se está conectado no Supabase
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "google_calendar_connected")
        .single();

      if (data?.value === "true" && connectedEmail) {
        console.log('✅ Status conectado confirmado no Supabase');
      }
    } catch (error) {
      console.log("⚠️ Configurações do Google Calendar não encontradas:", error);
    }
  };

  const saveGoogleCalendarSettings = async (clientId: string, clientSecret: string) => {
    setIsLoading(true);
    
    try {
      // Salvar no localStorage (permanente no navegador)
      const credentials = { client_id: clientId, client_secret: clientSecret };
      localStorage.setItem('google_calendar_credentials', JSON.stringify(credentials));

      // Salvar no Supabase também
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "google_credentials",
          value: JSON.stringify(credentials)
        });

      if (error) {
        console.log("Aviso: Não foi possível salvar no banco, mas salvo localmente");
      }

      toast({
        title: "✅ Credenciais Salvas!",
        description: "Client ID e Secret salvos permanentemente. Não precisará digitar novamente!",
      });
      
      // Atualizar configurações
      setGoogleCalendarSettings(prev => ({
        ...prev,
        client_id: clientId,
        client_secret: clientSecret
      }));
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
    
    setIsLoading(false);
  };

  const connectGoogleCalendar = async (autoRetry = false) => {
    try {
      setIsLoading(true);
      
      // Verificar se as credenciais foram salvas
      if (!googleCalendarSettings.client_id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Primeiro salve as credenciais do Google Calendar!",
        });
        setIsLoading(false);
        return;
      }
      
      // Se é uma tentativa automática após erro 400, limpar cache primeiro
      if (autoRetry) {
        localStorage.removeItem('google_auth_in_progress');
        localStorage.removeItem('last_redirect_uri_used');
        localStorage.removeItem('last_failed_redirect_uri');
        console.log('🧹 Cache limpo automaticamente para retry');
      }
      
      // Construir URL OAuth com URI simples
      const redirectUri = `${window.location.origin}/admin`;
      const clientId = googleCalendarSettings.client_id;
      
      console.log('🔗 Conectando Google Calendar:', {
        client_id: clientId.substring(0, 20) + '...',
        redirect_uri: redirectUri
      });
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', 'google_calendar_auth');
      
      // Salvar configuração
      localStorage.setItem('last_redirect_uri_used', redirectUri);
      localStorage.setItem('google_auth_in_progress', 'true');
      
      // Redirecionar para autorização do Google
      window.location.href = authUrl.toString();
      
    } catch (error: any) {
      setIsLoading(false);
      console.error('❌ Erro na conexão Google Calendar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao conectar com Google Calendar",
      });
    }
  };

  const handleGoogleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const wasAuthInProgress = localStorage.getItem('google_auth_in_progress');
    
    if (code && state === 'google_calendar_auth' && wasAuthInProgress) {
      try {
        setIsLoading(true);
        
        // Limpar flag de autenticação
        localStorage.removeItem('google_auth_in_progress');
        
        // Trocar código por tokens REAIS
        const credentials = JSON.parse(localStorage.getItem('google_calendar_credentials') || '{}');
        
        if (!credentials.client_id || !credentials.client_secret) {
          throw new Error('Credenciais não encontradas. Configure primeiro o Client ID e Secret.');
        }

        console.log('🔄 Trocando código por tokens...');
        
        // Usar o mesmo redirect URI que foi usado na autorização
        const lastRedirectUri = localStorage.getItem('last_redirect_uri_used') || `${window.location.origin}/admin`;
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: credentials.client_id,
            client_secret: credentials.client_secret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: lastRedirectUri,
          }),
        });

        console.log('📡 Resposta do token:', tokenResponse.status, tokenResponse.statusText);

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('❌ Erro do Google:', {
            status: tokenResponse.status,
            error: error,
            redirect_uri_used: lastRedirectUri
          });
          
          // Se é erro 400 e ainda não tentamos retry automático, tentar novamente
          if (tokenResponse.status === 400 && !localStorage.getItem('auto_retry_attempted')) {
            console.log('🔄 Erro 400 detectado, tentando retry automático...');
            localStorage.setItem('auto_retry_attempted', 'true');
            
            // Limpar URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: "🔄 Tentando novamente...",
              description: "Erro 400 detectado, limpando cache e tentando conectar automaticamente.",
            });
            
            // Tentar novamente após 2 segundos
            setTimeout(() => {
              connectGoogleCalendar(true);
            }, 2000);
            
            return;
          }
          
          // Limpar flag de retry para próximas tentativas
          localStorage.removeItem('auto_retry_attempted');
          
          let errorMessage = `Erro OAuth (${tokenResponse.status}): `;
          if (error.error === 'invalid_grant') {
            errorMessage += "Código expirado. Tente conectar novamente.";
          } else if (error.error === 'redirect_uri_mismatch') {
            errorMessage += "Configure o URI no Google Console: " + lastRedirectUri;
          } else {
            errorMessage += error.error_description || error.error || 'Erro desconhecido';
          }
          
          throw new Error(errorMessage);
        }

        const tokens = await tokenResponse.json();
        console.log('✅ Tokens obtidos:', { expires_in: tokens.expires_in });

        // Buscar informações do usuário com melhor tratamento de erro
        let userInfo;
        try {
          const userResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
          );
          
          if (!userResponse.ok) {
            console.warn('⚠️ Falha ao buscar dados do usuário, usando email padrão');
            // Se falhar, usar email do token JWT (mais confiável)
            const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1] || '{}'));
            userInfo = { 
              email: tokenPayload.email || 'okamichan2022@gmail.com',
              name: tokenPayload.name || 'Usuário Google'
            };
          } else {
            userInfo = await userResponse.json();
          }
        } catch (userError) {
          console.error('❌ Erro ao buscar usuário, usando fallback:', userError);
          userInfo = { 
            email: 'okamichan2022@gmail.com',
            name: 'Usuário Google' 
          };
        }
        
        console.log('👤 Usuário conectado:', userInfo.email);

        // Salvar tokens no localStorage
        const fullCredentials = {
          ...credentials,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000)
        };
        
        localStorage.setItem('google_calendar_credentials', JSON.stringify(fullCredentials));
        localStorage.setItem('google_calendar_email', userInfo.email);

        // Salvar estado conectado no Supabase
        await supabase
          .from("site_settings")
          .upsert({
            key: "google_calendar_connected",
            value: "true"
          });
        
        toast({
          title: "🎉 Google Calendar Conectado REAL!",
          description: `Conectado com ${userInfo.email}! Agendamentos serão criados no seu Google Calendar DE VERDADE!`,
          duration: 6000,
        });

        // Usar email real detectado
        setGoogleCalendarSettings(prev => ({
          ...prev,
          connected: true,
          email: userInfo.email
        }));

        // Limpar URL
        window.history.replaceState({}, document.title, "/admin");
        
      } catch (error: any) {
        console.error('❌ Erro na autenticação:', error);
        toast({
          variant: "destructive",
          title: "Erro na Conexão",
          description: error.message || "Erro ao finalizar conexão com Google Calendar",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const detectUserEmail = async () => {
    // FORÇAR seu email real para testes
    const forcedEmail = "okamichan2022@gmail.com";
    
    console.log("🎯 Forçando email para:", forcedEmail);
    
    return forcedEmail;
    
    // Código original comentado:
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user?.email) {
    //   return user.email;
    // }
    // return "okamichan2022@gmail.com";
  };

  // ========================================
  // 🕐 FUNÇÕES DE GESTÃO DE HORÁRIOS
  // ========================================

  const loadOperatingHours = async () => {
    try {
      setIsOperatingHoursLoading(true);
      
      // Buscar do banco (Supabase) primeiro
      const { data, error } = await (supabase as any)
        .from('operating_hours')
        .select('*')
        .order('day_of_week');

      if (error) {
        console.warn('⚠️ Falha ao carregar horários do banco, usando fallback localStorage:', error.message);
        const saved = localStorage.getItem('operatingHours');
        if (saved) {
          setOperatingHours(JSON.parse(saved));
        } else {
          const defaultData = [
            { day_of_week: 0, is_open: false, open_time: null, close_time: null },
            { day_of_week: 1, is_open: true, open_time: '08:00', close_time: '18:00' },
            { day_of_week: 2, is_open: true, open_time: '08:00', close_time: '18:00' },
            { day_of_week: 3, is_open: true, open_time: '08:00', close_time: '18:00' },
            { day_of_week: 4, is_open: true, open_time: '08:00', close_time: '18:00' },
            { day_of_week: 5, is_open: true, open_time: '08:00', close_time: '18:00' },
            { day_of_week: 6, is_open: true, open_time: '08:00', close_time: '12:00' },
          ];
          setOperatingHours(defaultData);
          localStorage.setItem('operatingHours', JSON.stringify(defaultData));
        }
      } else {
        // Converter TIMES do Postgres para HH:mm strings
        const normalized = (data || []).map((h: any) => ({
          day_of_week: h.day_of_week,
          is_open: h.is_open,
          open_time: h.open_time ? String(h.open_time).slice(0,5) : null,
          close_time: h.close_time ? String(h.close_time).slice(0,5) : null,
        }));
        setOperatingHours(normalized);
        // Sincronizar no localStorage para fallback
        localStorage.setItem('operatingHours', JSON.stringify(normalized));
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar horários:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar horários de funcionamento: " + error.message,
      });
    } finally {
      setIsOperatingHoursLoading(false);
    }
  };

  const saveOperatingHours = async (dayOfWeek: number, isOpen: boolean, openTime?: string, closeTime?: string) => {
    try {
      setIsLoading(true);
      
      console.log('⏰ Salvando horário:', { dayOfWeek, isOpen, openTime, closeTime });
      
      // 🛡️ PROTEÇÃO: Verificar consultas existentes que podem ser afetadas
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      let affectedAppointments = [];
      
      if (!isOpen) {
        // Se está fechando o dia, verificar consultas neste dia da semana
        affectedAppointments = appointments.filter(apt => {
          if (apt.status === 'cancelled') return false;
          const aptDate = new Date(apt.appointment_date);
          return aptDate.getDay() === dayOfWeek;
        });
      } else if (openTime && closeTime) {
        // Se está mudando horários, verificar consultas fora do novo horário
        affectedAppointments = appointments.filter(apt => {
          if (apt.status === 'cancelled') return false;
          const aptDate = new Date(apt.appointment_date);
          if (aptDate.getDay() !== dayOfWeek) return false;
          
          if (apt.appointment_time) {
            const [aptHours, aptMinutes] = apt.appointment_time.split(":").map(Number);
            const aptTimeMinutes = aptHours * 60 + aptMinutes;
            
            const [openHours, openMinutes] = openTime.split(":").map(Number);
            const [closeHours, closeMinutes] = closeTime.split(":").map(Number);
            const openTimeMinutes = openHours * 60 + openMinutes;
            const closeTimeMinutes = closeHours * 60 + closeMinutes;
            
            return aptTimeMinutes < openTimeMinutes || aptTimeMinutes >= closeTimeMinutes;
          }
          
          return false;
        });
      }
      
      // Atualizar estado local instantaneamente
      const updatedHours = operatingHours.map(hour => 
        hour.day_of_week === dayOfWeek 
          ? { ...hour, is_open: isOpen, open_time: openTime || null, close_time: closeTime || null }
          : hour
      );
      setOperatingHours(updatedHours);
      
      // Persistir no banco (upsert por day_of_week)
      const { error } = await (supabase as any)
        .from('operating_hours')
        .upsert({
          day_of_week: dayOfWeek,
          is_open: isOpen,
          open_time: isOpen ? (openTime || null) : null,
          close_time: isOpen ? (closeTime || null) : null,
        }, { onConflict: 'day_of_week' });

      if (error) {
        console.error('❌ Erro ao salvar no banco, mantendo apenas local:', error);
      } else {
        // Sincronizar no localStorage para fallback
        localStorage.setItem('operatingHours', JSON.stringify(updatedHours));
      }
      
      // 🔔 AVISO sobre consultas existentes (mas não as remove)
      if (affectedAppointments.length > 0) {
        const conflictDetails = affectedAppointments.map(apt => 
          `• ${apt.appointment_date} às ${apt.appointment_time} - ${apt.profiles?.full_name || 'Cliente'}`
        ).join('\n');
        
        toast({
          title: "⚠️ Horário Alterado com Consultas Existentes",
          description: `Horário de ${dayNames[dayOfWeek]} atualizado! ATENÇÃO: ${affectedAppointments.length} consulta(s) existente(s) fora do novo horário serão MANTIDAS.`,
          duration: 8000,
        });
        
        console.log(`⚠️ AVISO: ${affectedAppointments.length} consultas existentes afetadas em ${dayNames[dayOfWeek]}:`, conflictDetails);
      } else {
        toast({
          title: "✅ Horário Salvo",
          description: `Horário de ${dayNames[dayOfWeek]} atualizado com sucesso!`,
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar horário:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar horário: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDateBlocks = async () => {
    try {
      console.log('📅 Carregando bloqueios do banco...');
      const { data, error } = await (supabase as any)
        .from('date_blocks')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.warn('⚠️ Falha ao carregar bloqueios do banco, usando fallback local:', error.message);
        const savedBlocks = localStorage.getItem('dateBlocks');
        setDateBlocks(savedBlocks ? JSON.parse(savedBlocks) : []);
      } else {
        const mapped = (data || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          startDate: b.start_date,
          endDate: b.end_date,
          startTime: b.start_time ? String(b.start_time).slice(0,5) : '',
          endTime: b.end_time ? String(b.end_time).slice(0,5) : '',
          allDay: !b.start_time && !b.end_time,
          blockType: b.block_type || 'custom',
        }));
        setDateBlocks(mapped);
        localStorage.setItem('dateBlocks', JSON.stringify(mapped));
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar bloqueios:', error);
    }
  };

  const addDateBlock = async (blockData: any) => {
    try {
      setIsLoading(true);
      
      console.log('🚫 Adicionando bloqueio:', blockData);
      
      // 🛡️ PROTEÇÃO: Verificar se há consultas existentes que serão afetadas
      let conflictingAppointments = [];
      
      if (blockData.startDate && blockData.endDate) {
        const blockStart = new Date(blockData.startDate);
        const blockEnd = new Date(blockData.endDate);
        
        conflictingAppointments = appointments.filter(apt => {
          // Só verificar consultas confirmadas/pendentes (não canceladas)
          if (apt.status === 'cancelled') return false;
          
          const aptDate = new Date(apt.appointment_date);
          
          // Verificar se a consulta está na data do bloqueio
          if (aptDate >= blockStart && aptDate <= blockEnd) {
            // Se é bloqueio de dia inteiro, todas as consultas do dia são afetadas
            if (blockData.allDay) {
              return true;
            }
            
            // Se é bloqueio de horário específico, verificar sobreposição
            if (blockData.startTime && blockData.endTime && apt.appointment_time) {
              const [aptHours, aptMinutes] = apt.appointment_time.split(":").map(Number);
              const aptTimeMinutes = aptHours * 60 + aptMinutes;
              
              const [blockStartHours, blockStartMins] = blockData.startTime.split(":").map(Number);
              const [blockEndHours, blockEndMins] = blockData.endTime.split(":").map(Number);
              const blockStartTime = blockStartHours * 60 + blockStartMins;
              const blockEndTime = blockEndHours * 60 + blockEndMins;
              
              // Assumir duração de 60 min para consulta (pode ser ajustado)
              const aptEndMinutes = aptTimeMinutes + 60;
              
              return aptTimeMinutes < blockEndTime && aptEndMinutes > blockStartTime;
            }
          }
          
          return false;
        });
      }
      
      // Persistir no banco
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const toInsert = {
        title: blockData.title || 'Bloqueio',
        description: blockData.description || null,
        block_type: blockData.blockType || 'custom',
        start_date: blockData.startDate,
        end_date: blockData.endDate,
        start_time: blockData.allDay ? null : (blockData.startTime || null),
        end_time: blockData.allDay ? null : (blockData.endTime || null),
        created_by: userId,
      };

      const { error: insertError } = await (supabase as any)
        .from('date_blocks')
        .insert([toInsert]);

      if (insertError) {
        throw insertError;
      }

      // Recarregar do banco para garantir consistência
      await loadDateBlocks();
      
      // 🔔 AVISO sobre consultas existentes (mas não as remove)
      if (conflictingAppointments.length > 0) {
        const conflictDetails = conflictingAppointments.map(apt => 
          `• ${apt.appointment_date} às ${apt.appointment_time} - ${apt.profiles?.full_name || 'Cliente'}`
        ).join('\n');
        
        toast({
          title: "⚠️ Bloqueio Criado com Consultas Existentes",
          description: `Bloqueio adicionado! ATENÇÃO: ${conflictingAppointments.length} consulta(s) existente(s) na área bloqueada serão MANTIDAS (só afeta novos agendamentos)`,
          duration: 8000,
        });
        
        console.log(`⚠️ AVISO: ${conflictingAppointments.length} consultas existentes afetadas pelo bloqueio:`, conflictDetails);
      } else {
        toast({
          title: "✅ Bloqueio Adicionado",
          description: "Bloqueio criado com sucesso! Afeta apenas novos agendamentos.",
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao adicionar bloqueio:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar bloqueio: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeDateBlock = async (blockId: number) => {
    try {
      setIsLoading(true);
      
      console.log('🗑️ Removendo bloqueio:', blockId);
      
      // Remover no banco
      const { error } = await (supabase as any)
        .from('date_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      await loadDateBlocks();
      
      toast({
        title: "✅ Bloqueio Removido",
        description: "Bloqueio removido com sucesso e atualizado em tempo real!",
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao remover bloqueio:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover bloqueio: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Limpar dados locais
      localStorage.removeItem('google_calendar_email');
      
      // Atualizar Supabase
      await supabase
        .from("site_settings")
        .upsert({
          key: "google_calendar_connected",
          value: "false"
        });
      
      toast({
        title: "🔌 Desconectado!",
        description: "Google Calendar foi desconectado.",
      });

      setGoogleCalendarSettings(prev => ({
        ...prev,
        connected: false,
        email: ""
      }));
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (!error) {
      setServices(data || []);
    }
  };

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services (name, price, duration_minutes),
        profiles:client_id (full_name, email, phone)
      `)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (!error && data) {
      console.log('📊 Agendamentos carregados:', data);
      
      // 🔍 DEBUG: Verificar se telefones estão vindo
      data.forEach(apt => {
        if (apt.profiles) {
          console.log(`👤 Cliente: ${apt.profiles.full_name}`);
          console.log(`📧 Email: ${apt.profiles.email}`);
          console.log(`📱 Telefone: ${apt.profiles.phone || '❌ SEM TELEFONE'}`);
        }
      });
      
      setAppointments(data || []);
    } else if (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    }
  };

  const handleConfirm = async (aptId: string) => {
    setIsLoading(true);
    
    try {
      // Buscar dados completos do agendamento ANTES de confirmar
      const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          profiles:client_id (full_name, email, phone),
          services (name, duration_minutes, description, price)
        `)
        .eq("id", aptId)
        .single();

      if (fetchError) throw fetchError;

      // Confirmar agendamento
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", aptId);

      if (error) throw error;

      // 📧📱 ENVIAR NOTIFICAÇÕES DE CONFIRMAÇÃO
      console.log('📢 Enviando notificações de confirmação...');
      const notificationResults = await sendAllNotifications(appointment, 'appointment_confirmation');
      
      if (notificationResults.successful > 0) {
        console.log(`✅ ${notificationResults.successful}/${notificationResults.total} notificações enviadas com sucesso!`);
      } else {
        console.log('⚠️ Nenhuma notificação foi enviada (possível problema de configuração)');
      }

      // Se conectado, criar evento REAL no Google Calendar
      if (googleCalendarSettings.connected) {
        // Buscar dados do agendamento para criar o evento
        const { data: appointment } = await supabase
          .from("appointments")
          .select(`
            *,
            profiles:client_id (full_name, email, phone),
            services (name, duration_minutes, description)
          `)
          .eq("id", aptId)
          .single();

        if (appointment) {
          try {
            // Criar dados do evento
            const eventDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
            const endDateTime = new Date(eventDateTime.getTime() + (appointment.services.duration_minutes * 60000));
            
            // Carregar credenciais com tokens
            const credentials = JSON.parse(localStorage.getItem('google_calendar_credentials') || '{}');
            
            console.log('🔍 Verificando credenciais para Google Calendar...');
            console.log('🔑 Credenciais disponíveis:', {
              has_client_id: !!credentials.client_id,
              has_client_secret: !!credentials.client_secret,
              has_access_token: !!credentials.access_token,
              token_expires: credentials.expires_at ? new Date(credentials.expires_at).toLocaleString() : 'N/A'
            });
            
            if (!credentials.access_token) {
              throw new Error('🚨 Token de acesso não encontrado! Clique em "Desconectar" e "Conectar" novamente para obter um novo token.');
            }

            // Verificar se token não expirou
            if (credentials.expires_at && Date.now() > credentials.expires_at) {
              console.error('❌ Token expirado:', new Date(credentials.expires_at));
              // Limpar token expirado automaticamente
              localStorage.removeItem('google_calendar_credentials');
              localStorage.removeItem('google_calendar_email');
              setGoogleCredentials(null);
              setGoogleCalendarSettings(prev => ({
                ...prev,
                connected: false,
                email: ''
              }));
              
              throw new Error('🕐 Token expirado! Token removido automaticamente. Conecte novamente com o Google Calendar.');
            }

            // Inicializar API do Google Calendar
            const calendarAPI = new GoogleCalendarAPI(credentials);

            // Criar evento REAL
            const result = await calendarAPI.createEvent({
              title: `${appointment.services.name} - ${appointment.profiles.full_name}`,
              description: `🏥 AGENDAMENTO TERAPÊUTICO 🏥

👤 Cliente: ${appointment.profiles.full_name}
📧 Email: ${appointment.profiles.email}
📞 Telefone: ${appointment.profiles.phone || 'Não informado'}

💆‍♀️ Serviço: ${appointment.services.name}
📝 Descrição: ${appointment.services.description || 'Sem descrição'}
⏰ Duração: ${appointment.services.duration_minutes} minutos

📋 Observações: ${appointment.notes || 'Nenhuma observação especial'}

✨ Agendamento confirmado pelo sistema Therapy Flow ✨`,
              startDateTime: eventDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              attendeeEmail: appointment.profiles.email,
              attendeeName: appointment.profiles.full_name
            });

            if (result.success) {
              // Salvar ID do evento para poder deletar depois
              await supabase
                .from("appointments")
                .update({ 
                  notes: `${appointment.notes || ''}\n[Google Calendar Event ID: ${result.eventId}]`.trim()
                })
                .eq("id", aptId);

              toast({
                title: "🎉 SUCESSO TOTAL!",
                description: `Agendamento confirmado, evento criado no Google Calendar e ${notificationResults.successful} notificação(ões) enviada(s)!`,
                duration: 8000,
              });

              console.log('🎉 EVENTO CRIADO DE VERDADE:', result);
            }

          } catch (calendarError: any) {
            console.error('❌ Erro no Google Calendar:', calendarError);
            
            // Verificar se é erro de autenticação
            if (calendarError.message && 
                (calendarError.message.includes('401') || 
                 calendarError.message.includes('token') || 
                 calendarError.message.includes('unauthorized'))) {
              
              console.log('🧹 Removendo token inválido automaticamente...');
              localStorage.removeItem('google_calendar_credentials');
              localStorage.removeItem('google_calendar_email');
              setGoogleCredentials(null);
              setGoogleCalendarSettings(prev => ({
                ...prev,
                connected: false,
                email: ''
              }));
              
              toast({
                title: "✅ Agendamento Confirmado",
                description: `Agendamento confirmado e ${notificationResults.successful} notificação(ões) enviada(s)! Token do Google Calendar removido (estava inválido). Reconecte para sincronizar.`,
                variant: "default"
              });
            } else {
              toast({
                title: "✅ Agendamento Confirmado",
                description: `Agendamento confirmado e ${notificationResults.successful} notificação(ões) enviada(s)! Erro no Google Calendar: ${calendarError.message}`,
                variant: "default"
              });
            }
          }

        } else {
          toast({
            title: t('admin.confirmedSuccess'),
            description: `Agendamento confirmado e ${notificationResults.successful} notificação(ões) enviada(s)! (Dados do evento não encontrados)`,
          });
        }
      } else {
        toast({
          title: t('admin.confirmedSuccess'),
          description: `Agendamento confirmado e ${notificationResults.successful} notificação(ões) enviada(s)! Para sincronizar com Google Calendar, conecte na aba correspondente.`,
        });
      }

      loadAppointments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (aptId: string) => {
    setIsLoading(true);
    
    try {
      // Buscar o agendamento para pegar as informações completas
      const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          *,
          profiles:client_id (full_name, email, phone),
          services (name, duration_minutes, price)
        `)
        .eq("id", aptId)
        .single();

      if (fetchError) throw fetchError;

      // Cancelar no banco de dados
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", aptId);

      if (error) throw error;

      // 📧📱 ENVIAR NOTIFICAÇÕES DE CANCELAMENTO
      console.log('📢 Enviando notificações de cancelamento...');
      const cancellationReason = "Cancelamento realizado pela clínica"; // Você pode personalizar isso
      const notificationResults = await sendAllNotifications(appointment, 'appointment_cancellation', cancellationReason);
      
      if (notificationResults.successful > 0) {
        console.log(`✅ ${notificationResults.successful}/${notificationResults.total} notificações de cancelamento enviadas!`);
      }

      // Tentar remover do Google Calendar se o evento existe
      if (appointment.notes && appointment.notes.includes('[Google Calendar Event ID:')) {
        try {
          const eventIdMatch = appointment.notes.match(/\[Google Calendar Event ID: ([^\]]+)\]/);
          if (eventIdMatch && eventIdMatch[1]) {
            const eventId = eventIdMatch[1];
            console.log('🗑️ Tentando remover evento do Google Calendar:', eventId);

            // Verificar se temos credenciais do Google
            const credentials = localStorage.getItem('google_calendar_credentials');
            if (credentials) {
              const creds = JSON.parse(credentials);
              const calendarAPI = new GoogleCalendarAPI(creds);
              
              const deleteResult = await calendarAPI.deleteEvent(eventId);
              if (deleteResult.success) {
                console.log('✅ Evento removido do Google Calendar com sucesso!');
                
                toast({
                  title: "❌ Agendamento Cancelado",
                  description: `Agendamento cancelado, removido do Google Calendar e ${notificationResults.successful} notificação(ões) enviada(s)!`,
                });
              }
            } else {
              console.log('⚠️ Sem credenciais do Google - evento não removido do calendário');
              toast({
                title: "❌ Agendamento Cancelado",
                description: `Agendamento cancelado e ${notificationResults.successful} notificação(ões) enviada(s)! (sem remoção do Google Calendar - reconecte se necessário)`,
              });
            }
          }
        } catch (calendarError: any) {
          console.error('❌ Erro ao remover do Google Calendar:', calendarError);
          toast({
            title: "❌ Agendamento Cancelado",
            description: `Agendamento cancelado e ${notificationResults.successful} notificação(ões) enviada(s)! (erro ao remover do Google Calendar)`,
          });
        }
      } else {
        toast({
          title: "❌ Agendamento Cancelado",
          description: `Agendamento cancelado com sucesso e ${notificationResults.successful} notificação(ões) enviada(s)!`,
        });
      }

      loadAppointments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para organização por cliente
  const groupAppointmentsByClient = () => {
    const grouped: Record<string, any[]> = {};
    
    appointments.forEach(apt => {
       const clientKey = apt.profiles?.full_name || 'Cliente sem nome';
      if (!grouped[clientKey]) {
        grouped[clientKey] = [];
      }
      grouped[clientKey].push(apt);
    });
    
    // Ordenar consultas de cada cliente por data
    Object.keys(grouped).forEach(clientKey => {
      grouped[clientKey].sort((a, b) => {
        const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
      });
    });
    
    return grouped;
  };

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };

  const calculateClientRevenue = (clientAppointments: any[]) => {
    return clientAppointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'completed')
      .reduce((total, apt) => {
        const customPrice = clientPrices[apt.id];
        const servicePrice = apt.services?.price || 0;
        return total + (customPrice || servicePrice);
      }, 0);
  };

  const calculateTotalRevenue = () => {
    return appointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'completed')
      .reduce((total, apt) => {
        const customPrice = clientPrices[apt.id];
        const servicePrice = apt.services?.price || 0;
        return total + (customPrice || servicePrice);
      }, 0);
  };

  const updateAppointmentPrice = (appointmentId: string, newPrice: number) => {
    setClientPrices(prev => ({
      ...prev,
      [appointmentId]: newPrice
    }));
    
    // Salvar no localStorage para persistência
    const updatedPrices = { ...clientPrices, [appointmentId]: newPrice };
    localStorage.setItem('appointmentPrices', JSON.stringify(updatedPrices));
    
    toast({
      title: "💰 Preço Atualizado",
      description: `Preço da consulta atualizado para € ${newPrice.toFixed(2)}`,
    });
  };

  // Carregar preços personalizados do localStorage
  useEffect(() => {
    const savedPrices = localStorage.getItem('appointmentPrices');
    if (savedPrices) {
      setClientPrices(JSON.parse(savedPrices));
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Concluído",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Função para atualizar preview do serviço em tempo real
  const updateServicePreview = (field: string, value: any) => {
    setServicePreview(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset preview when opening dialog
  const handleOpenServiceDialog = (service: any = null) => {
    setEditingService(service);
    setServicePreview(service || {
      name_pt: '',
      description_pt: '',
      duration_minutes: 60,
      price: 0,
      icon_name: 'sparkles',
      icon_emoji: '',
      hover_color: '#3B82F6'
    });
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Dados básicos (sempre funcionam)
    const basicServiceData = {
      name: formData.get("name_pt") as string, // Manter compatibilidade
      name_pt: formData.get("name_pt") as string,
      name_en: formData.get("name_en") as string,
      name_fr: formData.get("name_fr") as string,
      description: formData.get("description_pt") as string, // Manter compatibilidade
      description_pt: formData.get("description_pt") as string,
      description_en: formData.get("description_en") as string,
      description_fr: formData.get("description_fr") as string,
      duration_minutes: parseInt(formData.get("duration_minutes") as string),
      price: parseFloat(formData.get("price") as string),
      active: formData.get("active") === "true",
    };

    // Campos de customização (podem não existir ainda)
    const customizationData = {
      icon_name: formData.get("icon_name") as string || 'sparkles',
      icon_emoji: formData.get("icon_emoji") as string || null,
      hover_color: formData.get("hover_color") as string || '#3B82F6',
    };

    console.log('💾 Tentando salvar serviço:', { basicServiceData, customizationData });

    // Tenta salvar com customização primeiro
    let serviceData = { ...basicServiceData, ...customizationData };

    if (editingService) {
      let { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      // Se der erro de coluna/esquema, tenta sem os campos de customização
      if (error && (error.message?.toLowerCase().includes('column') || error.message?.toLowerCase().includes('schema') || error.message?.toLowerCase().includes('cache'))) {
        console.warn('⚠️ Campos de customização não existem no banco, salvando apenas dados básicos');
        console.error('Erro original:', error.message);
        const { error: basicError } = await supabase
          .from("services")
          .update(basicServiceData)
          .eq("id", editingService.id);
        error = basicError;
        
        if (!basicError) {
          toast({
            title: "⚠️ Serviço atualizado (sem customização)",
            description: "Execute a migração 20251101000000_fix_services_multilingual_columns.sql para habilitar cor/emoji",
            duration: 8000,
          });
        }
      }

      if (error) {
        console.error('❌ Erro ao atualizar serviço:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      } else if (!error) {
        console.log('✅ Serviço atualizado com sucesso!');
        toast({ title: "Serviço atualizado!" });
      }
    } else {
      let { error } = await supabase
        .from("services")
        .insert([serviceData]);

      // Se der erro de coluna/esquema, tenta sem os campos de customização
      if (error && (error.message?.toLowerCase().includes('column') || error.message?.toLowerCase().includes('schema') || error.message?.toLowerCase().includes('cache'))) {
        console.warn('⚠️ Campos de customização não existem no banco, salvando apenas dados básicos');
        console.error('Erro original:', error.message);
        const { error: basicError } = await supabase
          .from("services")
          .insert([basicServiceData]);
        error = basicError;
        
        if (!basicError) {
          toast({
            title: "⚠️ Serviço criado (sem customização)",
            description: "Execute a migração 20251101000000_fix_services_multilingual_columns.sql para habilitar cor/emoji",
            duration: 8000,
          });
        }
      }

      if (error) {
        console.error('❌ Erro ao criar serviço:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      } else if (!error) {
        console.log('✅ Serviço criado com sucesso!');
        toast({ title: "Serviço criado!" });
      }
    }

    setIsServiceDialogOpen(false);
    setEditingService(null);
    loadServices();
  };

  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  
  // Estados para sistema de cancelamento avançado
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelApt, setSelectedCancelApt] = useState<any>(null);
  const [cancelReasonValue, setCancelReasonValue] = useState("");
  const [releaseSlot, setReleaseSlot] = useState(true);

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    } else {
      toast({ title: t('admin.serviceDeleted') });
      loadServices();
    }
    setServiceToDelete(null);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSettingsLoading(true);

    const formData = new FormData(e.currentTarget);
    const settingsToUpdate = [
      { key: 'contact_phone', value: formData.get('contact_phone') as string },
      { key: 'contact_email', value: formData.get('contact_email') as string },
      { key: 'contact_address', value: formData.get('contact_address') as string },
      { key: 'hero_title_pt', value: formData.get('hero_title_pt') as string },
      { key: 'hero_title_en', value: formData.get('hero_title_en') as string },
      { key: 'hero_title_fr', value: formData.get('hero_title_fr') as string },
      { key: 'hero_subtitle_pt', value: formData.get('hero_subtitle_pt') as string },
      { key: 'hero_subtitle_en', value: formData.get('hero_subtitle_en') as string },
      { key: 'hero_subtitle_fr', value: formData.get('hero_subtitle_fr') as string },
    ];

    try {
      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value 
          }, { 
            onConflict: 'key' 
          });

        if (error) throw error;
      }

      toast({ title: t('admin.settingsSaved') });
      loadSiteSettings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const confirmedCount = appointments.filter(a => a.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Painel Administrativo</h1>
            <div className="flex gap-3">
              <Button 
                onClick={openGoogleCalendar}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Abrir Google Calendar
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-secondary">{pendingCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{confirmedCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-accent">{appointments.length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="appointments">{t('admin.appointments')}</TabsTrigger>
              <TabsTrigger value="services">{t('admin.services')}</TabsTrigger>
              <TabsTrigger value="hours">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Google Calendar
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                {t('admin.settings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
              <div className="space-y-6">
                {/* Métricas Financeiras */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{appointments.length}</div>
                      <p className="text-xs text-muted-foreground">Total de Consultas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        € {calculateTotalRevenue().toFixed(2).replace('.', ',')}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Arrecadado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{Object.keys(groupAppointmentsByClient()).length}</div>
                      <p className="text-xs text-muted-foreground">Clientes Únicos</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Consultas Organizadas por Cliente */}
                <Card className="shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Consultas por Cliente
                    </CardTitle>
                    <CardDescription>Gerencie as consultas organizadas por cliente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {appointments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum agendamento ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(groupAppointmentsByClient()).map(([clientName, clientAppointments]) => {
                          const isExpanded = expandedClients.has(clientName);
                          const clientRevenue = calculateClientRevenue(clientAppointments);
                          const clientInfo = clientAppointments[0]?.profiles;
                          
                          return (
                            <Card key={clientName} className="overflow-hidden">
                              <CardHeader 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleClientExpansion(clientName)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg">{clientName}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {clientInfo?.email} • {clientInfo?.phone || "Sem telefone"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-sm font-medium">{clientAppointments.length} consulta(s)</p>
                                      <p className="text-sm text-green-600 font-semibold">
                                        € {clientRevenue.toFixed(2).replace('.', ',')}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                      <Calendar className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              {isExpanded && (
                                <CardContent className="pt-0 border-t bg-muted/20">
                                  <div className="space-y-3">
                                    {clientAppointments.map((apt) => (
                                      <div key={apt.id} className="bg-background p-4 rounded-lg border">
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                              <p className="font-medium text-primary">{apt.services?.name}</p>
                                              {getStatusBadge(apt.status)}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(apt.appointment_date), "dd/MM/yyyy", { locale: ptBR })}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {apt.appointment_time}
                                              </span>
                                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                                💰 € {(clientPrices[apt.id] || apt.services?.price || 0).toFixed(2).replace('.', ',')}
                                              </span>
                                            </div>
                                            
                                            {apt.notes && (
                                              <p className="text-sm bg-muted p-3 rounded-md">
                                                <strong>Observações:</strong> {apt.notes}
                                              </p>
                                            )}
                                            
                                            {apt.cancellation_reason && (
                                              <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                                                <strong>Motivo do cancelamento:</strong> {apt.cancellation_reason}
                                              </p>
                                            )}
                                          </div>
                                          
                                          <div className="flex gap-2 ml-4">
                                            {/* Botão de editar preço */}
                                            {(apt.status === 'confirmed' || apt.status === 'completed') && (
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <Button size="sm" variant="outline">
                                                    <Edit className="w-4 h-4" />
                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                  <DialogHeader>
                                                    <DialogTitle>Editar Preço da Consulta</DialogTitle>
                                                    <DialogDescription>
                                                      Ajuste o preço desta consulta específica
                                                    </DialogDescription>
                                                  </DialogHeader>
                                                  <div className="space-y-4">
                                                    <div>
                                                      <Label htmlFor="price">Preço (€)</Label>
                                                      <Input
                                                        id="price"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        defaultValue={clientPrices[apt.id] || apt.services?.price || 0}
                                                        onBlur={(e) => {
                                                          const newPrice = parseFloat(e.target.value) || 0;
                                                          updateAppointmentPrice(apt.id, newPrice);
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                            )}
                                            
                                            {/* Botões de ação */}
                                            {apt.status === "pending" && (
                                              <>
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleConfirm(apt.id)}
                                                  disabled={isLoading}
                                                  className="bg-green-600 hover:bg-green-700"
                                                >
                                                  <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => handleCancel(apt.id)}
                                                  disabled={isLoading}
                                                >
                                                  <X className="w-4 h-4" />
                                                </Button>
                                              </>
                                            )}
                                            
                                            {apt.status === "confirmed" && (
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleCancel(apt.id)}
                                                disabled={isLoading}
                                              >
                                                <X className="w-4 h-4 mr-1" />
                                                Cancelar
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services">
              <Card className="shadow-glow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Serviços</CardTitle>
                    <CardDescription>Adicione, edite ou remova serviços</CardDescription>
                  </div>
                  <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenServiceDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Serviço
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>
                          {editingService ? "Editar Serviço" : "Novo Serviço"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto scrollbar-thin scroll-container px-1 max-h-[calc(90vh-8rem)]">
                        <form onSubmit={handleSaveService} className="space-y-6 pb-6">
                        <div className="grid grid-cols-1 gap-4">
                          <h4 className="font-medium text-sm text-muted-foreground">Nome do Serviço</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor="name_pt">Português</Label>
                              <Input
                                id="name_pt"
                                name="name_pt"
                                defaultValue={editingService?.name_pt || editingService?.name}
                                placeholder="Ex: Massagem Relaxante"
                                onChange={(e) => updateServicePreview('name_pt', e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="name_en">English</Label>
                              <Input
                                id="name_en"
                                name="name_en"
                                defaultValue={editingService?.name_en}
                                placeholder="Ex: Relaxing Massage"
                              />
                            </div>
                            <div>
                              <Label htmlFor="name_fr">Français</Label>
                              <Input
                                id="name_fr"
                                name="name_fr"
                                defaultValue={editingService?.name_fr}
                                placeholder="Ex: Massage Relaxant"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <h4 className="font-medium text-sm text-muted-foreground">Descrição do Serviço</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label htmlFor="description_pt">Português</Label>
                              <Textarea
                                id="description_pt"
                                name="description_pt"
                                defaultValue={editingService?.description_pt || editingService?.description}
                                placeholder="Descrição em português..."
                                onChange={(e) => updateServicePreview('description_pt', e.target.value)}
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="description_en">English</Label>
                              <Textarea
                                id="description_en"
                                name="description_en"
                                defaultValue={editingService?.description_en}
                                placeholder="Description in English..."
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="description_fr">Français</Label>
                              <Textarea
                                id="description_fr"
                                name="description_fr"
                                defaultValue={editingService?.description_fr}
                                placeholder="Description en français..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="duration_minutes">Duração (min)</Label>
                          <Input
                            id="duration_minutes"
                            name="duration_minutes"
                            type="number"
                            defaultValue={editingService?.duration_minutes}
                            onChange={(e) => updateServicePreview('duration_minutes', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Preço (€)</Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={editingService?.price}
                            onChange={(e) => updateServicePreview('price', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        {/* Customização Visual */}
                        <div className="grid grid-cols-1 gap-4 border-t pt-4">
                          <h4 className="font-medium text-sm text-muted-foreground">Customização Visual</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="icon_name">Ícone (Lucide)</Label>
                              <Select
                                name="icon_name"
                                defaultValue={editingService?.icon_name || "sparkles"}
                                onValueChange={(value) => updateServicePreview('icon_name', value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione um ícone" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sparkles">✨ Sparkles</SelectItem>
                                  <SelectItem value="heart">❤️ Heart</SelectItem>
                                  <SelectItem value="zap">⚡ Zap</SelectItem>
                                  <SelectItem value="star">⭐ Star</SelectItem>
                                  <SelectItem value="sun">☀️ Sun</SelectItem>
                                  <SelectItem value="moon">🌙 Moon</SelectItem>
                                  <SelectItem value="flower">🌸 Flower</SelectItem>
                                  <SelectItem value="leaf">🍃 Leaf</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="icon_emoji">Emoji (opcional)</Label>
                              <Input
                                id="icon_emoji"
                                name="icon_emoji"
                                defaultValue={editingService?.icon_emoji}
                                placeholder="🌸 ou deixe vazio"
                                onChange={(e) => updateServicePreview('icon_emoji', e.target.value)}
                                maxLength={2}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="hover_color">Cor de Hover</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                id="hover_color"
                                name="hover_color"
                                type="color"
                                defaultValue={editingService?.hover_color || "#3B82F6"}
                                onChange={(e) => updateServicePreview('hover_color', e.target.value)}
                                className="w-16 h-10 p-1 rounded"
                              />
                              <Input
                                defaultValue={editingService?.hover_color || "#3B82F6"}
                                placeholder="#3B82F6"
                                className="flex-1"
                                onChange={(e) => {
                                  updateServicePreview('hover_color', e.target.value);
                                  const colorInput = document.getElementById('hover_color') as HTMLInputElement;
                                  if (colorInput) colorInput.value = e.target.value;
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Preview Card */}
                          <div>
                            <Label>Preview</Label>
                            <div 
                              className="border rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
                              style={{
                                '--hover-color': servicePreview.hover_color || '#3B82F6'
                              } as React.CSSProperties}
                              onMouseEnter={(e) => {
                                const color = servicePreview.hover_color || '#3B82F6';
                                e.currentTarget.style.borderColor = color;
                                e.currentTarget.style.boxShadow = `0 4px 20px ${color}33`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.boxShadow = '';
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {servicePreview.icon_emoji ? (
                                  <span className="text-xl">{servicePreview.icon_emoji}</span>
                                ) : (
                                  <div 
                                    className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
                                    style={{ color: servicePreview.hover_color || '#3B82F6' }}
                                  >
                                    {servicePreview.icon_name === 'heart' && '❤️'}
                                    {servicePreview.icon_name === 'zap' && '⚡'}
                                    {servicePreview.icon_name === 'star' && '⭐'}
                                    {(!servicePreview.icon_name || servicePreview.icon_name === 'sparkles') && '✨'}
                                    {servicePreview.icon_name === 'sun' && '☀️'}
                                    {servicePreview.icon_name === 'moon' && '🌙'}
                                    {servicePreview.icon_name === 'flower' && '�'}
                                    {servicePreview.icon_name === 'leaf' && '🍃'}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold">
                                    {servicePreview.name_pt || 'Nome do Serviço'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {servicePreview.duration_minutes || 60}min - €{(servicePreview.price || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {servicePreview.description_pt && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {servicePreview.description_pt}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="active">Status</Label>
                          <Select
                            name="active"
                            defaultValue={editingService?.active ? "true" : "false"}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Ativo</SelectItem>
                              <SelectItem value="false">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          {editingService ? "Atualizar" : "Criar"}
                        </Button>
                      </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum serviço cadastrado
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <Card key={service.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-lg">{service.name}</h3>
                                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                    service.active 
                                      ? "bg-green-100 text-green-800 border border-green-200" 
                                      : "bg-red-100 text-red-800 border border-red-200"
                                  }`}>
                                    {service.active ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Ativo
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3" />
                                        Inativo
                                      </>
                                    )}
                                  </div>
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground">{service.description}</p>
                                )}
                                <div className="flex gap-4 text-sm">
                                  <span>⏱️ {service.duration_minutes} min</span>
                                  <span className="font-bold text-primary">
                                    € {service.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingService(service);
                                    setIsServiceDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setServiceToDelete(service.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========================================
                🕐 ABA DE GESTÃO DE HORÁRIOS
            ======================================== */}
            <TabsContent value="hours">
              <div className="grid gap-6">
                
                {/* 🕐 HORÁRIOS DE FUNCIONAMENTO */}
                <Card className="shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Horários de Funcionamento
                    </CardTitle>
                    <CardDescription>
                      Configure os horários de atendimento para cada dia da semana
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>🛡️ PROTEÇÃO DE CONSULTAS:</strong> Consultas já agendadas têm prioridade absoluta e nunca são removidas por mudanças de horário. Apenas novos agendamentos são afetados.
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isOperatingHoursLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Carregando horários...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((dayName, index) => {
                          const dayData = operatingHours.find(h => h.day_of_week === index);
                          const isOpen = dayData?.is_open || false;
                          const openTime = dayData?.open_time || '08:00';
                          const closeTime = dayData?.close_time || '18:00';

                          return (
                            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="w-32 font-medium">
                                {dayName}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isOpen}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      saveOperatingHours(index, true, openTime, closeTime);
                                    } else {
                                      saveOperatingHours(index, false);
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">Aberto</span>
                              </div>

                              {isOpen && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">das</span>
                                    <Input
                                      type="time"
                                      value={openTime}
                                      onChange={(e) => {
                                        saveOperatingHours(index, true, e.target.value, closeTime);
                                      }}
                                      className="w-24 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">às</span>
                                    <Input
                                      type="time"
                                      value={closeTime}
                                      onChange={(e) => {
                                        saveOperatingHours(index, true, openTime, e.target.value);
                                      }}
                                      className="w-24 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                  </div>
                                </>
                              )}

                              {!isOpen && (
                                <div className="text-sm text-muted-foreground">
                                  Fechado
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">💡 Como Funciona</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Marque "Aberto" para dias de atendimento</li>
                        <li>• Configure horário de abertura e fechamento</li>
                        <li>• Clientes só poderão agendar nos horários configurados</li>
                        <li>• Alterações são aplicadas imediatamente no sistema</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* 🚫 SISTEMA DE BLOQUEIOS */}
                <Card className="shadow-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <X className="w-5 h-5" />
                      Bloqueios de Datas e Horários
                    </CardTitle>
                    <CardDescription>
                      Bloqueie períodos específicos (férias, compromissos, etc.)
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>🛡️ PROTEÇÃO DE CONSULTAS:</strong> Bloqueios afetam apenas novos agendamentos. Consultas já confirmadas são mantidas mesmo em períodos bloqueados.
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    
                    {/* Formulário para Adicionar Bloqueio */}
                    <div className="border rounded-lg p-4 mb-6">
                      <h4 className="font-medium mb-4">Adicionar Novo Bloqueio</h4>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        
                        const startTime = (formData.get('start_time') as string) || '';
                        const endTime = (formData.get('end_time') as string) || '';
                        const blockData = {
                          // CamelCase shape expected by addDateBlock
                          title: (formData.get('title') as string) || 'Bloqueio',
                          description: (formData.get('description') as string) || '',
                          blockType: (formData.get('block_type') as string) || 'custom',
                          startDate: formData.get('start_date') as string,
                          endDate: formData.get('end_date') as string,
                          startTime,
                          endTime,
                          allDay: !(startTime && endTime),
                        };
                        
                        addDateBlock(blockData);
                        (e.target as HTMLFormElement).reset();
                      }} className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title">Título do Bloqueio</Label>
                            <Input
                              id="title"
                              name="title"
                              placeholder="Ex: Férias de Janeiro"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="block_type">Tipo</Label>
                            <select
                              id="block_type"
                              name="block_type"
                              className="w-full p-2 border border-gray-300 rounded-md"
                              required
                            >
                              <option value="vacation">Férias</option>
                              <option value="external_commitment">Compromisso Externo</option>
                              <option value="maintenance">Manutenção</option>
                              <option value="custom">Outros</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Descrição (Opcional)</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Detalhes sobre o bloqueio..."
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_date">Data Inicial</Label>
                            <Input
                              id="start_date"
                              name="start_date"
                              type="date"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="end_date">Data Final</Label>
                            <Input
                              id="end_date"
                              name="end_date"
                              type="date"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_time" className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              Horário Inicial (Opcional)
                            </Label>
                            <Input
                              id="start_time"
                              name="start_time"
                              type="time"
                              placeholder="Deixe vazio para bloquear dia inteiro"
                              className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="end_time" className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              Horário Final (Opcional)
                            </Label>
                            <Input
                              id="end_time"
                              name="end_time"
                              type="time"
                              placeholder="Deixe vazio para bloquear dia inteiro"
                              className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        </div>

                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                          Adicionar Bloqueio
                        </Button>
                      </form>
                    </div>

                    {/* Lista de Bloqueios Ativos */}
                    <div>
                      <h4 className="font-medium mb-4">Bloqueios Ativos ({dateBlocks.length})</h4>
                      
                      {dateBlocks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum bloqueio configurado
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dateBlocks.map((block) => (
                            <div key={block.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <div className="font-medium">{block.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(block.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(block.endDate), "dd/MM/yyyy", { locale: ptBR })}
                                  {block.startTime && block.endTime && (
                                    <span> • {block.startTime} às {block.endTime}</span>
                                  )}
                                </div>
                                {block.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {block.description}
                                  </div>
                                )}
                                <Badge variant="outline" className="mt-1">
                                  {block.block_type === 'vacation' && 'Férias'}
                                  {block.block_type === 'external_commitment' && 'Compromisso Externo'}
                                  {block.block_type === 'maintenance' && 'Manutenção'}
                                  {block.block_type === 'custom' && 'Outros'}
                                </Badge>
                              </div>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover este bloqueio?')) {
                                    removeDateBlock(block.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✨ Funcionalidades</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• <strong>Bloqueio Total:</strong> Deixe horários vazios para bloquear dia inteiro</li>
                        <li>• <strong>Bloqueio Parcial:</strong> Defina horários específicos para bloquear</li>
                        <li>• <strong>Tipos:</strong> Organize por férias, compromissos, manutenção, etc.</li>
                        <li>• <strong>Automático:</strong> Clientes não poderão agendar nos períodos bloqueados</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="shadow-glow">
                <CardHeader>
                  <CardTitle>🔗 Integração Google Calendar</CardTitle>
                  <CardDescription>
                    Configure a conexão com o Google Calendar para sincronização automática dos agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status da Conexão */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${googleCalendarSettings.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">
                        Status: {googleCalendarSettings.connected ? 'Conectado' : 'Não Conectado'}
                        {googleCalendarSettings.email && (
                          <span className="text-sm text-muted-foreground ml-2">({googleCalendarSettings.email})</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {!googleCalendarSettings.connected ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Google Calendar não conectado</h4>
                          <p className="text-yellow-700 text-sm">
                            Configure suas credenciais e conecte com o Google Calendar para sincronização automática.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2">✅ Google Calendar Conectado!</h4>
                          <p className="text-green-700 text-sm">
                            Conectado com: <strong>{googleCalendarSettings.email}</strong>
                          </p>
                        </div>
                      )}

                      {/* Formulário de Credenciais */}
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const clientId = formData.get("google_client_id") as string;
                        const clientSecret = formData.get("google_client_secret") as string;
                        await saveGoogleCalendarSettings(clientId, clientSecret);
                      }}>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="google_client_id">Google Client ID</Label>
                            <Input
                              id="google_client_id"
                              name="google_client_id"
                              type="password"
                              defaultValue={googleCalendarSettings.client_id}
                              placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com"
                              className="font-mono text-sm"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="google_client_secret">Google Client Secret</Label>
                            <Input
                              id="google_client_secret"
                              name="google_client_secret"
                              type="password"
                              defaultValue={googleCalendarSettings.client_secret}
                              placeholder="Ex: GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
                              className="font-mono text-sm"
                              required
                            />
                          </div>
                        </div>

                        {/* Email Override */}
                        <div className="mb-4">
                          <Label htmlFor="override_email">📧 Seu Email</Label>
                          <Input
                            id="override_email"
                            name="override_email"
                            type="email"
                            defaultValue="okamichan2022@gmail.com"
                            placeholder="Seu email do Google Calendar"
                            className="font-mono text-sm"
                          />
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-3">
                          {!googleCalendarSettings.connected ? (
                            <>
                              <Button type="submit" variant="outline" disabled={isLoading}>
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Credenciais
                                  </>
                                )}
                              </Button>
                              <Button 
                                type="button" 
                                className="bg-blue-600 hover:bg-blue-700" 
                                onClick={() => connectGoogleCalendar(false)}
                                disabled={isLoading || !googleCalendarSettings.client_id}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Conectar com Google
                              </Button>
                            </>
                          ) : (
                            <Button 
                              type="button" 
                              variant="destructive"
                              onClick={disconnectGoogleCalendar}
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Desconectar
                            </Button>
                          )}
                          <Button type="button" variant="secondary" onClick={openGoogleCalendar}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir Google Calendar
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              console.log('🔍 DEBUG - Estado atual do Google Calendar:');
                              console.log('📋 googleCalendarSettings:', googleCalendarSettings);
                              console.log('💾 localStorage credentials:', localStorage.getItem('google_calendar_credentials'));
                              console.log('📧 localStorage email:', localStorage.getItem('google_calendar_email'));
                              
                              // Verificar se token está expirado
                              try {
                                const credentials = localStorage.getItem('google_calendar_credentials');
                                if (credentials) {
                                  const creds = JSON.parse(credentials);
                                  const now = Math.floor(Date.now() / 1000);
                                  const expiry = creds.expiry_date || creds.expires_at || 0;
                                  console.log('⏰ Token expira em:', new Date(expiry * 1000));
                                  console.log('🕐 Agora:', new Date());
                                  console.log(expiry > 0 && now > expiry ? '❌ TOKEN EXPIRADO!' : '✅ Token válido');
                                }
                              } catch (e) {
                                console.error('❌ Erro ao verificar token:', e);
                              }
                              
                              toast({
                                title: "🔍 Debug Info",
                                description: `Conectado: ${googleCalendarSettings.connected} | Email: ${googleCalendarSettings.email} | Veja console (F12)`,
                                duration: 5000,
                              });
                            }}
                          >
                            🔍 Debug Status
                          </Button>
                          <Button 
                            type="button" 
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              console.log('🧹 Limpando token expirado...');
                              localStorage.removeItem('google_calendar_credentials');
                              localStorage.removeItem('google_calendar_email');
                              setGoogleCredentials(null);
                              setGoogleCalendarSettings(prev => ({
                                ...prev,
                                connected: false,
                                email: ''
                              }));
                              
                              toast({
                                title: "🧹 Token Limpo",
                                description: "Credenciais removidas. Faça login novamente.",
                                variant: "destructive",
                              });
                            }}
                          >
                            🧹 Limpar Token
                          </Button>
                        </div>
                      </form>

                      {/* Informações Adicionais */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">ℹ️ Como Funciona</h4>
                        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                          <li>Quando você <strong>aprovar</strong> um agendamento, um evento será criado automaticamente no seu Google Calendar</li>
                          <li>Quando você <strong>cancelar</strong> um agendamento, o evento será removido do Google Calendar</li>
                          <li>Os eventos incluem: Nome do cliente, Serviço, Data/Hora, Duração e Informações de contato</li>
                          <li>Apenas você (admin) terá acesso aos eventos criados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="shadow-glow">
                <CardHeader>
                  <CardTitle>{t('admin.siteSettings')}</CardTitle>
                  <CardDescription>
                    Configure as informações que aparecem no site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Informações de Contato</h3>
                        
                        <div>
                          <Label htmlFor="contact_phone">{t('admin.contactPhone')}</Label>
                          <Input
                            id="contact_phone"
                            name="contact_phone"
                            defaultValue={siteSettings.contact_phone || ''}
                            placeholder="+33 (0) 00 00 00 00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_email">{t('admin.contactEmail')}</Label>
                          <Input
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            defaultValue={siteSettings.contact_email || ''}
                            placeholder="contact@touchedelumiere.fr"
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_address">Endereço</Label>
                          <Textarea
                            id="contact_address"
                            name="contact_address"
                            defaultValue={siteSettings.contact_address || ''}
                            placeholder="Endereço completo"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Títulos da Página Principal</h3>
                        
                        <div>
                          <Label htmlFor="hero_title_pt">Título (Português)</Label>
                          <Input
                            id="hero_title_pt"
                            name="hero_title_pt"
                            defaultValue={siteSettings.hero_title_pt || ''}
                            placeholder="Bem-estar para Corpo e Alma"
                          />
                        </div>

                        <div>
                          <Label htmlFor="hero_title_en">Título (English)</Label>
                          <Input
                            id="hero_title_en"
                            name="hero_title_en"
                            defaultValue={siteSettings.hero_title_en || ''}
                            placeholder="Wellness for Body and Soul"
                          />
                        </div>

                        <div>
                          <Label htmlFor="hero_title_fr">Título (Français)</Label>
                          <Input
                            id="hero_title_fr"
                            name="hero_title_fr"
                            defaultValue={siteSettings.hero_title_fr || ''}
                            placeholder="Bien-être pour le Corps et l'Âme"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Subtítulos da Página Principal</h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="hero_subtitle_pt">Subtítulo (Português)</Label>
                          <Textarea
                            id="hero_subtitle_pt"
                            name="hero_subtitle_pt"
                            defaultValue={siteSettings.hero_subtitle_pt || ''}
                            placeholder="Massagens terapêuticas, relaxamento e Reiki..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="hero_subtitle_en">Subtítulo (English)</Label>
                          <Textarea
                            id="hero_subtitle_en"
                            name="hero_subtitle_en"
                            defaultValue={siteSettings.hero_subtitle_en || ''}
                            placeholder="Therapeutic massages, relaxation and Reiki..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="hero_subtitle_fr">Subtítulo (Français)</Label>
                          <Textarea
                            id="hero_subtitle_fr"
                            name="hero_subtitle_fr"
                            defaultValue={siteSettings.hero_subtitle_fr || ''}
                            placeholder="Massages thérapeutiques, relaxation et Reiki..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSettingsLoading}>
                      {isSettingsLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de confirmação para deletar serviço */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este serviço? 
              Esta ação não pode ser desfeita. Os agendamentos vinculados a este serviço serão preservados com a informação "Serviço Removido".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => serviceToDelete && handleDeleteService(serviceToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de cancelamento de agendamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Cancelar Agendamento
            </DialogTitle>
            <DialogDescription>
              {selectedCancelApt && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Cliente:</strong> {selectedCancelApt.profiles?.full_name}<br/>
                    <strong>Serviço:</strong> {selectedCancelApt.services?.name_pt}<br/>
                    <strong>Data:</strong> {format(new Date(selectedCancelApt.date), "dd/MM/yyyy", { locale: ptBR })}<br/>
                    <strong>Horário:</strong> {selectedCancelApt.time}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Motivo do Cancelamento *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Ex: Emergência médica, reagendamento, indisponibilidade..."
                value={cancelReasonValue}
                onChange={(e) => setCancelReasonValue(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">O que fazer com este horário?</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="release-slot"
                    name="slot-action"
                    checked={releaseSlot}
                    onChange={() => setReleaseSlot(true)}
                  />
                  <Label htmlFor="release-slot" className="text-sm">
                    <span className="font-medium text-green-600">Liberar horário</span> - Outros clientes poderão agendar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="keep-blocked"
                    name="slot-action"
                    checked={!releaseSlot}
                    onChange={() => setReleaseSlot(false)}
                  />
                  <Label htmlFor="keep-blocked" className="text-sm">
                    <span className="font-medium text-red-600">Manter bloqueado</span> - Horário ficará indisponível
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Versão simplificada - apenas fechar dialog
                setCancelDialogOpen(false);
                toast({
                  title: "Funcionalidade Temporariamente Desativada",
                  description: "Sistema de cancelamento avançado será reativado em breve",
                });
              }}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Confirmar Cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
