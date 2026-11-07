import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseConfigError } from '@/lib/supabase';
import { isDemoMode } from '@/lib/appMode';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDemoMode && !supabase) {
      setError(supabaseConfigError);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await signUp(formData.email, formData.password, formData.full_name);
      alert(isDemoMode
        ? 'Compte de démonstration créé. Vous pouvez vous connecter.'
        : 'Inscription réussie ! Veuillez vérifier votre e-mail.');
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/lumterra-logo.png" alt="LUMTERRA — Terre de lumière" className="mx-auto w-56 max-w-full object-contain" />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Rejoignez la communauté LUMTERRA
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Nom complet</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Adresse e-mail</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="8 caractères minimum"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'S\'inscrire'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
