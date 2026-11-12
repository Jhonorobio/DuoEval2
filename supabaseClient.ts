import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// ACTION REQUIRED: Replace with your project's URL and anon key
const supabaseUrl = 'https://xfgwnanueuykieneywcw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZ3duYW51ZXV5a2llbmV5d2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTE5NTYsImV4cCI6MjA3OTIyNzk1Nn0.0qtf-wLXzJET00OxlQftoWsGZZLers07VTxgcTim2g0'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;