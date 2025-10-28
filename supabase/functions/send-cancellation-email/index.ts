import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  clientEmail: string;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  cancellationReason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      clientName, 
      serviceName, 
      appointmentDate, 
      appointmentTime, 
      cancellationReason 
    }: CancellationEmailRequest = await req.json();

    console.log("Sending cancellation email to:", clientEmail);

    const emailResponse = await resend.emails.send({
      from: "Massagens Terapêuticas <onboarding@resend.dev>",
      to: [clientEmail],
      subject: "Consulta Cancelada - Reagende sua Sessão",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #9b87f5;">Consulta Cancelada</h1>
          <p>Olá ${clientName},</p>
          
          <p>Infelizmente, sua consulta foi cancelada:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Serviço:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(appointmentDate).toLocaleDateString('pt-BR')}</p>
            <p style="margin: 5px 0;"><strong>Horário:</strong> ${appointmentTime}</p>
          </div>
          
          <p><strong>Motivo do cancelamento:</strong></p>
          <p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0;">
            ${cancellationReason}
          </p>
          
          <p>Por favor, entre em contato conosco para reagendar sua sessão ou acesse nosso site para escolher um novo horário.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br>Equipe de Massagens Terapêuticas</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending cancellation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
