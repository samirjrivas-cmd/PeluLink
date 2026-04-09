const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('./src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/createClient\(['"](.*?)['"]/);
const keyMatch = code.match(/,\s*['"](.*?)['"]/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

supabase.from('reservas').select('*').limit(5).then(res => {
  console.log(res);
});
