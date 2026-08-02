export const safeSecurityDefiner = `
create or replace function public.safe_contract()
returns void
language plpgsql
security definer
set search_path = ''
as $$ begin return; end; $$;
`;

export const unsafeSecurityDefiner = `
create or replace function public.unsafe_contract()
returns void
language plpgsql
security definer
as $$ begin return; end; $$;
`;

export const pgTapSelectStar = `
select * from public.tickets;
select ok(exists(select * from public.tickets), 'fixture');
`;

export const publicViewSelectStar = `
create or replace view public.vw_public_contract as
select * from public.tickets;
`;

export const frontendDirectTable = `
export async function load() {
  return client.from('analytics_spreadsheet_sources').select('id');
}
`;

export const frontendApprovedView = `
export async function load() {
  return client.from('vw_analytics_spreadsheet_sources').select('id');
}
`;

export const edgeStaging = `
export async function run() {
  return serviceClient.from('analytics_job_leases').select('*');
}
`;

export const edgeSensitive = `
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export async function run() {
  return client.from('customer_secrets').select('*');
}
`;
