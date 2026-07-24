export interface HelpCenterIntegrationLinks {
  apiDocs: string;
  apiDocsSpec: string;
  swagger: string;
  production: string;
  qa: string;
  mock: string | null;
}

export interface RuntimeConfig {
  appEnv: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  helpCenterIntegrationLinks: HelpCenterIntegrationLinks;
}

export interface MissingRuntimeConfig {
  missingKeys: string[];
}

const runtimeEnv = import.meta.env;

const defaultHelpCenterIntegrationLinks: HelpCenterIntegrationLinks = {
  apiDocs: 'https://apidocs.geniusreturns.com.br/openapi',
  apiDocsSpec: 'https://apidocs.geniusreturns.com.br/_spec/openapi.json?download=',
  swagger: 'https://integration.geniusreturns.com.br/swagger/index.html',
  production: 'https://integration.geniusreturns.com.br',
  qa: 'https://integration-qa.geniusreturns.com.br',
  mock: null,
};

function readEnvValue(key: string, env: Record<string, unknown> = runtimeEnv) {
  return (env[key] ?? '')
    .toString()
    .trim();
}

function readSafeExternalUrl(key: string, fallback: string | null, env: Record<string, unknown>) {
  const candidate = readEnvValue(key, env);
  if (!candidate) return fallback;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function resolveHelpCenterIntegrationLinks(
  env: Record<string, unknown> = runtimeEnv,
): HelpCenterIntegrationLinks {
  return {
    apiDocs: readSafeExternalUrl('VITE_HELP_CENTER_API_DOCS_URL', defaultHelpCenterIntegrationLinks.apiDocs, env) ?? defaultHelpCenterIntegrationLinks.apiDocs,
    apiDocsSpec: readSafeExternalUrl('VITE_HELP_CENTER_API_DOCS_SPEC_URL', defaultHelpCenterIntegrationLinks.apiDocsSpec, env) ?? defaultHelpCenterIntegrationLinks.apiDocsSpec,
    swagger: readSafeExternalUrl('VITE_HELP_CENTER_SWAGGER_URL', defaultHelpCenterIntegrationLinks.swagger, env) ?? defaultHelpCenterIntegrationLinks.swagger,
    production: readSafeExternalUrl('VITE_HELP_CENTER_PRODUCTION_URL', defaultHelpCenterIntegrationLinks.production, env) ?? defaultHelpCenterIntegrationLinks.production,
    qa: readSafeExternalUrl('VITE_HELP_CENTER_QA_URL', defaultHelpCenterIntegrationLinks.qa, env) ?? defaultHelpCenterIntegrationLinks.qa,
    mock: readSafeExternalUrl('VITE_HELP_CENTER_MOCK_URL', defaultHelpCenterIntegrationLinks.mock, env),
  };
}

export function readHelpCenterIntegrationLinks(): HelpCenterIntegrationLinks {
  return resolveHelpCenterIntegrationLinks(runtimeEnv);
}

export function readRuntimeConfig():
  | { ok: true; config: RuntimeConfig }
  | { ok: false; error: MissingRuntimeConfig } {
  const appEnv = readEnvValue('VITE_APP_ENV') || 'development';
  const supabaseUrl = readEnvValue('VITE_SUPABASE_URL');
  const supabaseAnonKey = readEnvValue('VITE_SUPABASE_ANON_KEY');

  const missingKeys = [
    !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter(Boolean) as string[];

  if (missingKeys.length > 0) {
    return {
      ok: false,
      error: { missingKeys },
    };
  }

  return {
    ok: true,
    config: {
      appEnv,
      supabaseUrl,
      supabaseAnonKey,
      helpCenterIntegrationLinks: readHelpCenterIntegrationLinks(),
    },
  };
}
