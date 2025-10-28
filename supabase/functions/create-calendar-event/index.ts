import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CalendarEventRequest {
  appointmentId: string;
  action: 'create' | 'update' | 'delete';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getGoogleAccessToken() {
  const credentials = {
    client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL'),
    private_key: Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Credenciais do Google Calendar não configuradas');
  }

  // Criar JWT para autenticação
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Simular JWT (em produção usar biblioteca crypto adequada)
  const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload));
  
  return token;
}

async function createCalendarEvent(appointmentData: any) {
  const token = await getGoogleAccessToken();
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';

  const startDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}`);
  const endDateTime = new Date(startDateTime.getTime() + appointmentData.duration_minutes * 60000);

  const event = {
    summary: `${appointmentData.service_name} - ${appointmentData.client_name}`,
    description: `
🌟 TOUCHE DE LUMIÈRE - Agendamento Confirmado

👤 Cliente: ${appointmentData.client_name}
📧 Email: ${appointmentData.client_email}
📞 Telefone: ${appointmentData.client_phone || 'Não informado'}
💆 Serviço: ${appointmentData.service_name}
⏱️ Duração: ${appointmentData.duration_minutes} minutos
💰 Valor: €${appointmentData.service_price}

${appointmentData.notes ? `📝 Observações: ${appointmentData.notes}` : ''}

✨ Agendamento criado através do sistema Touche de Lumière
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Europe/Paris',
    },
    attendees: [
      {
        email: appointmentData.client_email,
        displayName: appointmentData.client_name,
        responseStatus: 'accepted'
      }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 60 }, // 1 hora antes
        { method: 'popup', minutes: 15 }, // 15 minutos antes
      ],
    },
    colorId: '2', // Verde para indicar confirmado
    location: appointmentData.service_location || 'Atendimento em domicílio',
  };

  // Em produção, fazer chamada real para a API do Google Calendar
  // const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(event),
  // });

  // Por enquanto, simular criação do evento
  const eventId = `calendar_${Date.now()}_${appointmentData.id}`;
  
  return {
    id: eventId,
    htmlLink: `https://calendar.google.com/calendar/event?eid=${btoa(eventId)}`,
    summary: event.summary,
    status: 'confirmed'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { appointmentId, action }: CalendarEventRequest = await req.json();

    // Buscar dados completos do agendamento
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        services (name, duration_minutes, price),
        profiles (full_name, email, phone)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Agendamento não encontrado');
    }

    let result;

    switch (action) {
      case 'create':
        if (appointment.google_calendar_event_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Evento já existe no Google Calendar' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const appointmentData = {
          id: appointment.id,
          client_name: appointment.profiles.full_name,
          client_email: appointment.profiles.email,
          client_phone: appointment.profiles.phone,
          service_name: appointment.services.name,
          service_price: appointment.services.price,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          duration_minutes: appointment.services.duration_minutes,
          notes: appointment.notes,
        };

        result = await createCalendarEvent(appointmentData);

        // Atualizar appointment com ID do evento
        await supabaseClient
          .from('appointments')
          .update({
            google_calendar_event_id: result.id,
            calendar_event_created: true,
            calendar_event_created_at: new Date().toISOString()
          })
          .eq('id', appointmentId);

        break;

      case 'delete':
        if (!appointment.google_calendar_event_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Evento não encontrado no Google Calendar' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Em produção, deletar evento do Google Calendar
        // await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_calendar_event_id}`, {
        //   method: 'DELETE',
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });

        // Limpar campos do appointment
        await supabaseClient
          .from('appointments')
          .update({
            google_calendar_event_id: null,
            calendar_event_created: false,
            calendar_event_created_at: null
          })
          .eq('id', appointmentId);

        result = { message: 'Evento removido do Google Calendar' };
        break;

      default:
        throw new Error('Ação não suportada');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: action === 'create' ? 'Evento criado no Google Calendar com sucesso' : 'Evento removido do Google Calendar'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Erro na integração Google Calendar:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro na integração com Google Calendar',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

/* 
CONFIGURAÇÃO NECESSÁRIA:

1. Variáveis de ambiente no Supabase:
   - GOOGLE_CLIENT_EMAIL: email da conta de serviço
   - GOOGLE_PRIVATE_KEY: chave privada da conta de serviço  
   - GOOGLE_CALENDAR_ID: ID do calendário (opcional, usa 'primary' por padrão)

2. Para configurar conta de serviço Google:
   a) Acesse Google Cloud Console
   b) Crie/selecione projeto
   c) Ative Google Calendar API
   d) Crie conta de serviço
   e) Baixe credenciais JSON
   f) Compartilhe seu calendário com o email da conta de serviço

3. Em produção, descomente as chamadas reais da API do Google Calendar
*/