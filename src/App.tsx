import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewReportPage } from '@/pages/NewReportPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { MapPage } from '@/pages/MapPage';
import { AdminPage } from '@/pages/AdminPage';
import { InterventionsPage } from '@/pages/InterventionsPage';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { supabaseConfigError } from '@/lib/supabase';
import { isDemoMode } from '@/lib/appMode';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: Array<'AGENT' | 'ADMIN'> }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!profile || profile.role === 'CITOYEN' || !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      {isDemoMode && (
        <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[1000] rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-950 shadow-lg sm:left-auto sm:max-w-xl">
          <strong>Mode démo local</strong>
          <p className="mt-1">Les comptes et signalements sont enregistrés dans ce navigateur uniquement.</p>
        </div>
      )}
      {!isDemoMode && supabaseConfigError && (
        <div role="alert" className="fixed bottom-4 left-4 right-4 z-[1000] rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-lg sm:left-auto sm:max-w-xl">
          <strong>Mode production : configuration requise</strong>
          <p className="mt-1">{supabaseConfigError}</p>
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewReportPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/interventions" element={<ProtectedRoute><RoleRoute roles={['AGENT', 'ADMIN']}><InterventionsPage /></RoleRoute></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><RoleRoute roles={['ADMIN']}><AdminPage /></RoleRoute></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
