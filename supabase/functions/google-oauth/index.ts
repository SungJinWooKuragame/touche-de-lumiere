import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, code, redirectUri } = await req.json()

    // Buscar configurações do Google Calendar
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('google_client_id, google_client_secret')
      .eq('id', '1')
      .single()

    if (settingsError || !settings?.google_client_id) {
      throw new Error('Credenciais do Google Calendar não configuradas')
    }

    const clientId = settings.google_client_id
    const clientSecret = settings.google_client_secret

    if (action === 'getAuthUrl') {
      // Gerar URL de autorização OAuth
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'exchangeCode') {
      // Trocar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })

      const tokens = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error(`Erro ao obter tokens: ${tokens.error_description || tokens.error}`)
      }

      // Buscar informações do usuário
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
      )
      const userInfo = await userResponse.json()

      // Salvar tokens no banco
      const { error: updateError } = await supabaseClient
        .from('site_settings')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_calendar_connected: true,
          google_calendar_email: userInfo.email,
        })
        .eq('id', '1')

      if (updateError) {
        throw new Error(`Erro ao salvar tokens: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          email: userInfo.email,
          message: 'Google Calendar conectado com sucesso!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'disconnect') {
      // Desconectar Google Calendar
      const { error: updateError } = await supabaseClient
        .from('site_settings')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          google_calendar_connected: false,
          google_calendar_email: null,
        })
        .eq('id', '1')

      if (updateError) {
        throw new Error(`Erro ao desconectar: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Google Calendar desconectado!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Ação não reconhecida')

  } catch (error) {
    console.error('Erro na autenticação OAuth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})