import { supabase } from './src/supabaseClient.js';
async function test() {
  const { data, error } = await supabase.from('servicios').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}
test();
