import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { LotteryType } from '../types';
import { getAnimalByDezena, JOGO_DO_BICHO_ANIMAIS } from '../config/jogoDoBichoConfig';

export interface AtrasadoInfo {
  tipo: 'dezena' | 'centena' | 'milhar' | 'animal';
  valor: string; // dezena (00-99), centena (000-999), milhar (0000-9999), ou animal (nome)
  grupo?: string; // grupo do animal (se for animal)
  sorteiosAtrasado: number; // Quantidade de sorteios sem aparecer
  ultimaVez: string; // Data da última vez que apareceu
  ultimaPosicao?: number; // Posição que apareceu (1º, 2º, etc)
}

export class AtrasadosService {
  private db = getDatabase();

  /**
   * Calcula atrasados baseado em QUANTIDADE DE SORTEIOS (não dias)
   * Calcula para: dezena, centena, milhar e animal
   */
  async calcularAtrasados(
    lotteryType: LotteryType,
    sorteiosMinimos: number = 10
  ): Promise<AtrasadoInfo[]> {
    try {
      logger.info(`Calculando atrasados para ${lotteryType} (mínimo ${sorteiosMinimos} sorteios)`);

      // Buscar todos os resultados dessa loteria ordenados por data
      const results = await this.db.all(
        `SELECT * FROM lottery_results 
         WHERE lottery_type = ? AND status = 'active'
         ORDER BY date ASC`,
        [lotteryType]
      );

      if (results.length === 0) {
        logger.warn(`Nenhum resultado encontrado para ${lotteryType}`);
        return [];
      }

      // Mapear todos os valores que apareceram e em qual sorteio
      const dezenasMap = new Map<string, number>(); // dezena -> último sorteio index
      const centenasMap = new Map<string, number>();
      const milharesMap = new Map<string, number>();
      const animaisMap = new Map<string, { ultimoSorteio: number; grupo: string }>();

      // Processar cada resultado (sorteio)
      results.forEach((result, index) => {
        const resultsData = JSON.parse(result.results);
        const posicoes = ['first', 'second', 'third', 'fourth', 'fifth'] as const;
        
        posicoes.forEach(pos => {
          const milhar = resultsData[pos];
          if (milhar && milhar.length === 4) {
            // Atualizar milhar
            milharesMap.set(milhar, index);

            // Extrair centena (últimos 3 dígitos)
            const centena = milhar.slice(-3);
            centenasMap.set(centena, index);

            // Extrair dezena (últimos 2 dígitos)
            const dezena = milhar.slice(-2);
            dezenasMap.set(dezena, index);

            // Obter animal e grupo
            try {
              const dezena = parseInt(milhar.slice(-2));
              const animal = getAnimalByDezena(dezena);
              if (animal) {
                animaisMap.set(animal.nome, { ultimoSorteio: index, grupo: animal.grupo.toString().padStart(2, '0') });
              }
            } catch (error) {
              // Ignorar erro
            }
          }
        });
      });

      const totalSorteios = results.length;
      const atrasados: AtrasadoInfo[] = [];

      // Calcular atrasados de MILHARES
      for (let i = 0; i <= 9999; i++) {
        const milhar = i.toString().padStart(4, '0');
        const ultimoSorteio = milharesMap.get(milhar);
        const sorteiosAtrasado = ultimoSorteio !== undefined 
          ? totalSorteios - 1 - ultimoSorteio 
          : totalSorteios; // Se nunca saiu, está atrasado desde o início

        if (sorteiosAtrasado >= sorteiosMinimos) {
          const ultimaVez = ultimoSorteio !== undefined 
            ? results[ultimoSorteio].date 
            : 'nunca';
          
          atrasados.push({
            tipo: 'milhar',
            valor: milhar,
            sorteiosAtrasado,
            ultimaVez
          });
        }
      }

      // Calcular atrasados de CENTENAS
      for (let i = 0; i <= 999; i++) {
        const centena = i.toString().padStart(3, '0');
        const ultimoSorteio = centenasMap.get(centena);
        const sorteiosAtrasado = ultimoSorteio !== undefined 
          ? totalSorteios - 1 - ultimoSorteio 
          : totalSorteios;

        if (sorteiosAtrasado >= sorteiosMinimos) {
          const ultimaVez = ultimoSorteio !== undefined 
            ? results[ultimoSorteio].date 
            : 'nunca';
          
          atrasados.push({
            tipo: 'centena',
            valor: centena,
            sorteiosAtrasado,
            ultimaVez
          });
        }
      }

      // Calcular atrasados de DEZENAS
      for (let i = 0; i <= 99; i++) {
        const dezena = i.toString().padStart(2, '0');
        const ultimoSorteio = dezenasMap.get(dezena);
        const sorteiosAtrasado = ultimoSorteio !== undefined 
          ? totalSorteios - 1 - ultimoSorteio 
          : totalSorteios;

        if (sorteiosAtrasado >= sorteiosMinimos) {
          const ultimaVez = ultimoSorteio !== undefined 
            ? results[ultimoSorteio].date 
            : 'nunca';
          
          atrasados.push({
            tipo: 'dezena',
            valor: dezena,
            sorteiosAtrasado,
            ultimaVez
          });
        }
      }

      // Calcular atrasados de ANIMAIS
      const animais = JOGO_DO_BICHO_ANIMAIS.map(a => a.nome);

      animais.forEach(animal => {
        const info = animaisMap.get(animal);
        const sorteiosAtrasado = info !== undefined 
          ? totalSorteios - 1 - info.ultimoSorteio 
          : totalSorteios;

        if (sorteiosAtrasado >= sorteiosMinimos) {
          const ultimaVez = info !== undefined 
            ? results[info.ultimoSorteio].date 
            : 'nunca';
          
          atrasados.push({
            tipo: 'animal',
            valor: animal,
            grupo: info?.grupo,
            sorteiosAtrasado,
            ultimaVez
          });
        }
      });

      // Ordenar por quantidade de sorteios atrasado (mais atrasados primeiro)
      atrasados.sort((a, b) => b.sorteiosAtrasado - a.sorteiosAtrasado);

      logger.info(`Encontrados ${atrasados.length} atrasados para ${lotteryType}`);
      return atrasados;

    } catch (error) {
      logger.error(`Erro ao calcular atrasados para ${lotteryType}:`, error);
      return [];
    }
  }

  /**
   * Calcula atrasados por tipo específico
   */
  async calcularAtrasadosPorTipo(
    lotteryType: LotteryType,
    tipo: 'dezena' | 'centena' | 'milhar' | 'animal',
    sorteiosMinimos: number = 10
  ): Promise<AtrasadoInfo[]> {
    const todos = await this.calcularAtrasados(lotteryType, sorteiosMinimos);
    return todos.filter(a => a.tipo === tipo);
  }

  /**
   * Calcula atrasados para todas as loterias
   */
  async calcularTodosAtrasados(sorteiosMinimos: number = 10): Promise<Map<LotteryType, AtrasadoInfo[]>> {
    const allAtrasados = new Map<LotteryType, AtrasadoInfo[]>();

    const lotteryTypes = Object.values(LotteryType);

    for (const type of lotteryTypes) {
      const atrasados = await this.calcularAtrasados(type, sorteiosMinimos);
      if (atrasados.length > 0) {
        allAtrasados.set(type, atrasados);
      }
    }

    return allAtrasados;
  }

  /**
   * Busca top N mais atrasados de cada tipo
   */
  async getTopAtrasados(
    lotteryType: LotteryType,
    top: number = 10,
    sorteiosMinimos: number = 10
  ): Promise<{
    dezenas: AtrasadoInfo[];
    centenas: AtrasadoInfo[];
    milhares: AtrasadoInfo[];
    animais: AtrasadoInfo[];
  }> {
    const todos = await this.calcularAtrasados(lotteryType, sorteiosMinimos);

    return {
      dezenas: todos.filter(a => a.tipo === 'dezena').slice(0, top),
      centenas: todos.filter(a => a.tipo === 'centena').slice(0, top),
      milhares: todos.filter(a => a.tipo === 'milhar').slice(0, top),
      animais: todos.filter(a => a.tipo === 'animal').slice(0, top)
    };
  }
}

export const atrasadosService = new AtrasadosService();
