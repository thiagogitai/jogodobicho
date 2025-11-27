import {
    getAllBancas,
    getResultadoFacilUrl,
    getCurrentDateFormatted,
    getYesterdayDateFormatted
} from './src/config/resultadoFacilBancasConfig';

console.log('🔍 Testando geração de URLs do Resultado Fácil\n');

const hoje = getCurrentDateFormatted();
const ontem = getYesterdayDateFormatted();

console.log(`📅 Data de hoje: ${hoje}`);
console.log(`📅 Data de ontem: ${ontem}\n`);

const bancas = getAllBancas();

console.log(`📊 Total de bancas configuradas: ${bancas.length}\n`);

console.log('🔗 URLs geradas para ONTEM:\n');

bancas.forEach((banca, index) => {
    try {
        const url = getResultadoFacilUrl(banca.key, ontem);
        console.log(`${index + 1}. ${banca.displayName}`);
        console.log(`   ${url}`);
        console.log(`   Horários: ${banca.todosHorarios.join(', ') || 'Não configurado'}\n`);
    } catch (error) {
        console.error(`❌ Erro ao gerar URL para ${banca.displayName}: ${error}`);
    }
});

console.log('\n✅ Teste de URLs concluído!');
