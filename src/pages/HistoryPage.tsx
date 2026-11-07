import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, cn } from '@/lib/utils';
import { MapPin, Clock, CheckCircle2, AlertCircle, Eye, Search, Filter } from 'lucide-react';
import { isDemoMode } from '@/lib/appMode';
import { getDemoReports, updateDemoReportStatus } from '@/lib/demoStore';
import { toast } from 'sonner';
import type { Database } from '@/types/supabase';

type ReportStatus = Database['public']['Tables']['reports']['Row']['status'];
const reportStatuses: ReportStatus[] = ['PENDING', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export function HistoryPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchReports() {
      if (!user) {
        setLoading(false);
        return;
      }
      if (isDemoMode) {
        setReports(getDemoReports(user.id));
        setLoading(false);
        return;
      }
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('reports')
        .select('*, categories(name, color_hex)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Unable to load report history:', error);
      setReports(data || []);
      setLoading(false);
    }
    fetchReports();
  }, [user]);

  const changeDemoStatus = (reportId: string, status: ReportStatus) => {
    try {
      const updatedReport = updateDemoReportStatus(reportId, status);
      setReports((current) => current.map((report) => report.id === reportId ? updatedReport : report));
      toast.success('Statut de démonstration mis à jour.');
    } catch (error) {
      console.error('Unable to update local demo report:', error);
      toast.error(error instanceof Error ? error.message : 'Le statut ne peut pas être modifié.');
    }
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mes signalements</h2>
          <p className="text-slate-500">Suivez l'état de vos signalements envoyés</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Signalement</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <span className="font-bold text-slate-900 line-clamp-1">{report.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{report.categories?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 tabular-nums">{formatDate(report.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {isDemoMode ? (
                      <select
                        aria-label={`Statut de ${report.title}`}
                        value={report.status}
                        onChange={(event) => changeDemoStatus(report.id, event.target.value as ReportStatus)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {reportStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    ) : <StatusBadge status={report.status} />}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Clock className="animate-spin text-slate-300" size={32} />
          </div>
        ) : filteredReports.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Clock size={32} />
            </div>
            <p className="text-slate-500">Aucun signalement trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    PENDING: { label: 'En attente', color: 'bg-orange-50 text-orange-600', icon: Clock },
    RESOLVED: { label: 'Résolu', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
    VALIDATED: { label: 'Validé', color: 'bg-blue-50 text-blue-600', icon: CheckCircle2 },
    IN_PROGRESS: { label: 'En cours', color: 'bg-indigo-50 text-indigo-600', icon: AlertCircle },
    REJECTED: { label: 'Rejeté', color: 'bg-red-50 text-red-600', icon: AlertCircle },
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest", config.color)}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}
