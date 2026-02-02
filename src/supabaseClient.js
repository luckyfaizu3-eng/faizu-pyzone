import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gkyxtgxkwshfzgymzkkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdreXh0Z3hrd3NoZnpneW16a2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTkzMzAsImV4cCI6MjA4NTUzNTMzMH0.DQfYo27Nm8IaBQwxE6DlapmSipbgNTI7WVZ7LdJXGiE';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;