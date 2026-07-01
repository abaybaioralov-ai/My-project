import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://ledqshysnrdmnuiikujt.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZHFzaHlzbnJkbW51aWlrdWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTk2NzMsImV4cCI6MjA5ODI3NTY3M30.XE0I_ZOIiRlCVLrkE_2mWnJeMzECxzuAlBMbVULfuWM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
