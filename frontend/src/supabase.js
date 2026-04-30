import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rihpbcyoydleqhmafacx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaHBiY3lveWRsZXFobWFmYWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDQzMDgsImV4cCI6MjA5Mjg4MDMwOH0.qu_625eDfNA4dpSOyT4iBDKaN6nJ6s9j1zmM7CmqmPs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
