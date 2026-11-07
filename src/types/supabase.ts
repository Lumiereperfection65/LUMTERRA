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
        },
        Relationships: []
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
        },
        Relationships: []
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
        },
        Relationships: [
          {
            foreignKeyName: 'reports_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reports_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
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
        },
        Relationships: [
          {
            foreignKeyName: 'report_images_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          }
        ]
      },
      interventions: {
        Row: {
          id: string
          report_id: string
          agent_id: string
          description: string | null
          proof_url: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          agent_id: string
          description?: string | null
          proof_url?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          agent_id?: string
          description?: string | null
          proof_url?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'interventions_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interventions_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    },
    Views: Record<string, never>,
    Functions: Record<string, never>,
    Enums: {
      user_role: 'CITOYEN' | 'AGENT' | 'ADMIN'
      report_status: 'PENDING' | 'VALIDATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
      report_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    },
    CompositeTypes: Record<string, never>
  }
}
