import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, cn } from '@/lib/utils';

export function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { count: total } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
      const { count: resolved } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED');
      const { count: critical } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('severity', 'CRITICAL');

      setStats({
        total: total || 0,
        pending: pending || 0,
        resolved: resolved || 0,
        critical: critical || 0
      });

      const { data } = await supabase
        .from('reports')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentReports(data || []);
    }

    fetchData();
  }, []);

  const chartData = [
    { name: 'Lun', value: 12 },
    { name: 'Mar', value: 19 },
    { name: 'Mer', value: 15 },
    { name: 'Jeu', value: 22 },
    { name: 'Ven', value: 30 },
    { name: 'Sam', value: 25 },
    { name: 'Dim', value: 18 },
  ];

  const pieData = [
    { name: 'Voirie', value: 400 },
    { name: 'Déchets', value: 300 },
    { name: 'Éclairage', value: 300 },
    { name: 'Espaces Verts', value: 200 },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bienvenue sur LUMTERRA</h2>
        <p className="text-slate-500">Aperçu de l'activité sur votre territoire</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Signalements totaux" value={stats.total} icon={TrendingUp} color="blue" />
        <StatCard title="En attente" value={stats.pending} icon={Clock} color="orange" />
        <StatCard title="Résolus" value={stats.resolved} icon={CheckCircle2} color="emerald" />
        <StatCard title="Critiques" value={stats.critical} icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Évolution des signalements</h3>
            <select className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Répartition par catégorie</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Signalements récents</h3>
          <Link to="/history" className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentReports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                  <p className="text-xs text-slate-500">
                    {report.categories?.name} · {formatDate(report.created_at)}
                  </p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                report.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
              )}>
                {report.status}
              </div>
            </div>
          ))}
          {recentReports.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Aucun signalement récent.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
      <div className={cn("p-3 rounded-xl", colors[color])}>
        <Icon size={24} />
      </div>
    </div>
  );
}
