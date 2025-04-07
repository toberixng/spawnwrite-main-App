// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpjoaivnzwhfdfvyuwup.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwam9haXZuendoZmRmdnl1d3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjE0MDQsImV4cCI6MjA1OTQzNzQwNH0.t1NPOcc8IH85agVtn-EDwIkF6uyKS3wzKebx02m4sR4';

// Only log in development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Ensure session persistence
  },
});

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase connected!');
}