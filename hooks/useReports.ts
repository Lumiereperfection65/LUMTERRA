import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { listReports } from '@/services/reports';
import type { Report } from '@/types';

/** Charge les signalements (les miens ou tous) à chaque fois que l'écran reprend le focus. */
export function useReports(userId?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setReports(await listReports(userId));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  return { reports, loading, error, refresh };
}
