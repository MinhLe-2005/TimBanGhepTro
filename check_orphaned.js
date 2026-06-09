import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rltolbnxdotqydyaxcdk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // View the 4 remaining orphaned messages to understand what they contain
  const { data: orphaned, error } = await supabase
    .from('messages')
    .select('*')
    .ilike('chat_id', '%rm-%');

  console.log('Orphaned messages:');
  console.log(JSON.stringify(orphaned, null, 2));

  // Also check auth users we know about
  // User 64ee839b-db31-40dd-b009-acfda59fe812 - need to check profiles table columns
  console.log('\n\nChecking profiles table structure...');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  console.log('Sample profiles:', JSON.stringify(allProfiles?.slice(0, 2), null, 2));
  
  // Check roommates table structure
  console.log('\nChecking roommates - all records:');
  const { data: allRoommates } = await supabase
    .from('roommates')
    .select('id, name, user_id, is_listing')
    .limit(10);
  console.log(JSON.stringify(allRoommates, null, 2));
}

run();
