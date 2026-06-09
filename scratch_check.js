import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rltolbnxdotqydyaxcdk.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Checking all messages with rm- ---');
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .ilike('chat_id', '%rm-%');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${messages?.length} messages with 'rm-' in their chat_id:`);

  // Fetch all roommates to resolve listing ID to user_id
  const { data: roommates } = await supabase.from('roommates').select('id, name, user_id');
  const roommateMap = new Map();
  roommates?.forEach(r => {
    roommateMap.set(r.id, r.user_id);
  });

  const migrationPlans = [];

  for (const m of messages) {
    const ids = m.chat_id.split('_');
    const partnerId0 = ids[0];
    const partnerId1 = ids[1];

    // Find which ID is the rm- ID
    const rmId = partnerId0.startsWith('rm-') ? partnerId0 : partnerId1.startsWith('rm-') ? partnerId1 : null;
    const otherId = partnerId0.startsWith('rm-') ? partnerId1 : partnerId0;

    if (rmId) {
      // Find the user_id (auth UUID) for this roommate listing
      let realUserId = roommateMap.get(rmId);
      
      if (!realUserId) {
        // If not found in roommateMap, search database directly
        const { data: rm } = await supabase.from('roommates').select('user_id').eq('id', rmId).maybeSingle();
        if (rm?.user_id) {
          realUserId = rm.user_id;
        }
      }

      if (realUserId) {
        const canonicalChatId = [otherId, realUserId].sort().join('_');
        migrationPlans.push({
          msgId: m.id,
          oldChatId: m.chat_id,
          newChatId: canonicalChatId,
          oldSenderId: m.sender_id,
          newSenderId: m.sender_id === rmId ? realUserId : m.sender_id,
          text: m.text
        });
      } else {
        console.warn(`Could not resolve user_id for listing ID: ${rmId}`);
      }
    }
  }

  console.log(`\nCreated ${migrationPlans.length} migration plans:`);
  console.log(JSON.stringify(migrationPlans, null, 2));
}

run();
