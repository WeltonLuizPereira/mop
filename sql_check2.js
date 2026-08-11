import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rolbbkazwcgwjtjadrsn.supabase.co', 'sb_publishable_6cWWXvLZJRu6KzkhT4W67g_ZLA1z_0e');
async function run() {
    const { data, error } = await supabase.from('mop_scheduled_tasks').select('*').eq('status', 'PENDING');
    console.log("Pending Tasks:", data);
}
run();
