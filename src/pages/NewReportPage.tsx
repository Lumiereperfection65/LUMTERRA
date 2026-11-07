import React, { useEffect, useState } from 'react';
import { ReportForm } from '@/components/ReportForm';
import { supabase } from '@/lib/supabase';
import { Info, ShieldCheck, Zap } from 'lucide-react';

export function NewReportPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*');
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Signaler un problème</h2>
          <p className="text-slate-500">Aidez-nous à améliorer votre ville en quelques clics</p>
        </div>
        <ReportForm categories={categories} />
      </div>

      <div className="space-y-6">
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2">Analyse Intelligente</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Notre IA analyse votre photo en temps réel pour pré-remplir les détails, 
            identifier la catégorie et évaluer la gravité du problème.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Info size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Conseils photo</h4>
              <p className="text-xs text-slate-500 mt-1">
                Prenez une photo claire et bien éclairée du problème pour faciliter le travail des agents.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Suivi garanti</h4>
              <p className="text-xs text-slate-500 mt-1">
                Chaque signalement est transmis aux services compétents et vous serez notifié de son évolution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
