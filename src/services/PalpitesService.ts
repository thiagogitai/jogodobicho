import { logger } from '../utils/logger';
import { getAnimalByDezena, getAnimalByNome, JOGO_DO_BICHO_ANIMAIS, AnimalConfig } from '../config/jogoDoBichoConfig';
import { atrasadosService } from './AtrasadosService';
import { LotteryType } from '../types';

export interface Palpite {
  tipo: 'dezena' | 'centena' | 'milhar' | 'animal';
  valor: string;
  grupo?: string;
  animal?: string;
  motivo?: string; // Por que foi escolhido (ex: "muito atrasado", "aleatório")
}

export interface PalpiteCompleto {
  dezenas: Palpite[];
  centenas: Palpite[];
  milhares: Palpite[];
  animais: Palpite[];
  geradoEm: string;
  lotteryType?: LotteryType;
}

export class PalpitesService {
  /**
   * Gera palpites aleatórios
   */
  gerarPalpitesAleatorios(
    quantidadeDezenas: number = 5,
    quantidadeCentenas: number = 5,
    quantidadeMilhares: number = 5,
    quantidadeAnimais: number = 5
  ): PalpiteCompleto {
    const palpites: PalpiteCompleto = {
      dezenas: [],
      centenas: [],
      milhares: [],
      animais: [],
      geradoEm: new Date().toISOString()
    };

    // Gerar dezenas aleatórias (00-99)
    const dezenasGeradas = new Set<string>();
    while (dezenasGeradas.size < quantidadeDezenas) {
      const dezena = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      dezenasGeradas.add(dezena);
    }
    palpites.dezenas = Array.from(dezenasGeradas).map(d => ({
      tipo: 'dezena',
      valor: d,
      motivo: 'aleatório'
    }));

    // Gerar centenas aleatórias (000-999)
    const centenasGeradas = new Set<string>();
    while (centenasGeradas.size < quantidadeCentenas) {
      const centena = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      centenasGeradas.add(centena);
    }
    palpites.centenas = Array.from(centenasGeradas).map(c => ({
      tipo: 'centena',
      valor: c,
      motivo: 'aleatório'
    }));

    // Gerar milhares aleatórios (0000-9999)
    const milharesGerados = new Set<string>();
    while (milharesGerados.size < quantidadeMilhares) {
      const milhar = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      milharesGerados.add(milhar);
    }
    palpites.milhares = Array.from(milharesGerados).map(m => {
      try {
        const dezena = parseInt(m.slice(-2));
        const animal = getAnimalByDezena(dezena);
        return {
          tipo: 'milhar',
          valor: m,
          grupo: animal?.grupo.toString().padStart(2, '0'),
          animal: animal?.nome,
          motivo: 'aleatório'
        };
      } catch {
        return {
          tipo: 'milhar',
          valor: m,
          motivo: 'aleatório'
        };
      }
    });

    // Gerar animais aleatórios
    const animaisGerados = new Set<string>();
    while (animaisGerados.size < quantidadeAnimais && animaisGerados.size < JOGO_DO_BICHO_ANIMAIS.length) {
      const animal = JOGO_DO_BICHO_ANIMAIS[Math.floor(Math.random() * JOGO_DO_BICHO_ANIMAIS.length)];
      animaisGerados.add(animal.nome);
    }
    palpites.animais = Array.from(animaisGerados).map(animalName => {
      const animal = getAnimalByNome(animalName);
      return {
        tipo: 'animal',
        valor: animalName,
        grupo: animal?.grupo.toString().padStart(2, '0'),
        animal: animalName,
        motivo: 'aleatório'
      };
    });

    return palpites;
  }

  /**
   * Gera palpites baseados em números atrasados
   */
  async gerarPalpitesPorAtrasados(
    lotteryType: LotteryType,
    quantidadeDezenas: number = 5,
    quantidadeCentenas: number = 5,
    quantidadeMilhares: number = 5,
    quantidadeAnimais: number = 5,
    sorteiosMinimos: number = 10
  ): Promise<PalpiteCompleto> {
    const topAtrasados = await atrasadosService.getTopAtrasados(
      lotteryType,
      Math.max(quantidadeDezenas, quantidadeCentenas, quantidadeMilhares, quantidadeAnimais),
      sorteiosMinimos
    );

    const palpites: PalpiteCompleto = {
      dezenas: topAtrasados.dezenas.slice(0, quantidadeDezenas).map(a => ({
        tipo: 'dezena',
        valor: a.valor,
        motivo: `${a.sorteiosAtrasado} sorteios atrasado`
      })),
      centenas: topAtrasados.centenas.slice(0, quantidadeCentenas).map(a => ({
        tipo: 'centena',
        valor: a.valor,
        motivo: `${a.sorteiosAtrasado} sorteios atrasado`
      })),
      milhares: topAtrasados.milhares.slice(0, quantidadeMilhares).map(a => {
        try {
          const dezena = parseInt(a.valor.slice(-2));
          const animal = getAnimalByDezena(dezena);
          return {
            tipo: 'milhar',
            valor: a.valor,
            grupo: animal?.grupo.toString().padStart(2, '0'),
            animal: animal?.nome,
            motivo: `${a.sorteiosAtrasado} sorteios atrasado`
          };
        } catch {
          return {
            tipo: 'milhar',
            valor: a.valor,
            motivo: `${a.sorteiosAtrasado} sorteios atrasado`
          };
        }
      }),
      animais: topAtrasados.animais.slice(0, quantidadeAnimais).map(a => ({
        tipo: 'animal',
        valor: a.valor,
        grupo: a.grupo,
        animal: a.valor,
        motivo: `${a.sorteiosAtrasado} sorteios atrasado`
      })),
      geradoEm: new Date().toISOString(),
      lotteryType
    };

    return palpites;
  }

  /**
   * Gera palpites mistos (aleatórios + atrasados)
   */
  async gerarPalpitesMistos(
    lotteryType: LotteryType,
    quantidadeDezenas: number = 5,
    quantidadeCentenas: number = 5,
    quantidadeMilhares: number = 5,
    quantidadeAnimais: number = 5,
    percentualAtrasados: number = 50 // 50% atrasados, 50% aleatórios
  ): Promise<PalpiteCompleto> {
    const aleatorios = this.gerarPalpitesAleatorios(
      quantidadeDezenas,
      quantidadeCentenas,
      quantidadeMilhares,
      quantidadeAnimais
    );

    const porAtrasados = await this.gerarPalpitesPorAtrasados(
      lotteryType,
      quantidadeDezenas,
      quantidadeCentenas,
      quantidadeMilhares,
      quantidadeAnimais
    );

    const qtdAtrasados = Math.floor((percentualAtrasados / 100) * quantidadeDezenas);

    return {
      dezenas: [
        ...porAtrasados.dezenas.slice(0, qtdAtrasados),
        ...aleatorios.dezenas.slice(0, quantidadeDezenas - qtdAtrasados)
      ],
      centenas: [
        ...porAtrasados.centenas.slice(0, qtdAtrasados),
        ...aleatorios.centenas.slice(0, quantidadeCentenas - qtdAtrasados)
      ],
      milhares: [
        ...porAtrasados.milhares.slice(0, qtdAtrasados),
        ...aleatorios.milhares.slice(0, quantidadeMilhares - qtdAtrasados)
      ],
      animais: [
        ...porAtrasados.animais.slice(0, qtdAtrasados),
        ...aleatorios.animais.slice(0, quantidadeAnimais - qtdAtrasados)
      ],
      geradoEm: new Date().toISOString(),
      lotteryType
    };
  }

  /**
   * Formata palpites para mensagem
   */
  formatarPalpitesParaMensagem(palpites: PalpiteCompleto): string {
    let mensagem = '🎯 *PALPITES DO DIA*\n\n';

    if (palpites.lotteryType) {
      mensagem += `📋 *${palpites.lotteryType}*\n\n`;
    }

    if (palpites.dezenas.length > 0) {
      mensagem += '🔹 *DEZENAS:*\n';
      palpites.dezenas.forEach(d => {
        mensagem += `   ${d.valor}${d.motivo ? ` (${d.motivo})` : ''}\n`;
      });
      mensagem += '\n';
    }

    if (palpites.centenas.length > 0) {
      mensagem += '🔹 *CENTENAS:*\n';
      palpites.centenas.forEach(c => {
        mensagem += `   ${c.valor}${c.motivo ? ` (${c.motivo})` : ''}\n`;
      });
      mensagem += '\n';
    }

    if (palpites.milhares.length > 0) {
      mensagem += '🔹 *MILHARES:*\n';
      palpites.milhares.forEach(m => {
        let linha = `   ${m.valor}`;
        if (m.animal) linha += ` - ${m.animal}`;
        if (m.grupo) linha += ` (Grupo ${m.grupo})`;
        if (m.motivo) linha += ` - ${m.motivo}`;
        mensagem += linha + '\n';
      });
      mensagem += '\n';
    }

    if (palpites.animais.length > 0) {
      mensagem += '🔹 *ANIMAIS:*\n';
      palpites.animais.forEach(a => {
        let linha = `   ${a.valor}`;
        if (a.grupo) linha += ` (Grupo ${a.grupo})`;
        if (a.motivo) linha += ` - ${a.motivo}`;
        mensagem += linha + '\n';
      });
      mensagem += '\n';
    }

    mensagem += `\n⏰ Gerado em: ${new Date(palpites.geradoEm).toLocaleString('pt-BR')}\n`;
    mensagem += `\n⚠️ *Lembre-se: Palpites são apenas sugestões. Jogue com responsabilidade!*`;

    return mensagem;
  }
}

export const palpitesService = new PalpitesService();

