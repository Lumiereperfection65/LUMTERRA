import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { formatDate } from '@/lib/utils';

type Report = Database['public']['Tables']['reports']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type ManagedReport = Pick<Report, 'id' | 'title' | 'status' | 'severity' | 'created_at'> & {
  categories: Pick<Category, 'name'> | null;
};

const statuses: Report['status'][] = [
  'PENDING',
  'VALIDATED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
];

export function AdminPage() {
  const [reports, setReports] = useState<ManagedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingReport, setSavingReport] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id,title,status,severity,created_at,categories(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Unable to load admin reports:', error);
      toast.error('Impossible de charger les signalements.');
    } else {
      setReports(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const updateStatus = async (reportId: string, status: Report['status']) => {
    if (!supabase) {
      toast.error('Supabase n’est pas configuré.');
      return;
    }

    setSavingReport(reportId);
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
    if (error) {
      console.error('Unable to update report status:', error);
      toast.error('Le statut n’a pas pu être modifié.');
    } else {
      setReports((current) => current.map((report) =>
        report.id === reportId ? { ...report, status } : report
      ));
      toast.success('Statut du signalement mis à jour.');
    }
    setSavingReport(null);
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Administration</h2>
        <p className="text-slate-500">Suivez et modérez les signalements du territoire.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-600" /></div>
        ) : reports.length === 0 ? (
          <p className="p-12 text-center text-slate-500">Aucun signalement à afficher.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-4">Signalement</th>
                  <th className="px-5 py-4">Catégorie</th>
                  <th className="px-5 py-4">Gravité</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{report.title}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{report.categories?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{report.severity}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(report.created_at)}</td>
                    <td className="px-5 py-4">
                      <label className="sr-only" htmlFor={`status-${report.id}`}>Statut de {report.title}</label>
                      <select
                        id={`status-${report.id}`}
                        value={report.status}
                        disabled={savingReport === report.id}
                        onChange={(event) => void updateStatus(report.id, event.target.value as Report['status'])}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                      >
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      {savingReport === report.id && <Loader2 className="ml-2 inline animate-spin text-slate-400" size={16} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <AlertCircle size={14} /> Les droits d’administration sont vérifiés par les politiques RLS Supabase.
      </p>
    </section>
  );
}
