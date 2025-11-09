import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// ACTION REQUIRED: Replace with your project's URL and anon key
const supabaseUrl = 'https://djrjrqznhbtnrpsarpqf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcmpycXpuaGJ0bnJwc2FycHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTkxOTQsImV4cCI6MjA3ODE5NTE5NH0.CHs04cRzhem2Oj4b79NgYncJyBLJjhUAzC0sKPQnqKQ'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;