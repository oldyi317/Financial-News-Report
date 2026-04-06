import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ymqhermftostqzqfkspf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcWhlcm1mdG9zdHF6cWZrc3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTk1NDIsImV4cCI6MjA5MTAzNTU0Mn0.w7Vw5zNLezywoBvyrVpzvnONVo9NOeWxNmDSkXKrwPE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
