import { ResultadoFacilScraper } from './src/scrapers/ResultadoFacilScraper';
import { getYesterdayDateFormatted } from './src/config/resultadoFacilBancasConfig';

async function testScraper() {
    console.log('🧪 Testando ResultadoFacilScraper\n');

    const scraper = new ResultadoFacilScraper();
    const yesterday = getYesterdayDateFormatted();

    console.log(`📅 Buscando resultados de: ${yesterday}\n`);

    try {
        console.log('🔄 Iniciando scrape...\n');
        const results = await scraper.scrapeResultadoFacil(yesterday);

        console.log(`\n✅ Scrape concluído!`);
        console.log(`📊 Total de resultados encontrados: ${results.length}\n`);

        if (results.length > 0) {
            console.log('📋 Primeiros 5 resultados:\n');
            results.slice(0, 5).forEach((result, index) => {
                console.log(`${index + 1}. ${result.lotteryName} - ${result.time || 'Sem horário'}`);
                console.log(`   Prêmios: ${result.prizes.length}`);
                if (result.prizes.length > 0) {
                    console.log(`   1º: ${result.prizes[0].number} - ${result.prizes[0].animal}`);
                }
                console.log('');
            });
        } else {
            console.log('⚠️ Nenhum resultado encontrado. Isso pode indicar:');
            console.log('   - A estrutura HTML do site mudou');
            console.log('   - Os seletores precisam ser ajustados');
            console.log('   - Não há resultados para a data especificada');
        }

    } catch (error) {
        console.error('❌ Erro ao executar scrape:', error);
    }
}

testScraper();
