import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('id, name, auth_id');
  console.log('=== PROFILES ===', profiles?.length, 'records');
  profiles?.forEach(p => console.log(`  - ${p.name} (${p.id})`));

  const { data: roommates } = await supabase.from('roommates').select('id, name, user_id, is_listing');
  console.log('\n=== ROOMMATES ===', roommates?.length, 'records');
  roommates?.forEach(r => console.log(`  - [${r.is_listing ? 'LISTING' : 'USER'}] ${r.name} (${r.id})`));

  const { data: messages } = await supabase.from('messages').select('id, chat_id, sender_id, text').limit(5);
  console.log('\n=== MESSAGES (sample 5) ===');
  messages?.forEach(m => console.log(`  - chat: ${m.chat_id} | text: ${m.text?.substring(0,40)}`));
  
  const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  console.log(`  Total messages: ${count}`);
}

check();
