const configuredMode = import.meta.env.VITE_APP_MODE?.trim().toLowerCase();

if (configuredMode && configuredMode !== 'demo' && configuredMode !== 'production') {
  throw new Error('VITE_APP_MODE doit être « demo » ou « production ».');
}

export const appMode: 'demo' | 'production' = configuredMode === 'production' ? 'production' : 'demo';
export const isDemoMode = appMode === 'demo';
