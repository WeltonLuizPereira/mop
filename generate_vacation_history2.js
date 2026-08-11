import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rolbbkazwcgwjtjadrsn.supabase.co';
const supabaseKey = 'sb_publishable_6cWWXvLZJRu6KzkhT4W67g_ZLA1z_0e';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: history } = await supabase.from('mop_history').select('*');
    if (!history) return;

    const { data: collabs } = await supabase.from('mop_collaborators').select('matricula, nome');
    if (!collabs) return;

    const nameToMatricula = {};
    collabs.forEach(c => {
        nameToMatricula[c.nome] = c.matricula;
    });

    const inserts = [];

    // Process history
    for (const log of history) {
        if (log.details && log.details.includes('Início Férias') && log.details.includes('Fim Férias')) {
            const details = log.details;
            let startMatch = details.match(/Início Férias:.*?para\s*'([\d/]+)'/);
            let endMatch = details.match(/Fim Férias:.*?para\s*'([\d/]+)'/);
            
            if (startMatch && endMatch) {
                const matricula = nameToMatricula[log.target];
                if (matricula) {
                    const start_date_br = startMatch[1]; // DD/MM/YYYY
                    const end_date_br = endMatch[1];
                    
                    const start_parts = start_date_br.split('/');
                    const end_parts = end_date_br.split('/');
                    
                    if (start_parts.length === 3 && end_parts.length === 3) {
                        const start_date = `${start_parts[2]}-${start_parts[1]}-${start_parts[0]}`;
                        const end_date = `${end_parts[2]}-${end_parts[1]}-${end_parts[0]}`;
                        inserts.push(`INSERT INTO mop_vacation_history (collaborator_matricula, start_date, end_date) VALUES ('${matricula}', '${start_date}', '${end_date}');`);
                    }
                }
            }
        }
    }

    if (inserts.length > 0) {
        console.log(inserts.join('\n'));
    } else {
        console.log('-- Nenhuma alteração de férias encontrada.');
    }
}

run();
