
import { createClient } from '@supabase/supabase-js';

// Configuration for NaretApp
export const SUPABASE_URL = 'https://ugscdadgorfnhdfdscog.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc2NkYWRnb3JmbmhkZmRzY29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzY1MjEsImV4cCI6MjA4MTAxMjUyMX0.g44-ztvQwxiO8MfGsxJ2fapFprM0OcKi-9-Pkpb4sJY'; 

// Force cloud mode as requested by user
export const IS_SUPABASE_CONFIGURED = true;

// Clean keys to avoid copy-paste whitespace issues
const cleanUrl = SUPABASE_URL.trim();
const cleanKey = SUPABASE_ANON_KEY.trim();

export const supabase = createClient(cleanUrl, cleanKey);
