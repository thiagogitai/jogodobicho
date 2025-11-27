import { ResultadoFacilScraper } from '../scrapers/ResultadoFacilScraper';
import { DateUtils } from '../utils/DateUtils';
import { logger } from '../utils/logger';

async function scrapeToday() {
    try {
        const scraper = new ResultadoFacilScraper();
        const today = DateUtils.getToday(); // YYYY-MM-DD

        console.log(`Iniciando scrape para hoje: ${today}`);
        const results = await scraper.scrapeResultadoFacil(today);

        console.log(`Encontrados ${results.length} resultados.`);
        // console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Erro ao fazer scrape:', error);
    }
}

if (require.main === module) {
    scrapeToday();
}
