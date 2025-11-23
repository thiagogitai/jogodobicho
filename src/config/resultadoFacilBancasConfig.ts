/**
 * Configuração completa das bancas do Resultado Fácil
 * Horários extraídos de: https://www.resultadofacil.com.br/horarios-jogo-do-bicho
 * IMPORTANTE: Horários variam por dia da semana!
 */

import { LotteryType } from '../types';

export interface HorarioPorDia {
  dia: string;
  horarios: string[];
}

export interface BancaConfig {
  key: string;
  name: string;
  displayName: string;
  urlPattern: string;
  horariosPorDia: HorarioPorDia[];
  todosHorarios: string[];
  estado?: string;
  lotteryType?: LotteryType;
  hasEstado: boolean;
}

/**
 * Mapeamento completo de todas as bancas do Resultado Fácil
 * Horários mapeados POR DIA DA SEMANA
 */
export const RESULTADO_FACIL_BANCAS: Record<string, BancaConfig> = {
  'MALUCA_BAHIA': {
    key: 'MALUCA_BAHIA',
    name: 'MALUCA',
    displayName: 'MALUCA BAHIA',
    urlPattern: 'resultados-maluca-bahia-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "19:00",
                        "21:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "19:00",
                        "21:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "21:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "19:00",
                        "21:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "19:00",
                        "21:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "10:00",
                        "12:00",
                        "15:00",
                        "21:00"
                  ]
            }
      ],
    todosHorarios: ["10:00","12:00","15:00","19:00","21:00"],
    estado: 'BA',
    hasEstado: true,
    lotteryType: undefined
  },
  'LOTECE': {
    key: 'LOTECE',
    name: 'LOTECE',
    displayName: 'LOTECE - CE',
    urlPattern: 'resultados-lotece---loteria-dos-sonhos-do-dia',
    horariosPorDia: [
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "11:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "11:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "11:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "11:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "11:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "12:00",
                        "14:00",
                        "15:45",
                        "19:00"
                  ]
            }
      ],
    todosHorarios: ["11:00","12:00","14:00","15:45","19:00"],
    estado: 'CE',
    hasEstado: false,
    lotteryType: LotteryType.LOTECE
  },
  'LBR': {
    key: 'LBR',
    name: 'LBR',
    displayName: 'LBR - BRASÍLIA',
    urlPattern: 'resultados-lbr-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "18:40",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "08:30",
                        "10:00",
                        "15:00",
                        "17:00",
                        "18:40",
                        "19:00",
                        "20:40",
                        "22:00",
                        "23:00"
                  ]
            }
      ],
    todosHorarios: ["08:30","10:00","15:00","17:00","18:40","19:00","20:40","22:00","23:00"],
    estado: 'DF',
    hasEstado: false,
    lotteryType: undefined
  },
  'LOOK_LOTERIAS': {
    key: 'LOOK_LOTERIAS',
    name: 'S',
    displayName: 'LOOK LOTERIAS - GO',
    urlPattern: 'resultados-look-loterias-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "07:00",
                        "09:00",
                        "11:00",
                        "14:00",
                        "16:00",
                        "18:00",
                        "21:00",
                        "23:00"
                  ]
            }
      ],
    todosHorarios: ["07:00","09:00","11:00","14:00","16:00","18:00","21:00","23:00"],
    estado: 'GO',
    hasEstado: false,
    lotteryType: LotteryType.LOOK_GO
  },
  'MINAS_MG': {
    key: 'MINAS_MG',
    name: 'MINAS DIA',
    displayName: 'MINAS GERAIS',
    urlPattern: 'resultados-minas-mg-do-dia',
    horariosPorDia: [
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "15:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "15:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "15:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "15:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "15:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "15:00"
                  ]
            }
      ],
    todosHorarios: ["15:00"],
    estado: 'MG',
    hasEstado: true,
    lotteryType: LotteryType.MINAS_GERAIS
  },
  'MINAS_MG': {
    key: 'MINAS_MG',
    name: 'MINAS NOITE',
    displayName: 'MINAS GERAIS',
    urlPattern: 'resultados-minas-mg-do-dia',
    horariosPorDia: [
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "19:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "19:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "19:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "19:00"
                  ]
            }
      ],
    todosHorarios: ["19:00"],
    estado: 'MG',
    hasEstado: true,
    lotteryType: LotteryType.MINAS_GERAIS
  },
  'CAMPINA_GRANDE_PB': {
    key: 'CAMPINA_GRANDE_PB',
    name: 'CAMPINA GRANDE',
    displayName: 'CAMPINA GRANDE - PB',
    urlPattern: 'resultados-campina-grande-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "09:45",
                        "10:45",
                        "12:45",
                        "15:45",
                        "19:05"
                  ]
            }
      ],
    todosHorarios: ["09:45","10:45","12:45","15:45","19:05"],
    estado: 'PB',
    hasEstado: true,
    lotteryType: undefined
  },
  'LOTEP': {
    key: 'LOTEP',
    name: 'LOTEP',
    displayName: 'LOTEP - PB',
    urlPattern: 'resultados-lotep-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "10:45",
                        "12:45"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "10:45",
                        "12:45",
                        "15:45",
                        "18:00"
                  ]
            }
      ],
    todosHorarios: ["10:45","12:45","15:45","18:00"],
    estado: 'PB',
    hasEstado: false,
    lotteryType: LotteryType.LOTEP
  },
  'PT_RIO': {
    key: 'PT_RIO',
    name: 'DEU NO POSTE',
    displayName: 'PT RIO',
    urlPattern: 'resultados-pt-rio-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "18:20",
                        "21:20"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "18:20",
                        "21:20"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "21:20"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "18:20",
                        "21:20"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "18:20",
                        "21:20"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "09:20",
                        "11:00",
                        "14:20",
                        "16:00",
                        "21:20"
                  ]
            }
      ],
    todosHorarios: ["09:20","11:00","14:20","16:00","18:20","21:20"],
    estado: 'RJ',
    hasEstado: true,
    lotteryType: LotteryType.RIO_DE_JANEIRO
  },
  'ABAESE_ITABAIANA_PARATODOS': {
    key: 'ABAESE_ITABAIANA_PARATODOS',
    name: 'ABAESE PARATODOS',
    displayName: 'ABAESE - ITABAIANA PARATODOS',
    urlPattern: 'resultados-abaese---itabaiana-paratodos-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "14:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00",
                        "19:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00",
                        "19:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00",
                        "19:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00",
                        "19:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "10:00",
                        "13:00",
                        "16:00"
                  ]
            }
      ],
    todosHorarios: ["10:00","13:00","14:00","16:00","19:00"],
    estado: 'SE',
    hasEstado: true,
    lotteryType: undefined
  },
  'PT_SP': {
    key: 'PT_SP',
    name: 'SP',
    displayName: 'PT SÃO PAULO',
    urlPattern: 'resultados-pt-sp-do-dia',
    horariosPorDia: [
            {
                  "dia": "Domingo",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "18:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Segunda-feira",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Terça-feira",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Quarta-feira",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "18:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Quinta-feira",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Sexta-feira",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "19:00",
                        "20:00"
                  ]
            },
            {
                  "dia": "Sábado",
                  "horarios": [
                        "08:00",
                        "10:00",
                        "12:00",
                        "13:00",
                        "15:30",
                        "17:00",
                        "18:00",
                        "19:00",
                        "20:00"
                  ]
            }
      ],
    todosHorarios: ["08:00","10:00","12:00","13:00","15:30","17:00","18:00","19:00","20:00"],
    estado: 'SP',
    hasEstado: true,
    lotteryType: LotteryType.PT_SP
  }
};

/**
 * Base URL do Resultado Fácil
 */
export const RESULTADO_FACIL_BASE_URL = 'https://www.resultadofacil.com.br';

/**
 * Gera URL completa para uma banca e data específica
 * SEMPRE usa a data atual se não fornecida
 */
export function getResultadoFacilUrl(bancaKey: string, date?: string): string {
  const banca = RESULTADO_FACIL_BANCAS[bancaKey];
  if (!banca) {
    throw new Error(`Banca não encontrada: ${bancaKey}`);
  }

  // SEMPRE usar data atual se não fornecida
  const targetDate = date || getCurrentDateFormatted();
  
  const url = `${RESULTADO_FACIL_BASE_URL}/${banca.urlPattern}-${targetDate}`;
  return url;
}

/**
 * Retorna data atual no formato YYYY-MM-DD
 */
export function getCurrentDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna data de ontem no formato YYYY-MM-DD
 */
export function getYesterdayDateFormatted(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtém horários de uma banca para um dia específico da semana
 */
export function getHorariosPorDia(bancaKey: string, diaSemana: string): string[] {
  const banca = RESULTADO_FACIL_BANCAS[bancaKey];
  if (!banca) {
    return [];
  }
  
  const diaObj = banca.horariosPorDia.find(d => d.dia === diaSemana);
  return diaObj ? diaObj.horarios : [];
}

/**
 * Obtém horários de uma banca para o dia atual
 */
export function getHorariosHoje(bancaKey: string): string[] {
  const hoje = new Date();
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaAtual = dias[hoje.getDay()];
  return getHorariosPorDia(bancaKey, diaAtual);
}

/**
 * Gera expressões cron para agendamento baseado nos horários da banca
 * Considera o dia da semana atual
 */
export function getCronExpressionsForBanca(bancaKey: string, diaSemana?: string): string[] {
  const banca = RESULTADO_FACIL_BANCAS[bancaKey];
  if (!banca) {
    return [];
  }

  const horarios = diaSemana 
    ? getHorariosPorDia(bancaKey, diaSemana)
    : banca.todosHorarios;

  // Mapear dia da semana para número do cron (0 = domingo, 1 = segunda, etc)
  const diaNum = diaSemana 
    ? ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].indexOf(diaSemana)
    : undefined;

  return horarios.map(horario => {
    const [hour, minute] = horario.split(':');
    const minuto = minute || '0';
    
    // Se especificou dia, criar cron para aquele dia específico
    if (diaNum !== undefined) {
      return `${minuto} ${hour} * * ${diaNum}`;
    }
    
    // Caso contrário, criar para todos os dias
    return `${minuto} ${hour} * * *`;
  });
}

/**
 * Retorna todas as bancas configuradas
 */
export function getAllBancas(): BancaConfig[] {
  return Object.values(RESULTADO_FACIL_BANCAS);
}

/**
 * Retorna bancas por estado
 */
export function getBancasByEstado(estado: string): BancaConfig[] {
  return getAllBancas().filter(banca => banca.estado === estado);
}

/**
 * Retorna bancas nacionais (sem estado)
 */
export function getBancasNacionais(): BancaConfig[] {
  return getAllBancas().filter(banca => !banca.hasEstado);
}

/**
 * Retorna próximo horário de sorteio de uma banca para hoje
 */
export function getNextScheduleTime(bancaKey: string): Date | null {
  const banca = RESULTADO_FACIL_BANCAS[bancaKey];
  if (!banca) {
    return null;
  }

  const hoje = new Date();
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaAtual = dias[hoje.getDay()];
  
  const horariosHoje = getHorariosPorDia(bancaKey, diaAtual);
  if (horariosHoje.length === 0) {
    return null;
  }

  const nowMinutes = hoje.getHours() * 60 + hoje.getMinutes();
  
  // Encontrar próximo horário de hoje
  const proximoHoje = horariosHoje
    .map(h => {
      const [hour, minute] = h.split(':').map(Number);
      return hour * 60 + (minute || 0);
    })
    .filter(m => m > nowMinutes)
    .sort((a, b) => a - b)[0];

  if (proximoHoje) {
    const nextDate = new Date(hoje);
    nextDate.setHours(Math.floor(proximoHoje / 60), proximoHoje % 60, 0, 0);
    return nextDate;
  }

  // Se não há mais horários hoje, usar o primeiro de amanhã
  const primeiroAmanha = horariosHoje
    .map(h => {
      const [hour, minute] = h.split(':').map(Number);
      return hour * 60 + (minute || 0);
    })
    .sort((a, b) => a - b)[0];

  if (primeiroAmanha) {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(Math.floor(primeiroAmanha / 60), primeiroAmanha % 60, 0, 0);
    return amanha;
  }

  return null;
}
