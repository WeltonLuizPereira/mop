import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rolbbkazwcgwjtjadrsn.supabase.co';
const supabaseKey = 'sb_publishable_6cWWXvLZJRu6KzkhT4W67g_ZLA1z_0e';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: history } = await supabase.from('mop_history').select('*');
    if (!history) return;
    
    for (const log of history) {
        if (log.details && (log.details.includes('Férias') || log.details.includes('ferias'))) {
            console.log(`[${log.target}] ${log.details}`);
        }
    }
}
run();
