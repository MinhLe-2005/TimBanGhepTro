import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rltolbnxdotqydyaxcdk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // The 4 remaining messages have these listing IDs:
  // rm-1780990455318 and rm-1780991823871
  // User ID involved: 64ee839b-db31-40dd-b009-acfda59fe812

  const remainingListingIds = ['rm-1780990455318', 'rm-1780991823871'];
  const otherUserId = '64ee839b-db31-40dd-b009-acfda59fe812';

  console.log('Looking up listing IDs in roommates table...');
  for (const rmId of remainingListingIds) {
    const { data, error } = await supabase
      .from('roommates')
      .select('*')
      .eq('id', rmId)
      .maybeSingle();
    
    console.log(`\n${rmId}:`, error ? `Error: ${error.message}` : JSON.stringify(data));
  }

  // Check all roommates to see if any listings match these timestamp patterns
  console.log('\nAll roommates (recent):');
  const { data: allRoommates } = await supabase
    .from('roommates')
    .select('id, name, user_id, is_listing, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  
  console.log(JSON.stringify(allRoommates, null, 2));

  // Also check if any profiles for user 64ee839b exist
  console.log('\nProfiles for user 64ee839b:');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', otherUserId);
  console.log(JSON.stringify(profiles, null, 2));
}

run();
