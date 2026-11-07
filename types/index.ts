export type ReportStatus = 'pending' | 'in_progress' | 'resolved';

export interface Report {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface NewReport {
  title: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUri: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}
