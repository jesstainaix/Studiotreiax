import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtwsnjlkzmhdsdiakrwv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d3Nuamxrem1oZHNkaWFrcnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDg2ODksImV4cCI6MjA3MzE4NDY4OX0.UDAZslnIsaBL8ZjOcoyBzaoHjSmPAj6_MkKFsU4crqk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for authentication
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Database types
export interface Project {
  id: string
  title: string
  description?: string
  thumbnail?: string
  user_id: string
  template_id?: string
  status: 'draft' | 'processing' | 'completed' | 'error'
  duration?: number
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  title: string
  description: string
  thumbnail: string
  category: string
  nr_type?: string
  duration: number
  complexity: 'basic' | 'intermediate' | 'advanced'
  tags: string[]
  created_at: string
}

export interface VideoAsset {
  id: string
  project_id: string
  type: 'video' | 'audio' | 'image' | 'text' | 'avatar' | 'scene'
  name: string
  url: string
  duration?: number
  position: {
    x: number
    y: number
    z?: number
  }
  scale: {
    x: number
    y: number
  }
  rotation?: number
  start_time: number
  end_time: number
  layer: number
  properties: Record<string, any>
  created_at: string
}