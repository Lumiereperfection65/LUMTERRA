import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isDemoMode } from '@/lib/appMode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (
      (url.protocol === 'https:' || (url.protocol === 'http:' && isLocalhost)) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function getJwtRole(value: string): string | null {
  const payload = value.split('.')[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='));
    const claims: unknown = JSON.parse(decodedPayload);
    return typeof claims === 'object' && claims !== null && 'role' in claims &&
      typeof claims.role === 'string'
      ? claims.role
      : null;
  } catch {
    return null;
  }
}

function isPublicSupabaseKey(value: string | undefined): boolean {
  if (!value || value.startsWith('sb_secret_')) return false;
  return value.startsWith('sb_publishable_') || getJwtRole(value) === 'anon';
}

const configErrors: string[] = [];
if (!isValidSupabaseUrl(supabaseUrl)) {
  configErrors.push('VITE_SUPABASE_URL doit être une URL Supabase HTTPS valide (HTTP est accepté uniquement en local).');
}
if (!supabaseAnonKey) {
  configErrors.push('VITE_SUPABASE_ANON_KEY est manquante.');
} else if (!isPublicSupabaseKey(supabaseAnonKey)) {
  configErrors.push(
    'VITE_SUPABASE_ANON_KEY doit contenir une clé publique anon/publishable. Les clés service_role et sb_secret_* sont interdites dans le frontend.'
  );
}

export const supabaseConfigError = configErrors.length > 0
  ? `Configuration Supabase invalide : ${configErrors.join(' ')} Renseignez les valeurs du projet dans .env puis redémarrez le serveur.`
  : null;

if (supabaseConfigError && !isDemoMode) {
  console.error(supabaseConfigError);
}

export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey && !supabaseConfigError
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
