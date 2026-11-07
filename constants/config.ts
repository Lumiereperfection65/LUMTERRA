import type { ReportStatus } from '@/types';
import { colors } from './theme';

export const PHOTO_BUCKET = 'report-photos';
export const CATEGORIES = ['Voirie', 'Déchets', 'Eau', 'Éclairage', 'Environnement', 'Sécurité', 'Autre'];

export const STATUS_META: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#B45309', bg: '#FEF3C7' },
  in_progress: { label: 'En cours', color: '#0F766E', bg: colors.mint },
  resolved: { label: 'Résolu', color: colors.emeraldDark, bg: '#D1FAE5' },
};
export const STATUSES: ReportStatus[] = ['pending', 'in_progress', 'resolved'];

// Région par défaut de la carte (modifiable)
export const DEFAULT_REGION = { latitude: -4.2634, longitude: 15.2429, latitudeDelta: 0.12, longitudeDelta: 0.12 };
