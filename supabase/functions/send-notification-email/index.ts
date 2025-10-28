import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: 'appointment_confirmation' | 'appointment_cancellation' | 'password_reset' | 'appointment_reminder';
  data: {
    clientName: string;
    serviceName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    cancellationReason?: string;
    resetLink?: string;
    ownerPhone?: string;
    appointmentId?: string;
  };
}

const getEmailTemplate = (type: string, data: any) => {
  const templates = {
    appointment_confirmation: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #9b87f5; margin: 0; font-size: 28px;">✨ Consulta Confirmada!</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Olá <strong>${data.clientName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Sua consulta foi confirmada com sucesso! Estamos ansiosos para te receber.
          </p>
          
          <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #9b87f5;">
            <h3 style="color: #9b87f5; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes da Consulta</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🌿 Serviço:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Data:</strong> ${new Date(data.appointmentDate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Horário:</strong> ${data.appointmentTime}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #2e7d32; margin: 0 0 10px 0;">📍 Como chegar:</h4>
            <p style="margin: 5px 0; color: #333;">R. Manuel Martins, 2785 - Zona 7</p>
            <p style="margin: 5px 0; color: #333;">Maringá - PR, 87030-000</p>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #f57c00; margin: 0 0 10px 0;">💬 Contato para dúvidas:</h4>
            <p style="margin: 5px 0; color: #333;">WhatsApp: ${data.ownerPhone || '+55 (44) 9999-9999'}</p>
            <p style="margin: 5px 0; color: #333; font-size: 14px;">
              <em>Caso precise cancelar ou reagendar, entre em contato com pelo menos 2 horas de antecedência.</em>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Obrigado por confiar em nossos serviços.<br>
              <strong style="color: #9b87f5;">Touche de Lumière - Massagens Terapêuticas</strong>
            </p>
          </div>
        </div>
      </div>
    `,
    
    appointment_cancellation: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">😔 Consulta Cancelada</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Olá <strong>${data.clientName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Infelizmente, precisamos cancelar sua consulta agendada. Pedimos desculpas pelo inconveniente.
          </p>
          
          <div style="background: #fff5f5; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #e74c3c;">
            <h3 style="color: #e74c3c; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes da Consulta Cancelada</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🌿 Serviço:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Data:</strong> ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Horário:</strong> ${data.appointmentTime}</p>
          </div>
          
          ${data.cancellationReason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Motivo do cancelamento:</h4>
            <p style="margin: 0; color: #333; font-style: italic;">${data.cancellationReason}</p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0;">🔄 Reagendar Consulta</h4>
            <p style="margin: 5px 0; color: #333;">
              Para reagendar sua sessão, você pode:
            </p>
            <ul style="color: #333; padding-left: 20px;">
              <li>Acessar nosso site e escolher um novo horário</li>
              <li>Entrar em contato pelo WhatsApp: ${data.ownerPhone || '+55 (44) 9999-9999'}</li>
              <li>Responder este email com sua preferência de data/horário</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Agradecemos sua compreensão.<br>
              <strong style="color: #9b87f5;">Touche de Lumière - Massagens Terapêuticas</strong>
            </p>
          </div>
        </div>
      </div>
    `,
    
    password_reset: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #9b87f5; margin: 0; font-size: 28px;">🔐 Redefinir Senha</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Olá <strong>${data.clientName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" 
               style="background: linear-gradient(135deg, #9b87f5 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(155, 135, 245, 0.3);">
              Redefinir Minha Senha
            </a>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #f57c00; margin: 0 0 10px 0;">⚠️ Importante:</h4>
            <ul style="color: #333; margin: 0; padding-left: 20px;">
              <li>Este link expira em 24 horas</li>
              <li>Se você não solicitou esta alteração, ignore este email</li>
              <li>Para sua segurança, use uma senha forte (mín. 8 caracteres)</li>
            </ul>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Link alternativo:</strong><br>
              <span style="word-break: break-all;">${data.resetLink}</span>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong style="color: #9b87f5;">Touche de Lumière - Massagens Terapêuticas</strong><br>
              Segurança e bem-estar em primeiro lugar.
            </p>
          </div>
        </div>
      </div>
    `,
    
    appointment_reminder: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0984e3; margin: 0; font-size: 28px;">⏰ Lembrete de Consulta</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Olá <strong>${data.clientName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Este é um lembrete amigável da sua consulta que está chegando!
          </p>
          
          <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d1ecf1 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #0984e3;">
            <h3 style="color: #0984e3; margin: 0 0 15px 0; font-size: 18px;">📋 Sua Consulta é Amanhã!</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🌿 Serviço:</strong> ${data.serviceName}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Data:</strong> ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Horário:</strong> ${data.appointmentTime}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #2e7d32; margin: 0 0 10px 0;">📍 Localização:</h4>
            <p style="margin: 5px 0; color: #333;">R. Manuel Martins, 2785 - Zona 7</p>
            <p style="margin: 5px 0; color: #333;">Maringá - PR, 87030-000</p>
          </div>
          
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #f57c00; margin: 0 0 10px 0;">💡 Dicas para sua sessão:</h4>
            <ul style="color: #333; margin: 5px 0; padding-left: 20px;">
              <li>Chegue 5-10 minutos antes do horário</li>
              <li>Use roupas confortáveis</li>
              <li>Evite refeições pesadas 1h antes</li>
              <li>Traga uma garrafinha de água</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Nos vemos em breve!<br>
              <strong style="color: #9b87f5;">Touche de Lumière - Massagens Terapêuticas</strong>
            </p>
          </div>
        </div>
      </div>
    `
  };
  
  return templates[type] || templates.appointment_confirmation;
};

const getEmailSubject = (type: string, data: any) => {
  const subjects = {
    appointment_confirmation: `✨ Consulta Confirmada - ${data.serviceName} - ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}`,
    appointment_cancellation: `😔 Consulta Cancelada - ${data.serviceName} - ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}`,
    password_reset: `🔐 Redefinir Senha - Touche de Lumière`,
    appointment_reminder: `⏰ Lembrete: Sua consulta é amanhã - ${data.serviceName}`
  };
  
  return subjects[type] || 'Notificação - Touche de Lumière';
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, to);

    const emailResponse = await resend.emails.send({
      from: "Touche de Lumière <noreply@touchedelumiere.com>",
      to: [to],
      subject: getEmailSubject(type, data),
      html: getEmailTemplate(type, data),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      type 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error(`Error sending email:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);