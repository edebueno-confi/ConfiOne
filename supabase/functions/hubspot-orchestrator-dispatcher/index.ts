import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error:'Method not allowed.' },{status:405});
  const client=createServiceClient(); if(!(await authorizeCsRunner(req,client))) return jsonResponse({error:'Acesso negado.'},{status:403});
  const secret=Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim(); const base=Deno.env.get('SUPABASE_URL')?.replace(/\/$/,''); const key=Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if(!secret||!base||!key) return jsonResponse({error:'Runtime sem configuracao segura do dispatcher.'},{status:503});
  try { await client.rpc('rpc_analytics_hubspot_abandon_stale_runs',{p_timeout_seconds:900}); const results=[]; for(let i=0;i<12;i++){ const response=await fetch(`${base}/functions/v1/hubspot-orchestrator-worker`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json','x-analytics-sync-secret':secret,'x-hubspot-worker-id':`dispatcher-${crypto.randomUUID()}`},body:'{}'}); const payload=await response.json().catch(()=>null); results.push({status:response.status,payload}); if(payload&&typeof payload==='object'&&'status' in payload&&(payload as {status?:string}).status==='idle') break; } return jsonResponse({ok:results.every((r)=>r.status<400),workers:results}); } catch(error){return runnerError(error,502);}
});
