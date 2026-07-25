import { loadQaEnv } from './assert-local-supabase.mjs';

export function readQaPassword(name) {
  const value = process.env[name]?.trim() || loadQaEnv()[name]?.trim();
  if (!value) throw new Error(`LOCAL_QA_CONFIG_MISSING: ${name}`);
  return value;
}
