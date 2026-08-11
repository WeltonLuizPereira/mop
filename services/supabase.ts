
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rolbbkazwcgwjtjadrsn.supabase.co';
const supabaseKey = 'sb_publishable_6cWWXvLZJRu6KzkhT4W67g_ZLA1z_0e';

export const supabase = createClient(supabaseUrl, supabaseKey);
