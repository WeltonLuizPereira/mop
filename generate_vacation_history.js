import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rolbbkazwcgwjtjadrsn.supabase.co';
const supabaseKey = 'sb_publishable_6cWWXvLZJRu6KzkhT4W67g_ZLA1z_0e';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('-- Extraindo histórico de férias...');
    const { data: history, error: hError } = await supabase.from('mop_history').select('*');
    if (hError) {
        console.error('-- Erro ao buscar history:', hError);
        return;
    }

    const { data: collabs, error: cError } = await supabase.from('mop_collaborators').select('matricula, nome');
    if (cError) {
        console.error('-- Erro ao buscar colaboradores:', cError);
        return;
    }

    const nameToMatricula = {};
    collabs.forEach(c => {
        nameToMatricula[c.nome] = c.matricula;
    });

    const inserts = [];

    // Process history
    for (const log of history) {
        if (log.details && log.details.includes('Início Férias') && log.details.includes('Fim Férias')) {
            // Exemplo de details: "Início Férias: Vazio -> 2023-10-01; Fim Férias: Vazio -> 2023-10-30"
            const details = log.details;
            let startMatch = details.match(/Início Férias:.*?->\s*([\d-]+)/);
            let endMatch = details.match(/Fim Férias:.*?->\s*([\d-]+)/);
            
            // Check if they are valid dates (not 'Vazio')
            if (startMatch && endMatch && startMatch[1] !== 'Vazio' && endMatch[1] !== 'Vazio') {
                const matricula = nameToMatricula[log.target];
                if (matricula) {
                    const start_date = startMatch[1];
                    const end_date = endMatch[1];
                    if (start_date.length === 10 && end_date.length === 10) {
                        inserts.push(`INSERT INTO mop_vacation_history (collaborator_matricula, start_date, end_date) VALUES ('${matricula}', '${start_date}', '${end_date}');`);
                    }
                }
            }
        }
    }

    if (inserts.length > 0) {
        console.log(inserts.join('\n'));
    } else {
        console.log('-- Nenhuma alteração de férias encontrada no histórico que possua Início e Fim válidos e nome mapeável.');
    }
}

run();
