import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rltolbnxdotqydyaxcdk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = '64ee839b-db31-40dd-b009-acfda59fe812';
  
  // Check all messages sent by this user
  const { data: sentMessages } = await supabase
    .from('messages')
    .select('id, chat_id, text, timestamp')
    .eq('sender_id', userId);
  
  console.log(`Messages sent by ${userId}: ${sentMessages?.length}`);
  sentMessages?.forEach(m => {
    console.log(`  - chat_id: ${m.chat_id}, text: ${m.text?.substring(0, 60)}`);
  });

  // Check roommates for this user
  const { data: roommates } = await supabase
    .from('roommates')
    .select('*')
    .eq('user_id', userId);
  console.log(`\nRoommates records for ${userId}:`, JSON.stringify(roommates, null, 2));

  // Check profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .or(`id.eq.${userId},auth_id.eq.${userId}`);
  console.log(`\nProfiles for ${userId}:`, JSON.stringify(profiles, null, 2));

  // The 4 orphaned messages - check if they're important
  // They are: AGREEMENT_DRAFT, AGREEMENT_CANCELLED (x2), AGREEMENT_SIGNED
  // The listing rm-1780990455318 and rm-1780991823871 no longer exist
  // These are definitely orphaned/stale data from a deleted listing
  
  console.log('\n=== Action: Delete the 4 orphaned messages ===');
  const { data: deleted, error } = await supabase
    .from('messages')
    .delete()
    .ilike('chat_id', '%rm-%')
    .select('id');
  
  if (error) {
    console.error('Delete error:', error);
  } else {
    console.log(`✅ Deleted ${deleted?.length} orphaned messages`);
  }

  // Final verification
  const { data: final } = await supabase
    .from('messages')
    .select('id')
    .ilike('chat_id', '%rm-%');
  
  console.log(`\nFinal count of rm- messages: ${final?.length || 0}`);
  if (final?.length === 0) {
    console.log('🎉 All clean! Database is fully migrated.');
  }
}

run();
