import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, MapPin, Loader2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const reportSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  category_id: z.string().min(1, 'La catégorie est requise'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  latitude: z.number(),
  longitude: z.number(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportForm({ categories }: { categories: any[] }) {
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
      latitude: 0,
      longitude: 0,
    }
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAiAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await response.json();
      if (data.problem) {
        setValue('title', data.problem);
        setValue('description', data.summary);
        // Find matching category
        const matchedCat = categories.find(c => c.name.toLowerCase().includes(data.category.toLowerCase()));
        if (matchedCat) setValue('category_id', matchedCat.id);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
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
        setLocationError("Impossible de récupérer votre position.");
      }
    );
  };

  const onSubmit = async (values: ReportFormValues) => {
    if (!image) return alert('Une photo est requise pour le signalement.');
    setLoading(true);

    try {
      // 1. Upload Image
      const fileExt = image.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);

      // 2. Create Report
      const { data: report, error: reportError } = await (supabase
        .from('reports') as any)
        .insert({
          user_id: user?.id,
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

      // 3. Add Image Entry
      await (supabase.from('report_images') as any).insert({
        report_id: (report as any).id,
        storage_path: fileName,
        url: publicUrl,
        is_primary: true
      });

      navigate('/history');
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'envoi du signalement.");
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
                <p className="text-xs text-slate-400 mt-1">L'IA analysera automatiquement l'image</p>
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
