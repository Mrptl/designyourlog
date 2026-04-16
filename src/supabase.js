import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jcjwkhedimrwaglhvljx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjandraGVkaW1yd2FnbGh2bGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjA5NjMsImV4cCI6MjA5MTkzNjk2M30.2nasOss8TIkMVuEWBGN69ShVOkZ_CDTyXJjvsm-9okw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
