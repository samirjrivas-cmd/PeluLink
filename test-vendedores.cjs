const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });
dotenv.config();

const code = fs.readFileSync('./src/supabaseClient.js', 'utf8');
const urlMatch = code.match(/VITE_SUPABASE_URL \|\| ['"](.*?)['"]/);
const keyMatch = code.match(/VITE_SUPABASE_ANON_KEY \|\| ['"](.*?)['"]/);
const url = process.env.VITE_SUPABASE_URL || (urlMatch ? urlMatch[1] : null);
const key = process.env.VITE_SUPABASE_ANON_KEY || (keyMatch ? keyMatch[1] : null);

console.log(url, key);
if (url && key) {
  const supabase = createClient(url, key);
  supabase.from('vendedores').select('*').limit(5).then(res => console.log(res));
}
