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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[google-auth-callback] Erro do Google:', error);
      return new Response(
        `<html><body><script>window.close();</script><p>Erro na autenticação. Você pode fechar esta janela.</p></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      throw new Error('Código de autorização não encontrado');
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `https://devnkdyfzlgspdlfuyam.supabase.co/functions/v1/google-auth-callback`;

    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('[google-auth-callback] Erro ao trocar token:', tokens);
      throw new Error(tokens.error_description || 'Erro ao obter tokens');
    }

    console.log('[google-auth-callback] Tokens obtidos com sucesso');

    // Armazenar tokens no Supabase
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Empresa não encontrada');
    }

    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

    // Salvar ou atualizar tokens
    const { error: upsertError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        company_id: profile.company_id,
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,user_id'
      });

    if (upsertError) {
      console.error('[google-auth-callback] Erro ao salvar tokens:', upsertError);
      throw upsertError;
    }

    console.log('[google-auth-callback] Tokens salvos com sucesso');

    return new Response(
      `<html>
        <body>
          <script>
            window.opener.postMessage({ type: 'google-auth-success' }, '*');
            window.close();
          </script>
          <p>Autenticação concluída com sucesso! Você pode fechar esta janela.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('[google-auth-callback] Erro:', error);
    return new Response(
      `<html><body><p>Erro: ${error.message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
});
