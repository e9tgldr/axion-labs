export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // tighten to the SPA origin in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
