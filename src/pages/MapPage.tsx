import React, { useEffect, useState } from 'react';
import { ReportMap } from '@/components/ReportMap';
import { supabase } from '@/lib/supabase';
import { Filter, Search, Map as MapIcon, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      const { data } = await supabase
        .from('reports')
        .select('*, categories(name)');
      
      setReports(data || []);
      setLoading(false);
    }
    fetchReports();
  }, []);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Carte du territoire</h2>
          <p className="text-slate-500">Visualisation géographique des signalements</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1">
            <button className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
              <MapIcon size={14} /> Carte
            </button>
            <button className="px-3 py-1.5 rounded-lg text-slate-50 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 text-slate-500">
              <List size={14} /> Liste
            </button>
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <ReportMap 
            reports={reports} 
            className="h-full w-full"
            center={reports.length > 0 ? [reports[0].latitude, reports[0].longitude] : [48.8566, 2.3522]}
          />
        )}
      </div>
    </div>
  );
}
