import { createClient } from '@supabase/supabase-js'

// Use hard-coded values from supabase.js for consistency
const supabaseUrl = 'https://urhbxdsjaxaznsflcxzx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaGJ4ZHNqYXhhem5zZmxjeHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTUyNDksImV4cCI6MjA2MjEzMTI0OX0.j-A_fzObkOWWDEbgvUQs-ToQKdOiFEBeUCDCZgVEjbw'

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export all functions from the main supabase.js file
export * from './supabase'