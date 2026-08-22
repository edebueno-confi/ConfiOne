import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { resolveCorsOrigin, isAllowedCorsOrigin } from './cors-policy.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
} as const;

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value && value.length > 0) {
      return value;
    }
  }

  throw new Error(`Missing environment variable. Tried: ${keys.join(', ')}`);
}

function normalizeSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      parsed.hostname = 'host.docker.internal';
      return parsed.toString().replace(/\/$/, '');
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value.replace(/\/$/, '');
  }
}

const supabaseUrl = normalizeSupabaseUrl(
  readEnv('SUPABASE_INTERNAL_URL', 'SUPABASE_URL', 'KONG_URL', 'API_URL'),
);
const publishableKey = readEnv('SB_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'ANON_KEY');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY');

export function getCorsHeaders() {
  return corsHeaders;
}

export function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export function optionsResponse(req?: Request) {
  const origin = req?.headers.get('origin') ?? null;
  const allowLocal = Deno.env.get('ALLOW_LOCAL_CORS') === 'true';
  if (origin && !isAllowedCorsOrigin(origin, { allowedOrigins: Deno.env.get('ALLOWED_CORS_ORIGINS'), allowLocal })) {
    return new Response('CORS origin not allowed', { status: 403, headers: { Vary: 'Origin' } });
  }
  const allowedOrigin = resolveCorsOrigin(origin, { allowedOrigins: Deno.env.get('ALLOWED_CORS_ORIGINS'), allowLocal });
  return new Response('ok', { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders, ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } : {}) } });
}

export function getAuthorizationHeader(req: Request) {
  return req.headers.get('Authorization') ?? req.headers.get('authorization') ?? '';
}

export function createUserClient(authHeader: string): SupabaseClient {
  return createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireActor(req: Request) {
  const authHeader = getAuthorizationHeader(req);
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new Error('Missing bearer token');
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Error('Invalid JWT');
  }

  return {
    authHeader,
    userId: String(data.claims.sub),
  };
}

export function isAlreadyExistsStorageError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = 'message' in error ? String(error.message ?? '') : '';
  const statusCode = 'statusCode' in error ? String(error.statusCode ?? '') : '';
  return statusCode === '409' || /already exists/i.test(message);
}
