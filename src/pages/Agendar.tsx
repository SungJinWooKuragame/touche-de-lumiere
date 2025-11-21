import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Agendar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [busySlots, setBusySlots] = useState<Array<{ start_time: string; end_time: string }>>([]);
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [dateBlocks, setDateBlocks] = useState<any[]>([]);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  useEffect(() => {
    checkUser();
    loadServices();
    loadOperatingHours();
    loadDateBlocks();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadBusySlots(selectedDate);
    }
  }, [selectedDate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviços",
        description: error.message,
      });
    } else {
      setServices(data || []);
    }
  };

  const getServiceName = (service: any) => {
    const lang = i18n.language;
    switch (lang) {
      case 'en':
        return service.name_en || service.name_pt || service.name;
      case 'fr':
        return service.name_fr || service.name_pt || service.name;
      default:
        return service.name_pt || service.name;
    }
  };

  const loadBusySlots = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase.rpc("get_busy_time_slots", {
      p_date: dateStr,
    });

    if (error) {
      console.error("Erro ao carregar horários ocupados:", error);
      setBusySlots([]);
    } else {
      setBusySlots(data || []);
    }
  };

  const loadOperatingHours = async () => {
    try {
      // Buscar do banco primeiro
      const { data, error } = await (supabase as any)
        .from('operating_hours')
        .select('*')
        .order('day_of_week');

      if (error) {
        console.warn('⚠️ Falha ao carregar horários do banco, usando fallback localStorage:', error.message);
        const saved = localStorage.getItem('operatingHours');
        if (saved) setOperatingHours(JSON.parse(saved));
      } else if (data) {
        const normalized = (data || []).map((h: any) => ({
          day_of_week: h.day_of_week,
          is_open: h.is_open,
          open_time: h.open_time ? String(h.open_time).slice(0,5) : null,
          close_time: h.close_time ? String(h.close_time).slice(0,5) : null,
        }));
        setOperatingHours(normalized);
        localStorage.setItem('operatingHours', JSON.stringify(normalized));
      }
    } catch (error) {
      console.error('Erro ao carregar horários de funcionamento:', error);
    }
  };

  const loadDateBlocks = async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await (supabase as any)
        .from('date_blocks')
        .select('*')
        .gte('end_date', todayStr)
        .order('start_date', { ascending: true });

      if (error) {
        console.warn('⚠️ Falha ao carregar bloqueios do banco, usando fallback localStorage:', error.message);
        const saved = localStorage.getItem('dateBlocks');
        if (saved) setDateBlocks(JSON.parse(saved));
      } else if (data) {
        const mapped = (data || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          startDate: b.start_date,
          endDate: b.end_date,
          startTime: b.start_time ? String(b.start_time).slice(0,5) : '',
          endTime: b.end_time ? String(b.end_time).slice(0,5) : '',
          allDay: !b.start_time && !b.end_time,
        }));
        setDateBlocks(mapped);
        localStorage.setItem('dateBlocks', JSON.stringify(mapped));
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueios de data:', error);
    }
  };

  const isTimeSlotAvailable = (time: string) => {
    if (!selectedService || !selectedDate) return true;

    const selectedServiceData = services.find((s) => s.id === selectedService);
    if (!selectedServiceData) return true;

    const durationMinutes = selectedServiceData.duration_minutes;
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = hours * 60 + minutes;
    const slotEnd = slotStart + durationMinutes;

    // 🐛 DEBUG: Log do slot sendo verificado
    const debugInfo = {
      time,
      slotStart: `${Math.floor(slotStart/60)}:${String(slotStart%60).padStart(2,'0')}`,
      slotEnd: `${Math.floor(slotEnd/60)}:${String(slotEnd%60).padStart(2,'0')}`,
      date: selectedDate.toISOString().split('T')[0],
      totalBlocks: dateBlocks.length
    };
    console.log('🔍 Verificando slot:', debugInfo);
    
    // 🐛 DEBUG: Mostrar todos os bloqueios carregados
    if (dateBlocks.length > 0) {
      console.log('📋 Bloqueios carregados:', dateBlocks.map(b => ({
        title: b.title,
        startDate: b.startDate,
        endDate: b.endDate,
        startTime: b.startTime,
        endTime: b.endTime
      })));
    }

    // 🕐 VERIFICAR SE É HOJE E SE O HORÁRIO JÁ PASSOU
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (isToday) {
      const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();
      // Adicionar margem de 30 minutos para preparação
      const minimumTimeMinutes = currentTimeMinutes + 30;
      
      if (slotStart < minimumTimeMinutes) {
        return false; // Horário já passou ou muito próximo
      }
    }

    // 🏆 PRIORIDADE 1: CONSULTAS EXISTENTES (PRIORIDADE MÁXIMA)
    // Consultas já agendadas têm prioridade absoluta e nunca são bloqueadas
    // Só podem ser removidas por cancelamento manual
    const hasExistingAppointment = busySlots.some((busy) => {
      const [busyStartHours, busyStartMinutes] = busy.start_time.split(":").map(Number);
      const [busyEndHours, busyEndMinutes] = busy.end_time.split(":").map(Number);
      const busyStart = busyStartHours * 60 + busyStartMinutes;
      const busyEnd = busyEndHours * 60 + busyEndMinutes;

      // Check for overlap: slot overlaps if it starts before busy ends AND ends after busy starts
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    if (hasExistingAppointment) {
      return false; // Já existe consulta agendada - NUNCA pode ser sobrescrita
    }

    // 🕐 PRIORIDADE 2: HORÁRIOS DE FUNCIONAMENTO
    // Só afeta NOVOS agendamentos (não remove consultas existentes)
    const dayOfWeek = selectedDate.getDay();
    const operatingHour = operatingHours.find(oh => oh.day_of_week === dayOfWeek);
    
    if (operatingHour && !operatingHour.is_open) {
      return false; // Fechado neste dia
    }
    
    if (operatingHour && operatingHour.is_open && operatingHour.open_time && operatingHour.close_time) {
      const [openHours, openMinutes] = operatingHour.open_time.split(":").map(Number);
      const [closeHours, closeMinutes] = operatingHour.close_time.split(":").map(Number);
      const openTime = openHours * 60 + openMinutes;
      const closeTime = closeHours * 60 + closeMinutes;
      
      // Permitir agendamentos que INICIEM dentro do horário de funcionamento
      if (slotStart < openTime || slotStart >= closeTime) {
        return false; // Início do agendamento fora do horário de funcionamento
      }
    }

    // 🚫 PRIORIDADE 3: BLOQUEIOS DE DATA/HORA (MENOR PRIORIDADE)
    // Só afeta NOVOS agendamentos (consultas existentes são mantidas)
    const isBlocked = dateBlocks.some((block) => {
      // Normalizar todas as datas para meia-noite (00:00:00) para comparação precisa de dias
      const blockStartDate = new Date(block.startDate);
      blockStartDate.setHours(0, 0, 0, 0);
      
      const blockEndDate = new Date(block.endDate);
      blockEndDate.setHours(0, 0, 0, 0);
      
      const selectedDateNormalized = new Date(selectedDate);
      selectedDateNormalized.setHours(0, 0, 0, 0);
      
      // 🐛 DEBUG: Log da comparação de datas
      console.log('📅 Comparação de datas:', {
        blockTitle: block.title,
        blockStart: blockStartDate.toISOString().split('T')[0],
        blockEnd: blockEndDate.toISOString().split('T')[0],
        selectedDate: selectedDateNormalized.toISOString().split('T')[0],
        blockStartTimestamp: blockStartDate.getTime(),
        blockEndTimestamp: blockEndDate.getTime(),
        selectedTimestamp: selectedDateNormalized.getTime(),
        isInRange: selectedDateNormalized >= blockStartDate && selectedDateNormalized <= blockEndDate
      });
      
      // Verificar se a data selecionada está dentro do período de bloqueio (inclusive)
      const dateInRange = selectedDateNormalized >= blockStartDate && selectedDateNormalized <= blockEndDate;
      
      if (!dateInRange) {
        return false; // Data fora do período de bloqueio
      }
      
      // Se chegou aqui, a data está no período do bloqueio
      
      // 🎯 DETERMINAR TIPO DE BLOQUEIO BASEADO NA POSIÇÃO DO DIA NO PERÍODO
      const isFirstDay = selectedDateNormalized.getTime() === blockStartDate.getTime();
      const isLastDay = selectedDateNormalized.getTime() === blockEndDate.getTime();
      const isMiddleDay = !isFirstDay && !isLastDay;
      const isSingleDay = blockStartDate.getTime() === blockEndDate.getTime();
      
      // Se é bloqueio de dia inteiro (sem horários específicos)
      if (block.allDay || (!block.startTime && !block.endTime)) {
        return true; // Bloquear o dia inteiro
      }
      
      // Se é bloqueio de horário específico
      if (block.startTime && block.endTime) {
        const [blockStartHours, blockStartMinutes] = block.startTime.split(":").map(Number);
        const [blockEndHours, blockEndMinutes] = block.endTime.split(":").map(Number);
        const blockStartTime = blockStartHours * 60 + blockStartMinutes;
        const blockEndTime = blockEndHours * 60 + blockEndMinutes;
        
        let effectiveStartTime: number;
        let effectiveEndTime: number;
        
        // 📅 REGRA: Determinar horários efetivos baseado na posição do dia
        if (isSingleDay) {
          // Bloqueio de dia único: aplicar horários exatos
          effectiveStartTime = blockStartTime;
          effectiveEndTime = blockEndTime;
        } else if (isFirstDay) {
          // PRIMEIRO DIA: bloquear do horário inicial até o fim do dia (23:59)
          effectiveStartTime = blockStartTime;
          effectiveEndTime = 24 * 60; // 23:59 (1440 minutos)
        } else if (isLastDay) {
          // ÚLTIMO DIA: bloquear do início do dia (00:00) até o horário final
          effectiveStartTime = 0; // 00:00
          effectiveEndTime = blockEndTime;
        } else {
          // DIAS INTERMEDIÁRIOS: bloquear o dia inteiro (00:00 às 23:59)
          effectiveStartTime = 0; // 00:00
          effectiveEndTime = 24 * 60; // 23:59 (1440 minutos)
        }
        
        // Verificar sobreposição: slot sobrepõe se:
        // - slot inicia antes do bloqueio efetivo terminar E
        // - slot termina depois do bloqueio efetivo iniciar
        const overlaps = slotStart < effectiveEndTime && slotEnd > effectiveStartTime;
        
        // 🐛 DEBUG: Log detalhado do bloqueio
        console.log('🚫 Verificando bloqueio parcial:', {
          blockTitle: block.title,
          blockDate: `${block.startDate} - ${block.endDate}`,
          blockTime: `${block.startTime} - ${block.endTime}`,
          dayPosition: isSingleDay ? '🔵 Dia Único' : isFirstDay ? '🟢 Primeiro Dia' : isLastDay ? '🔴 Último Dia' : '🟡 Dia Intermediário',
          originalBlockTime: `${blockStartTime} a ${blockEndTime}`,
          effectiveBlockTime: `${effectiveStartTime} a ${effectiveEndTime}`,
          slotTime: `${slotStart} a ${slotEnd}`,
          overlaps,
          calculation: `slot(${slotStart} a ${slotEnd}) vs block efetivo(${effectiveStartTime} a ${effectiveEndTime})`
        });
        
        return overlaps;
      }
      
      return false;
    });
    
    if (isBlocked) {
      return false; // Horário bloqueado para NOVOS agendamentos
    }

    // ✅ HORÁRIO DISPONÍVEL PARA NOVO AGENDAMENTO
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: t('booking.requiredFields'),
        description: t('booking.fillAllFields'),
      });
      return;
    }

    if (!isTimeSlotAvailable(selectedTime)) {
      toast({
        variant: "destructive",
        title: t('booking.conflictError'),
        description: t('booking.conflictDesc'),
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from("appointments")
      .insert({
        client_id: user.id,
        service_id: selectedService,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        notes: notes || null,
        status: "pending",
      });

    if (error) {
      toast({
        variant: "destructive",
        title: t('booking.error'),
        description: error.message,
      });
    } else {
      toast({
        title: t('booking.success'),
        description: t('booking.successDesc'),
      });
      navigate("/perfil");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{t('booking.title')}</h1>
          
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle>{t('booking.newConsultation')}</CardTitle>
              <CardDescription>
                {t('booking.consultationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="service">{t('booking.selectService')}</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder={t('booking.selectService')} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {getServiceName(service)} - {service.duration_minutes}min - € {service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('booking.selectDate')}</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      // Permitir a partir de hoje (não apenas de amanhã)
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    locale={ptBR}
                    className="rounded-md border shadow-soft"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('booking.selectTime')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => {
                      const available = isTimeSlotAvailable(time);
                      return (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          disabled={!available || !selectedDate || !selectedService}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('booking.notes')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('booking.notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('booking.loading')}
                    </>
                  ) : (
                    t('booking.submit')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
