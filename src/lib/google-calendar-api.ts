// Integração REAL com Google Calendar API
// Este arquivo implementa a criação/deleção de eventos usando as credenciais OAuth

export class GoogleCalendarAPI {
  private accessToken: string = '';
  private clientId: string = '';
  private clientSecret: string = '';

  constructor(credentials: { client_id: string; client_secret: string; access_token?: string }) {
    this.clientId = credentials.client_id;
    this.clientSecret = credentials.client_secret;
    this.accessToken = credentials.access_token || '';
  }

  // Criar evento no Google Calendar
  async createEvent(eventData: {
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    attendeeEmail?: string;
    attendeeName?: string;
  }) {
    try {
      if (!this.accessToken) {
        throw new Error('Token de acesso não configurado. Reconecte com o Google Calendar.');
      }

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'Europe/Lisbon'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'Europe/Lisbon'
        },
        attendees: eventData.attendeeEmail ? [{
          email: eventData.attendeeEmail,
          displayName: eventData.attendeeName || eventData.attendeeEmail
        }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 horas antes
            { method: 'popup', minutes: 60 }    // 1 hora antes
          ]
        },
        colorId: '2' // Verde claro para destacar
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro da API do Google: ${error.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      
      console.log('✅ Evento criado no Google Calendar:', {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start.dateTime,
        link: createdEvent.htmlLink
      });

      return {
        success: true,
        eventId: createdEvent.id,
        eventLink: createdEvent.htmlLink,
        message: `Evento "${eventData.title}" criado com sucesso!`
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar evento:', error);
      
      if (error.message.includes('401')) {
        throw new Error('Token expirado. Reconecte com o Google Calendar.');
      }
      
      throw new Error(`Falha ao criar evento: ${error.message}`);
    }
  }

  // Deletar evento do Google Calendar
  async deleteEvent(eventId: string) {
    try {
      if (!this.accessToken) {
        throw new Error('Token de acesso não configurado.');
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.json();
        throw new Error(`Erro da API do Google: ${error.error?.message || response.statusText}`);
      }

      console.log('🗑️ Evento deletado do Google Calendar:', eventId);

      return {
        success: true,
        message: 'Evento removido do Google Calendar!'
      };

    } catch (error: any) {
      console.error('❌ Erro ao deletar evento:', error);
      throw new Error(`Falha ao deletar evento: ${error.message}`);
    }
  }

  // Verificar se o token ainda é válido
  async validateToken() {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Renovar token de acesso usando refresh token
  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao renovar token');
      }

      const tokens = await response.json();
      this.accessToken = tokens.access_token;

      return {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in
      };

    } catch (error: any) {
      throw new Error(`Erro ao renovar token: ${error.message}`);
    }
  }
}