import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://rltolbnxdotqydyaxcdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY'
);

async function main() {
  const imageBuffer = fs.readFileSync('./public/genz_khanhvy.png');
  const base64Image = 'data:image/png;base64,' + imageBuffer.toString('base64');
  
  const { data, error } = await supabase.from('roommates')
    .update({ avatar: base64Image })
    .ilike('name', '%Khánh Vy%');
    
  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Successfully updated Khánh Vy avatar to base64!');
  }
}

main();
