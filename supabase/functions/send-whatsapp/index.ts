import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppRequest {
  to: string; // número do telefone no formato +5544999999999
  type: 'appointment_confirmation' | 'appointment_cancellation' | 'appointment_reminder';
  data: {
    clientName: string;
    serviceName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    cancellationReason?: string;
    ownerPhone?: string;
  };
}

const getWhatsAppMessage = (type: string, data: any) => {
  const messages = {
    appointment_confirmation: `✨ *CONSULTA CONFIRMADA* ✨

Olá *${data.clientName}*! 

Sua consulta foi confirmada com sucesso! 🎉

📋 *DETALHES DA CONSULTA*
🌿 *Serviço:* ${data.serviceName}
📅 *Data:* ${new Date(data.appointmentDate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ *Horário:* ${data.appointmentTime}

📍 *LOCALIZAÇÃO*
R. Manuel Martins, 2785 - Zona 7
Maringá - PR, 87030-000

💡 *DICAS PARA SUA SESSÃO:*
• Chegue 5-10 min antes
• Use roupas confortáveis
• Evite refeições pesadas 1h antes
• Traga uma garrafinha de água

🔄 *Precisa cancelar ou reagendar?*
Entre em contato com pelo menos 2h de antecedência.

Obrigado por confiar em nossos serviços! 🙏

*Touche de Lumière - Massagens Terapêuticas*`,

    appointment_cancellation: `😔 *CONSULTA CANCELADA*

Olá *${data.clientName}*,

Infelizmente precisamos cancelar sua consulta:

📋 *DETALHES DA CONSULTA CANCELADA*
🌿 *Serviço:* ${data.serviceName}
📅 *Data:* ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${data.appointmentTime}

${data.cancellationReason ? `📝 *Motivo:* ${data.cancellationReason}` : ''}

🔄 *REAGENDAR SUA CONSULTA*
Para reagendar, você pode:
• Responder esta mensagem
• Acessar nosso site
• Ligar: ${data.ownerPhone || '+55 (44) 9999-9999'}

Pedimos desculpas pelo inconveniente! 🙏

*Touche de Lumière - Massagens Terapêuticas*`,

    appointment_reminder: `⏰ *LEMBRETE DE CONSULTA*

Olá *${data.clientName}*!

Sua consulta é *AMANHÃ*! 📅

📋 *DETALHES*
🌿 *Serviço:* ${data.serviceName}
📅 *Data:* ${new Date(data.appointmentDate).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${data.appointmentTime}

📍 *LOCALIZAÇÃO*
R. Manuel Martins, 2785 - Zona 7
Maringá - PR, 87030-000

💡 *PREPARE-SE:*
• Chegue 5-10 min antes
• Roupas confortáveis
• Hidrate-se bem
• Evite refeições pesadas

Nos vemos em breve! ✨

*Touche de Lumière - Massagens Terapêuticas*`
  };
  
  return messages[type as keyof typeof messages] || messages.appointment_confirmation;
};

const sendWhatsAppMessage = async (to: string, message: string) => {
  const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    throw new Error("WhatsApp credentials not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ''), // Remove caracteres não numéricos
        text: { body: message },
        type: "text"
      }),
    }
  );

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
  }
  
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: WhatsAppRequest = await req.json();

    console.log(`Sending WhatsApp ${type} to:`, to);

    // Verificar se o número tem o formato correto (+5544999999999)
    if (!to.startsWith('+') || to.length < 10) {
      throw new Error('Número de telefone inválido. Use o formato: +5544999999999');
    }

    const message = getWhatsAppMessage(type, data);
    const whatsappResponse = await sendWhatsAppMessage(to, message);

    console.log("WhatsApp message sent successfully:", whatsappResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: whatsappResponse.messages?.[0]?.id,
      type,
      to 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error(`Error sending WhatsApp message:`, error);
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