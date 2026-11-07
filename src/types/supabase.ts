export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'CITOYEN' | 'AGENT' | 'ADMIN'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'CITOYEN' | 'AGENT' | 'ADMIN'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'CITOYEN' | 'AGENT' | 'ADMIN'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_name: string | null
          color_hex: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_name?: string | null
          color_hex?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon_name?: string | null
          color_hex?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          category_id: string
          zone_id: string | null
          title: string
          description: string
          latitude: number
          longitude: number
          address: string | null
          status: 'PENDING' | 'VALIDATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          ai_analysis: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          zone_id?: string | null
          title: string
          description: string
          latitude: number
          longitude: number
          address?: string | null
          status?: 'PENDING' | 'VALIDATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          ai_analysis?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          zone_id?: string | null
          title?: string
          description?: string
          latitude?: number
          longitude?: number
          address?: string | null
          status?: 'PENDING' | 'VALIDATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          ai_analysis?: Json
          created_at?: string
          updated_at?: string
        }
      }
      report_images: {
        Row: {
          id: string
          report_id: string
          storage_path: string
          url: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          storage_path: string
          url: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          storage_path?: string
          url?: string
          is_primary?: boolean
          created_at?: string
        }
      }
    }
  }
}
