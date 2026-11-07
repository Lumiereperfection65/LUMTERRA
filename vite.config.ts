import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function getJwtRole(value: string): string | null {
  const payload = value.split('.')[1];
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof claims === 'object' && claims !== null && 'role' in claims &&
      typeof claims.role === 'string'
      ? claims.role
      : null;
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  if (supabaseKey?.startsWith('sb_secret_') || getJwtRole(supabaseKey ?? '') === 'service_role') {
    throw new Error(
      'Refus de démarrer Vite : VITE_SUPABASE_ANON_KEY contient une clé secrète/service_role. Utilisez uniquement la clé publique anon/publishable.'
    );
  }

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
  };
});
