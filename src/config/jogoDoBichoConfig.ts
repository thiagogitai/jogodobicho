export interface AnimalConfig {
  grupo: number;
  nome: string;
  emoji: string;
  dezenas: number[];
}

export const JOGO_DO_BICHO_ANIMAIS: AnimalConfig[] = [
  { grupo: 1, nome: 'Avestruz', emoji: '🦩', dezenas: [1, 2, 3, 4] },
  { grupo: 2, nome: 'Águia', emoji: '🦅', dezenas: [5, 6, 7, 8] },
  { grupo: 3, nome: 'Burro', emoji: '🫏', dezenas: [9, 10, 11, 12] },
  { grupo: 4, nome: 'Borboleta', emoji: '🦋', dezenas: [13, 14, 15, 16] },
  { grupo: 5, nome: 'Cachorro', emoji: '🐕', dezenas: [17, 18, 19, 20] },
  { grupo: 6, nome: 'Cabra', emoji: '🐐', dezenas: [21, 22, 23, 24] },
  { grupo: 7, nome: 'Carneiro', emoji: '🐏', dezenas: [25, 26, 27, 28] },
  { grupo: 8, nome: 'Camelo', emoji: '🐪', dezenas: [29, 30, 31, 32] },
  { grupo: 9, nome: 'Cobra', emoji: '🐍', dezenas: [33, 34, 35, 36] },
  { grupo: 10, nome: 'Coelho', emoji: '🐇', dezenas: [37, 38, 39, 40] },
  { grupo: 11, nome: 'Cavalo', emoji: '🐎', dezenas: [41, 42, 43, 44] },
  { grupo: 12, nome: 'Elefante', emoji: '🐘', dezenas: [45, 46, 47, 48] },
  { grupo: 13, nome: 'Galo', emoji: '🐓', dezenas: [49, 50, 51, 52] },
  { grupo: 14, nome: 'Gato', emoji: '🐈', dezenas: [53, 54, 55, 56] },
  { grupo: 15, nome: 'Jacaré', emoji: '🦎', dezenas: [57, 58, 59, 60] },
  { grupo: 16, nome: 'Leão', emoji: '🦁', dezenas: [61, 62, 63, 64] },
  { grupo: 17, nome: 'Macaco', emoji: '🐒', dezenas: [65, 66, 67, 68] },
  { grupo: 18, nome: 'Porco', emoji: '🐖', dezenas: [69, 70, 71, 72] },
  { grupo: 19, nome: 'Pavão', emoji: '🦚', dezenas: [73, 74, 75, 76] },
  { grupo: 20, nome: 'Peru', emoji: '🦃', dezenas: [77, 78, 79, 80] },
  { grupo: 21, nome: 'Touro', emoji: '🐂', dezenas: [81, 82, 83, 84] },
  { grupo: 22, nome: 'Tigre', emoji: '🐅', dezenas: [85, 86, 87, 88] },
  { grupo: 23, nome: 'Urso', emoji: '🐻', dezenas: [89, 90, 91, 92] },
  { grupo: 24, nome: 'Veado', emoji: '🦌', dezenas: [93, 94, 95, 96] },
  { grupo: 25, nome: 'Vaca', emoji: '🐄', dezenas: [97, 98, 99, 100] }
];

export const getAnimalByDezena = (dezena: number): AnimalConfig | null => {
  return JOGO_DO_BICHO_ANIMAIS.find(animal => 
    animal.dezenas.includes(dezena)
  ) || null;
};

export const getAnimalByGrupo = (grupo: number): AnimalConfig | null => {
  return JOGO_DO_BICHO_ANIMAIS.find(animal => animal.grupo === grupo) || null;
};

export const getAnimalByNome = (nome: string): AnimalConfig | null => {
  return JOGO_DO_BICHO_ANIMAIS.find(animal => 
    animal.nome.toLowerCase() === nome.toLowerCase()
  ) || null;
};

export const formatAnimalInfo = (dezena: number): string => {
  const animal = getAnimalByDezena(dezena);
  if (!animal) return `${dezena.toString().padStart(4, '0')} - Animal não encontrado`;
  
  return `${dezena.toString().padStart(4, '0')} - ${animal.grupo.toString().padStart(2, '0')} ${animal.nome} ${animal.emoji}`;
};

export const getDiaDaSemana = (date: Date): string => {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return dias[date.getDay()] || 'Desconhecido';
};

export const formatarDataCompleta = (date: Date): string => {
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const ano = date.getFullYear();
  const diaSemana = getDiaDaSemana(date);
  
  return `${dia}/${mes}/${ano} (${diaSemana})`;
};

export const gerarMilhares = (quantidade: number = 15): string[] => {
  const milhares: string[] = [];
  
  for (let i = 0; i < quantidade; i++) {
    const milhar = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    milhares.push(milhar);
  }
  
  return milhares;
};

export const gerarCentenas = (quantidade: number = 15): string[] => {
  const centenas: string[] = [];
  
  for (let i = 0; i < quantidade; i++) {
    const centena = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    centenas.push(centena);
  }
  
  return centenas;
};

export const gerarPalpitesPorAnimal = (animais: string[]): Array<{animal: AnimalConfig, palpites: string[]}> => {
  const palpites: Array<{animal: AnimalConfig, palpites: string[]}> = [];
  
  for (const nomeAnimal of animais) {
    const animal = getAnimalByNome(nomeAnimal);
    if (animal) {
      const palpitesMilhar: string[] = [];
      
      // Gerar 4 palpites de milhar para cada animal (baseado nas dezenas do animal)
      for (let i = 0; i < 4; i++) {
        const dezenaBase = animal.dezenas[i % animal.dezenas.length] || 1;
        const milhar = (dezenaBase * 100 + Math.floor(Math.random() * 100)).toString().padStart(4, '0');
        palpitesMilhar.push(milhar);
      }
      
      palpites.push({
        animal,
        palpites: palpitesMilhar
      });
    }
  }
  
  return palpites;
};

export const calcularAtrasados = (resultadosRecentes: Array<{concurso: number, dezena: number, data: Date}>): Array<{animal: AnimalConfig, diasAtrasado: number}> => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const atrasados: Array<{animal: AnimalConfig, diasAtrasado: number}> = [];
  
  for (const animal of JOGO_DO_BICHO_ANIMAIS) {
    const ultimoResultado = resultadosRecentes
      .filter(r => animal.dezenas.includes(r.dezena))
      .sort((a, b) => b.data.getTime() - a.data.getTime())[0];
    
    if (ultimoResultado) {
      const dataResultado = new Date(ultimoResultado.data);
      dataResultado.setHours(0, 0, 0, 0);
      
      const diasAtrasado = Math.floor((hoje.getTime() - dataResultado.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAtrasado > 0) {
        atrasados.push({
          animal,
          diasAtrasado
        });
      }
    } else {
      // Animal nunca saiu (considerar como muito atrasado)
      atrasados.push({
        animal,
        diasAtrasado: 999
      });
    }
  }
  
  // Ordenar por dias atrasado (mais atrasado primeiro)
  return atrasados.sort((a, b) => b.diasAtrasado - a.diasAtrasado);
};