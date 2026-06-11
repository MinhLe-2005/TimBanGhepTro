const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/["']/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.substring(line.indexOf('=')+1).trim().replace(/["']/g, '');
});

const supabase = createClient(url, key);

async function migrate() {
  console.log("Migrating roommates avatars...");
  const { data: roommates, error: rmErr } = await supabase.from('roommates').select('id, avatar').like('avatar', 'data:image%');
  if (rmErr) console.error(rmErr);
  else {
    for (const rm of roommates) {
      const base64Data = rm.avatar.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `avatar_${Date.now()}_${rm.id}.png`;
      console.log(`Uploading ${filename}...`);
      const { data, error } = await supabase.storage.from('room-images').upload(filename, buffer, { contentType: 'image/png' });
      if (error) console.error(error);
      else {
        const publicUrl = supabase.storage.from('room-images').getPublicUrl(filename).data.publicUrl;
        await supabase.from('roommates').update({ avatar: publicUrl }).eq('id', rm.id);
        console.log(`Updated roommate ${rm.id}`);
      }
    }
  }

  console.log("Migrating rooms images...");
  const { data: rooms, error: rErr } = await supabase.from('rooms').select('id, images');
  if (rErr) console.error(rErr);
  else {
    for (const r of rooms) {
      let changed = false;
      let newImages = [];
      for (let i = 0; i < (r.images || []).length; i++) {
        let img = r.images[i];
        if (img && img.startsWith('data:image')) {
          changed = true;
          const base64Data = img.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `room_${Date.now()}_${r.id}_${i}.png`;
          console.log(`Uploading ${filename}...`);
          const { data, error } = await supabase.storage.from('room-images').upload(filename, buffer, { contentType: 'image/png' });
          if (!error) {
            img = supabase.storage.from('room-images').getPublicUrl(filename).data.publicUrl;
          }
        }
        newImages.push(img);
      }
      if (changed) {
        await supabase.from('rooms').update({ images: newImages }).eq('id', r.id);
        console.log(`Updated room ${r.id}`);
      }
    }
  }
  console.log("Done!");
}

migrate();
