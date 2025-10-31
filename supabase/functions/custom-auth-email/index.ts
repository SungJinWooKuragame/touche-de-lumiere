import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'signup' | 'reset_password' | 'email_change';
  confirmationUrl: string;
  language?: string;
  userName?: string;
}

// Traduções para os templates de email
const translations = {
  pt: {
    subject: "✨ Confirme seu cadastro - Touche de Lumière",
    title: "Confirme seu cadastro",
    greeting: "Olá! Bem-vindo ao Touche de Lumière",
    message: "Para completar seu cadastro e começar a agendar suas sessões de bem-estar, clique no link abaixo:",
    confirmButton: "Confirmar meu email",
    footer: "Obrigado por escolher nossos serviços de massagem terapêutica e Reiki.",
    signature: "Equipe Touche de Lumière",
    note: "Se você não criou esta conta, pode ignorar este email.",
    alternativeText: "Se o botão não funcionar, copie e cole este link no seu navegador:",
    brandName: "Touche de Lumière"
  },
  en: {
    subject: "✨ Confirm your signup - Touche de Lumière",
    title: "Confirm your signup",
    greeting: "Hello! Welcome to Touche de Lumière",
    message: "To complete your registration and start booking your wellness sessions, click the link below:",
    confirmButton: "Confirm my email",
    footer: "Thank you for choosing our therapeutic massage and Reiki services.",
    signature: "Touche de Lumière Team",
    note: "If you didn't create this account, you can safely ignore this email.",
    alternativeText: "If the button doesn't work, copy and paste this link into your browser:",
    brandName: "Touche de Lumière"
  },
  fr: {
    subject: "✨ Confirmez votre inscription - Touche de Lumière",
    title: "Confirmez votre inscription",
    greeting: "Bonjour ! Bienvenue chez Touche de Lumière",
    message: "Pour finaliser votre inscription et commencer à réserver vos séances de bien-être, cliquez sur le lien ci-dessous :",
    confirmButton: "Confirmer mon email",
    footer: "Merci d'avoir choisi nos services de massage thérapeutique et Reiki.",
    signature: "Équipe Touche de Lumière",
    note: "Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.",
    alternativeText: "Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :",
    brandName: "Touche de Lumière"
  }
};

const getEmailTemplate = (language: string, confirmationUrl: string, userName?: string) => {
  const t = translations[language as keyof typeof translations] || translations.pt;
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
        <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
          <!-- Header com logo e marca -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; padding: 15px 25px; background: linear-gradient(135deg, #9b87f5 0%, #764ba2 100%); border-radius: 50px; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px;">✨</span>
            </div>
            <h1 style="color: #9b87f5; margin: 0; font-size: 32px; font-weight: 300;">${t.brandName}</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Massagem Terapêutica & Reiki</p>
          </div>
          
          <!-- Conteúdo principal -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 28px; font-weight: 300;">${t.title}</h2>
            ${userName ? `<p style="font-size: 18px; color: #333; margin-bottom: 25px;">${t.greeting.replace('Olá!', `Olá, ${userName}!`).replace('Hello!', `Hello, ${userName}!`).replace('Bonjour !', `Bonjour, ${userName} !`)}</p>` : `<p style="font-size: 18px; color: #333; margin-bottom: 25px;">${t.greeting}</p>`}
          </div>
          
          <!-- Mensagem -->
          <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%); padding: 30px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #9b87f5;">
            <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0; text-align: center;">
              ${t.message}
            </p>
          </div>
          
          <!-- Botão de confirmação -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #9b87f5 0%, #764ba2 100%); 
                      color: white; 
                      padding: 18px 40px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-weight: 600; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 8px 25px rgba(155, 135, 245, 0.4);
                      transition: all 0.3s ease;">
              ${t.confirmButton}
            </a>
          </div>
          
          <!-- Link alternativo -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: 600;">${t.alternativeText}</p>
            <p style="margin: 0; color: #333; font-size: 13px; word-break: break-all; line-height: 1.4;">
              <a href="${confirmationUrl}" style="color: #9b87f5; text-decoration: none;">${confirmationUrl}</a>
            </p>
          </div>
          
          <!-- Informações da empresa -->
          <div style="background: #e8f5e8; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <div style="text-align: center;">
              <h4 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px;">📍 Nossa Localização</h4>
              <p style="margin: 5px 0; color: #333; font-size: 14px;">R. Manuel Martins, 2785 - Zona 7</p>
              <p style="margin: 5px 0; color: #333; font-size: 14px;">Maringá - PR, 87030-000</p>
              <p style="margin: 15px 0 5px 0; color: #333; font-size: 14px;">📱 WhatsApp: +55 (44) 9999-9999</p>
            </div>
          </div>
          
          <!-- Rodapé -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
              ${t.footer}
            </p>
            <p style="color: #999; font-size: 12px; margin: 0 0 20px 0; font-style: italic;">
              ${t.note}
            </p>
            <div style="margin-top: 25px;">
              <p style="color: #9b87f5; font-weight: 600; font-size: 16px; margin: 0;">
                ${t.signature}
              </p>
              <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
                Bem-estar para Corpo e Alma ✨
              </p>
            </div>
          </div>
        </div>
        
        <!-- Rodapé externo -->
        <div style="text-align: center; padding: 20px 0; color: rgba(255,255,255,0.8); font-size: 12px;">
          © 2024 ${t.brandName}. Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPasswordResetTemplate = (language: string, resetUrl: string, userName?: string) => {
  const t = {
    pt: {
      subject: "🔐 Redefinir Senha - Touche de Lumière",
      title: "Redefinir sua senha",
      greeting: "Olá! Recebemos uma solicitação para redefinir sua senha",
      message: "Para criar uma nova senha para sua conta no Touche de Lumière, clique no link abaixo:",
      confirmButton: "Redefinir minha senha",
      footer: "Este link expira em 24 horas por segurança.",
      signature: "Equipe Touche de Lumière",
      note: "Se você não solicitou esta alteração, pode ignorar este email.",
      security: "Para sua segurança, use uma senha forte com pelo menos 8 caracteres."
    },
    en: {
      subject: "🔐 Reset Password - Touche de Lumière",
      title: "Reset your password",
      greeting: "Hello! We received a request to reset your password",
      message: "To create a new password for your Touche de Lumière account, click the link below:",
      confirmButton: "Reset my password",
      footer: "This link expires in 24 hours for security.",
      signature: "Touche de Lumière Team",
      note: "If you didn't request this change, you can safely ignore this email.",
      security: "For your security, use a strong password with at least 8 characters."
    },
    fr: {
      subject: "🔐 Réinitialiser le mot de passe - Touche de Lumière",
      title: "Réinitialiser votre mot de passe",
      greeting: "Bonjour ! Nous avons reçu une demande pour réinitialiser votre mot de passe",
      message: "Pour créer un nouveau mot de passe pour votre compte Touche de Lumière, cliquez sur le lien ci-dessous :",
      confirmButton: "Réinitialiser mon mot de passe",
      footer: "Ce lien expire dans 24 heures pour des raisons de sécurité.",
      signature: "Équipe Touche de Lumière",
      note: "Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet email.",
      security: "Pour votre sécurité, utilisez un mot de passe fort avec au moins 8 caractères."
    }
  };

  const trans = t[language as keyof typeof t] || t.pt;
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${trans.subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); border-radius: 15px;">
        <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; padding: 15px 25px; background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); border-radius: 50px; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px;">🔐</span>
            </div>
            <h1 style="color: #ff7e5f; margin: 0; font-size: 32px; font-weight: 300;">Touche de Lumière</h1>
          </div>
          
          <!-- Conteúdo -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 28px; font-weight: 300;">${trans.title}</h2>
            <p style="font-size: 18px; color: #333; margin-bottom: 25px;">${trans.greeting}</p>
          </div>
          
          <div style="background: #fff3e0; padding: 30px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #ff7e5f;">
            <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0; text-align: center;">
              ${trans.message}
            </p>
          </div>
          
          <!-- Botão -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%); 
                      color: white; 
                      padding: 18px 40px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-weight: 600; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 8px 25px rgba(255, 126, 95, 0.4);">
              ${trans.confirmButton}
            </a>
          </div>
          
          <!-- Aviso de segurança -->
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Importante:</h4>
            <ul style="color: #333; margin: 0; padding-left: 20px;">
              <li>${trans.footer}</li>
              <li>${trans.security}</li>
              <li>${trans.note}</li>
            </ul>
          </div>
          
          <!-- Rodapé -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
            <p style="color: #ff7e5f; font-weight: 600; font-size: 16px; margin: 0;">
              ${trans.signature}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, confirmationUrl, language = 'pt', userName }: AuthEmailRequest = await req.json();

    console.log(`Sending custom ${type} email to: ${email} in language: ${language}`);

    let subject: string;
    let html: string;

    if (type === 'signup') {
      const t = translations[language as keyof typeof translations] || translations.pt;
      subject = t.subject;
      html = getEmailTemplate(language, confirmationUrl, userName);
    } else if (type === 'reset_password') {
      const t = {
        pt: { subject: "🔐 Redefinir Senha - Touche de Lumière" },
        en: { subject: "🔐 Reset Password - Touche de Lumière" },
        fr: { subject: "🔐 Réinitialiser le mot de passe - Touche de Lumière" }
      };
      const trans = t[language as keyof typeof t] || t.pt;
      subject = trans.subject;
      html = getPasswordResetTemplate(language, confirmationUrl, userName);
    } else {
      // Para outros tipos, usar template padrão
      const t = translations[language as keyof typeof translations] || translations.pt;
      subject = t.subject;
      html = getEmailTemplate(language, confirmationUrl, userName);
    }

    const emailResponse = await resend.emails.send({
      from: "Touche de Lumière <noreply@touchedelumiere.com>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Custom auth email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      type,
      language 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error(`Error sending custom auth email:`, error);
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