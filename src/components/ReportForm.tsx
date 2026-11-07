import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, MapPin, Loader2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Database } from '@/types/supabase';
import { isDemoMode } from '@/lib/appMode';
import { saveDemoReport } from '@/lib/demoStore';

const reportSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  category_id: z.string().min(1, 'La catégorie est requise'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  latitude: z.number().refine((value) => value !== 0, 'Récupérez votre position GPS'),
  longitude: z.number().refine((value) => value !== 0, 'Récupérez votre position GPS'),
});

type ReportFormValues = z.infer<typeof reportSchema>;
type Category = Database['public']['Tables']['categories']['Row'];

export function ReportForm({ categories }: { categories: Category[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      latitude: isDemoMode ? -4.2634 : 0,
      longitude: isDemoMode ? 15.2429 : 0,
    }
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image.');
        return;
      }
      if (isDemoMode && file.size > 500_000) {
        toast.error('En mode démo, choisissez une photo de moins de 500 Ko pour le stockage local.');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        if (!isDemoMode) void analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAiAnalyzing(true);
    try {
      if (!supabase) {
        throw new Error('Supabase n’est pas configuré.');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Connectez-vous pour utiliser l’analyse de photo.');
      }
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'L’analyse de la photo a échoué.');
      }
      const data = await response.json() as {
        problem?: string;
        category?: string;
        summary?: string;
      };
      if (data.problem) {
        setValue('title', data.problem);
        if (data.summary) setValue('description', data.summary);
        // Find matching category
        const matchedCat = data.category
          ? categories.find(c => c.name.toLowerCase().includes(data.category!.toLowerCase()))
          : undefined;
        if (matchedCat) setValue('category_id', matchedCat.id);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      toast.error(err instanceof Error ? err.message : 'L’analyse de la photo a échoué.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getGPS = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setLocationError(null);
      },
      (error) => {
        setLocationError(`Impossible de récupérer votre position : ${error.message}`);
      }
    );
  };

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast.error('Connectez-vous pour envoyer un signalement.');
      return;
    }
    if (!image && !isDemoMode) {
      toast.error('Une photo est requise pour le signalement.');
      return;
    }
    if (values.latitude === 0 && values.longitude === 0) {
      toast.error('Récupérez votre position GPS avant de continuer.');
      return;
    }
    setLoading(true);

    if (isDemoMode) {
      try {
        saveDemoReport({
          userId: user.id,
          title: values.title,
          description: values.description,
          categoryId: values.category_id,
          latitude: values.latitude,
          longitude: values.longitude,
          photoUrl: preview ?? undefined,
        });
        toast.success('Signalement ajouté au mode démo local.');
        navigate('/history');
      } catch (error) {
        console.error('Unable to save demo report:', error);
        toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer le signalement local.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) {
      toast.error('Supabase n’est pas configuré.');
      setLoading(false);
      return;
    }

    if (!image) {
      toast.error('Une photo est requise pour le signalement.');
      setLoading(false);
      return;
    }

    if (!supabase) {
      toast.error('Supabase n’est pas configuré.');
      setLoading(false);
      return;
    }

    let uploadedFileName: string | null = null;
    let reportId: string | null = null;
    try {
      // 1. Upload Image
      const fileExt = image.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'image';
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, image, { contentType: image.type, upsert: false });

      if (uploadError) throw uploadError;
      uploadedFileName = fileName;

      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);

      // 2. Create Report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          category_id: values.category_id,
          title: values.title,
          description: values.description,
          latitude: values.latitude,
          longitude: values.longitude,
          status: 'PENDING',
          severity: 'LOW',
        })
        .select()
        .single();

      if (reportError) throw reportError;
      reportId = report.id;

      // 3. Add Image Entry
      const { error: imageError } = await supabase.from('report_images').insert({
        report_id: report.id,
        storage_path: fileName,
        url: publicUrl,
        is_primary: true
      });
      if (imageError) throw imageError;

      toast.success('Votre signalement a été envoyé.');
      navigate('/history');
    } catch (err: unknown) {
      console.error('Report submission failed:', err);
      if (reportId) {
        const { error: cleanupError } = await supabase.from('reports').delete().eq('id', reportId);
        if (cleanupError) {
          console.error('Unable to roll back incomplete report:', cleanupError);
          toast.error('Le signalement est incomplet et n’a pas pu être annulé. Contactez un administrateur.');
        }
      }
      if (uploadedFileName) {
        const { error: cleanupError } = await supabase.storage.from('report-photos').remove([uploadedFileName]);
        if (cleanupError) {
          console.error('Unable to remove uploaded report photo:', cleanupError);
          toast.error('La photo téléversée n’a pas pu être supprimée.');
        }
      }
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du signalement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photo du problème</label>
          <div 
            onClick={() => document.getElementById('image-upload')?.click()}
            className={cn(
              "aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all overflow-hidden relative",
              preview && "border-emerald-500"
            )}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {aiAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Analyse IA en cours...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                  <Camera size={24} />
                </div>
                <p className="text-sm text-slate-500 font-medium">Cliquez pour ajouter une photo</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isDemoMode ? 'Photo facultative, conservée dans ce navigateur' : "L'IA analysera automatiquement l'image"}
                </p>
              </>
            )}
          </div>
          <input 
            id="image-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageChange}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Titre du signalement</label>
          <input
            {...register('title')}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
              errors.title && "border-red-300 bg-red-50"
            )}
            placeholder="Ex: Gros nid-de-poule dangereux"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Catégorie</label>
          <select
            {...register('category_id')}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white"
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
        </div>

        {/* GPS */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Localisation GPS</label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm flex items-center gap-2">
              <MapPin size={16} />
              {watch('latitude') !== 0 ? `${watch('latitude').toFixed(6)}, ${watch('longitude').toFixed(6)}` : 'Position non définie'}
            </div>
            <button
              type="button"
              onClick={getGPS}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Récupérer
            </button>
          </div>
          {locationError && <p className="mt-1 text-xs text-red-500">{locationError}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description détaillée</label>
          <textarea
            {...register('description')}
            rows={4}
            className={cn(
              "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
              errors.description && "border-red-300 bg-red-50"
            )}
            placeholder="Détaillez le problème rencontré pour aider les services techniques..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Envoyer le signalement</>}
        </button>
      </div>
    </form>
  );
}
