import { useCallback, useEffect, useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { formatDate } from '@/lib/utils';

type Report = Database['public']['Tables']['reports']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Intervention = Database['public']['Tables']['interventions']['Row'];
type AssignedReport = Pick<Report, 'id' | 'title' | 'status' | 'created_at'> & {
  categories: Pick<Category, 'name'> | null;
};
type ActiveIntervention = Pick<Intervention, 'id' | 'report_id' | 'started_at'> & {
  reports: (Pick<Report, 'title' | 'status'> & { categories: Pick<Category, 'name'> | null }) | null;
};

export function InterventionsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AssignedReport[]>([]);
  const [activeInterventions, setActiveInterventions] = useState<ActiveIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingReport, setWorkingReport] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    const { data: reportData, error: reportsError } = await supabase
      .from('reports')
      .select('id,title,status,created_at,categories(name)')
      .eq('status', 'ASSIGNED')
      .order('created_at', { ascending: false });

    const { data: interventionData, error: interventionsError } = await supabase
      .from('interventions')
      .select('id,report_id,started_at,reports(title,status,categories(name))')
      .eq('agent_id', user.id)
      .is('completed_at', null)
      .order('started_at', { ascending: false });

    if (reportsError || interventionsError) {
      console.error('Unable to load interventions:', reportsError ?? interventionsError);
      toast.error('Impossible de charger les interventions.');
    } else {
      setReports(reportData);
      setActiveInterventions(interventionData);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const startIntervention = async (report: AssignedReport) => {
    if (!supabase || !user) {
      toast.error('Connectez-vous pour gérer une intervention.');
      return;
    }

    setWorkingReport(report.id);
    const { error: insertError } = await supabase.from('interventions').insert({
      report_id: report.id,
      agent_id: user.id,
      started_at: new Date().toISOString(),
    });
    if (insertError) {
      console.error('Unable to create intervention:', insertError);
      toast.error('Impossible de démarrer cette intervention.');
      setWorkingReport(null);
      return;
    }

    const { error: statusError } = await supabase
      .from('reports')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', report.id);
    if (statusError) {
      console.error('Intervention created but report status update failed:', statusError);
      toast.error('Intervention créée, mais le statut du signalement n’a pas pu être mis à jour.');
    } else {
      toast.success('Intervention démarrée.');
    }
    await loadReports();
    setWorkingReport(null);
  };

  const completeIntervention = async (intervention: ActiveIntervention) => {
    if (!supabase) {
      toast.error('Supabase n’est pas configuré.');
      return;
    }

    setWorkingReport(intervention.report_id);
    const { error: completionError } = await supabase
      .from('interventions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', intervention.id);
    if (completionError) {
      console.error('Unable to complete intervention:', completionError);
      toast.error('Impossible de terminer cette intervention.');
      setWorkingReport(null);
      return;
    }

    const { error: statusError } = await supabase
      .from('reports')
      .update({ status: 'RESOLVED' })
      .eq('id', intervention.report_id);
    if (statusError) {
      console.error('Intervention completed but report status update failed:', statusError);
      toast.error('Intervention terminée, mais le statut du signalement n’a pas pu être mis à jour.');
    } else {
      toast.success('Intervention terminée et signalement résolu.');
    }
    await loadReports();
    setWorkingReport(null);
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Interventions</h2>
        <p className="text-slate-500">Prenez en charge les signalements assignés aux équipes.</p>
      </header>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <Loader2 className="animate-spin text-emerald-600" />
        </div>
      ) : reports.length === 0 && activeInterventions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Aucune intervention assignée pour le moment.
        </div>
      ) : (
        <div className="grid gap-4">
          {activeInterventions.map((intervention) => (
            <article key={intervention.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                  {intervention.reports?.categories?.name ?? 'Sans catégorie'} · En cours
                </p>
                <h3 className="mt-1 font-bold text-slate-900">{intervention.reports?.title ?? 'Signalement'}</h3>
                {intervention.started_at && <p className="mt-1 text-sm text-slate-500">Démarrée le {formatDate(intervention.started_at)}</p>}
              </div>
              <button
                type="button"
                disabled={workingReport === intervention.report_id}
                onClick={() => void completeIntervention(intervention)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {workingReport === intervention.report_id && <Loader2 className="animate-spin" size={16} />}
                Terminer et résoudre
              </button>
            </article>
          ))}
          {reports.map((report) => (
            <article key={report.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  {report.categories?.name ?? 'Sans catégorie'} · {report.status}
                </p>
                <h3 className="mt-1 font-bold text-slate-900">{report.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Créé le {formatDate(report.created_at)}</p>
              </div>
              {report.status === 'ASSIGNED' && (
                <button
                  type="button"
                  disabled={workingReport === report.id}
                  onClick={() => void startIntervention(report)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {workingReport === report.id ? <Loader2 className="animate-spin" size={16} /> : <Briefcase size={16} />}
                  Démarrer l’intervention
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
