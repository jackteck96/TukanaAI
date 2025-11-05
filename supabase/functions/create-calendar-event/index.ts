import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { processId, title, description, startTime, endTime, attendeeEmail } = await req.json();

    console.log('[create-calendar-event] Criando evento:', { processId, title, startTime });

    // Buscar processo para pegar company_id
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('company_id, client_name, client_email')
      .eq('id', processId)
      .single();

    if (processError || !process) {
      throw new Error('Processo não encontrado');
    }

    // Buscar tokens do Google da empresa
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('company_id', process.company_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokensError || !tokens) {
      throw new Error('Google Calendar não conectado. Conecte sua conta do Google primeiro.');
    }

    // Verificar se o token expirou
    let accessToken = tokens.access_token;
    const now = new Date();
    const expiry = new Date(tokens.token_expiry);

    if (now >= expiry && tokens.refresh_token) {
      console.log('[create-calendar-event] Token expirado, renovando...');
      
      const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
      const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const newTokens = await refreshResponse.json();
      
      if (!refreshResponse.ok) {
        console.error('[create-calendar-event] Erro ao renovar token:', newTokens);
        throw new Error('Erro ao renovar token. Reconecte sua conta do Google.');
      }

      accessToken = newTokens.access_token;
      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000);

      // Atualizar tokens no banco
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokens.id);
    }

    // Criar evento no Google Calendar
    const event = {
      summary: title,
      description: description || `Reunião para o processo: ${process.client_name}`,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: attendeeEmail || process.client_email },
      ],
      conferenceData: {
        createRequest: {
          requestId: `${processId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 }, // 30 minutos antes
        ],
      },
    };

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const calendarEvent = await calendarResponse.json();

    if (!calendarResponse.ok) {
      console.error('[create-calendar-event] Erro ao criar evento:', calendarEvent);
      throw new Error(calendarEvent.error?.message || 'Erro ao criar evento no Google Calendar');
    }

    console.log('[create-calendar-event] Evento criado:', calendarEvent.id);

    // Atualizar processo com link da reunião
    const meetingUrl = calendarEvent.hangoutLink || calendarEvent.htmlLink;
    await supabase
      .from('processes')
      .update({
        meeting_url: meetingUrl,
        meeting_date: startTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', processId);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: calendarEvent.id,
        meetingUrl,
        htmlLink: calendarEvent.htmlLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[create-calendar-event] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
