// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Replace these with your own keys from Step 3
const supabaseUrl = 'https://rpjoaivnzwhfdfvyuwup.supabase.co'; // e.g., https://xyz.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwam9haXZuendoZmRmdnl1d3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjE0MDQsImV4cCI6MjA1OTQzNzQwNH0.t1NPOcc8IH85agVtn-EDwIkF6uyKS3wzKebx02m4sR4'; // e.g., eyJhbG...

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase connected!');