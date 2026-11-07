import { PHOTO_BUCKET } from '@/constants/config';
import type { NewReport, Report, ReportStatus } from '@/types';
import { getSupabaseClient } from './supabase';

export async function listReports(userId?: string): Promise<Report[]> {
  let q = getSupabaseClient().from('reports').select('*').order('created_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function getReport(id: string): Promise<Report> {
  const { data, error } = await getSupabaseClient().from('reports').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Report;
}

function photoContentType(uri: string, responseType: string | null): { contentType: string; extension: string } {
  const knownTypes: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  const mimeType = responseType?.split(';')[0].trim().toLowerCase() ?? '';
  if (knownTypes[mimeType]) return { contentType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, extension: knownTypes[mimeType] };

  const uriPath = uri.split(/[?#]/, 1)[0];
  const extension = uriPath.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? '';
  const extensionTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  const contentType = extensionTypes[extension];
  if (!contentType) throw new Error('Format de photo non pris en charge.');
  return { contentType, extension: extension === 'jpeg' ? 'jpg' : extension };
}

async function uploadPhoto(userId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Impossible de lire la photo (HTTP ${response.status}).`);
  const { contentType, extension } = photoContentType(uri, response.headers.get('content-type'));
  const buffer = await response.arrayBuffer();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await getSupabaseClient().storage.from(PHOTO_BUCKET).upload(path, buffer, { contentType });
  if (error) throw error;
  return getSupabaseClient().storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function createReport(userId: string, r: NewReport): Promise<Report> {
  const photo_url = r.photoUri ? await uploadPhoto(userId, r.photoUri) : null;
  const { data, error } = await getSupabaseClient()
    .from('reports')
    .insert({ user_id: userId, title: r.title, category: r.category, description: r.description, latitude: r.latitude, longitude: r.longitude, photo_url })
    .select()
    .single();
  if (error) throw error;
  return data as Report;
}

export async function updateStatus(id: string, status: ReportStatus): Promise<void> {
  const { error } = await getSupabaseClient().from('reports').update({ status }).eq('id', id);
  if (error) throw error;
}
