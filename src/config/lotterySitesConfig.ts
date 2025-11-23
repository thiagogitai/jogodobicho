export interface LotterySiteConfig {
  lotteryType: string;
  name: string;
  state: string;
  schedule: string[];
  url: string;
  backupUrls?: string[];
  format: {
    type: 'card' | 'table' | 'list' | 'text';
    expectedNumbers: number; // Quantidade de números esperados (5, 7, 10)
    digits: 3 | 4; // 3 ou 4 dígitos
    selectors: {
      container: string;
      numbers: string;
      date?: string;
      title?: string;
    };
  };
  keywords: string[]; // Palavras-chave para validar conteúdo
}

export const LOTTERY_SITES_CONFIG: LotterySiteConfig[] = [
  // FEDERAL
  {
    lotteryType: 'FEDERAL',
    name: 'FEDERAL',
    state: 'BRASIL',
    schedule: ['20:00'],
    url: 'https://amp.resultadofacil.com.br/federal',
    backupUrls: [
      'https://www.resultadofacil.com.br/federal',
      'https://jogodobicho.net/federal'
    ],
    format: {
      type: 'card',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-federal, .federal-result, .lottery-federal',
        numbers: '.number, .result-number, .prize-number',
        date: '.result-date, .date, .data-resultado',
        title: '.lottery-title, .title, h1, h2'
      }
    },
    keywords: ['federal', 'resultado federal', 'loteria federal']
  },

  // RIO DE JANEIRO
  {
    lotteryType: 'RIO_DE_JANEIRO',
    name: 'RIO DE JANEIRO',
    state: 'RJ',
    schedule: ['14:00', '19:00'],
    url: 'https://amp.resultadofacil.com.br/rio-de-janeiro',
    backupUrls: [
      'https://www.resultadofacil.com.br/rio-de-janeiro',
      'https://jogodobicho.net/rio-de-janeiro',
      'https://www.jb.com.br/rio-de-janeiro'
    ],
    format: {
      type: 'table',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-rio, .rio-result, .rj-result',
        numbers: '.result-number, .number, td:nth-child(2)',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['rio de janeiro', 'rj', 'bicho rio', 'resultado rio']
  },

  // LOOK GO
  {
    lotteryType: 'LOOK_GO',
    name: 'LOOK GO',
    state: 'GO',
    schedule: ['16:00'],
    url: 'https://amp.resultadofacil.com.br/goias',
    backupUrls: [
      'https://www.resultadofacil.com.br/goias',
      'https://jogodobicho.net/goias'
    ],
    format: {
      type: 'list',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-go, .goias-result, .look-go',
        numbers: 'li, .result-item, .number-item',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['look go', 'goiás', 'go', 'bicho goiás']
  },

  // PT SP (SÃO PAULO)
  {
    lotteryType: 'PT_SP',
    name: 'PT SÃO PAULO',
    state: 'SP',
    schedule: ['14:00', '20:00'],
    url: 'https://amp.resultadofacil.com.br/sao-paulo',
    backupUrls: [
      'https://www.resultadofacil.com.br/sao-paulo',
      'https://jogodobicho.net/sao-paulo',
      'https://www.jb.com.br/sao-paulo'
    ],
    format: {
      type: 'table',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-sp, .sp-result, .sao-paulo-result',
        numbers: '.result-number, .number, td:nth-child(2)',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['são paulo', 'sp', 'pt sp', 'bicho sp']
  },

  // NACIONAL
  {
    lotteryType: 'NACIONAL',
    name: 'NACIONAL',
    state: 'BRASIL',
    schedule: ['19:00'],
    url: 'https://amp.resultadofacil.com.br/nacional',
    backupUrls: [
      'https://www.resultadofacil.com.br/nacional',
      'https://jogodobicho.net/nacional'
    ],
    format: {
      type: 'card',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-nacional, .nacional-result',
        numbers: '.number, .result-number',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['nacional', 'bicho nacional', 'resultado nacional']
  },

  // MALUQUINHA RJ
  {
    lotteryType: 'MALUQUINHA_RJ',
    name: 'MALUQUINHA RIO',
    state: 'RJ',
    schedule: ['13:00', '18:00'],
    url: 'https://amp.resultadofacil.com.br/maluquinha-rio',
    backupUrls: [
      'https://www.resultadofacil.com.br/maluquinha-rio',
      'https://jogodobicho.net/maluquinha'
    ],
    format: {
      type: 'list',
      expectedNumbers: 7, // Maluquinha tem 7 prêmios
      digits: 4,
      selectors: {
        container: '.result-maluquinha, .maluquinha-result',
        numbers: 'li, .result-item, .number-item',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['maluquinha', 'maluquinha rio', 'bicho maluquinha']
  },

  // LOTEP (Piauí)
  {
    lotteryType: 'LOTEP',
    name: 'LOTEP',
    state: 'PI',
    schedule: ['15:00'],
    url: 'https://amp.resultadofacil.com.br/piaui',
    backupUrls: [
      'https://www.resultadofacil.com.br/piaui',
      'https://lotep.pi.gov.br'
    ],
    format: {
      type: 'table',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-piaui, .lotep-result, .pi-result',
        numbers: '.result-number, .number, td:nth-child(2)',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['lotep', 'piauí', 'pi', 'loteria piauí']
  },

  // LOTECE (Ceará)
  {
    lotteryType: 'LOTECE',
    name: 'LOTECE',
    state: 'CE',
    schedule: ['16:00'],
    url: 'https://amp.resultadofacil.com.br/ceara',
    backupUrls: [
      'https://www.resultadofacil.com.br/ceara',
      'https://www.lotece.ce.gov.br'
    ],
    format: {
      type: 'table',
      expectedNumbers: 10, // LOTECE tem 10 prêmios
      digits: 4,
      selectors: {
        container: '.result-ceara, .lotece-result, .ce-result',
        numbers: '.result-number, .number, td:nth-child(2)',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['lotece', 'ceará', 'ce', 'loteria ceará']
  },

  // MINAS GERAIS
  {
    lotteryType: 'MINAS_GERAIS',
    name: 'MINAS GERAIS',
    state: 'MG',
    schedule: ['13:00', '19:00'],
    url: 'https://amp.resultadofacil.com.br/minas-gerais',
    backupUrls: [
      'https://www.resultadofacil.com.br/minas-gerais',
      'https://jogodobicho.net/minas-gerais'
    ],
    format: {
      type: 'table',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-mg, .minas-result, .minas-gerais-result',
        numbers: '.result-number, .number, td:nth-child(2)',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['minas gerais', 'mg', 'bicho minas']
  },

  // BOA SORTE (Paraíba)
  {
    lotteryType: 'BOA_SORTE',
    name: 'BOA SORTE',
    state: 'PB',
    schedule: ['14:00'],
    url: 'https://amp.resultadofacil.com.br/paraiba',
    backupUrls: [
      'https://www.resultadofacil.com.br/paraiba',
      'https://jogodobicho.net/paraiba'
    ],
    format: {
      type: 'list',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-paraiba, .paraiba-result, .boa-sorte-result',
        numbers: 'li, .result-item, .number-item',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['boa sorte', 'paraíba', 'pb', 'bicho paraíba']
  },

  // LOTERIAS DA CAIXA
  {
    lotteryType: 'LOTERIAS_CAIXA',
    name: 'LOTERIAS CAIXA',
    state: 'BRASIL',
    schedule: ['20:00'],
    url: 'https://loterias.caixa.gov.br',
    backupUrls: [
      'https://www.loterias.caixa.gov.br',
      'https://resultadofacil.com.br/loterias-caixa'
    ],
    format: {
      type: 'table',
      expectedNumbers: 5,
      digits: 4,
      selectors: {
        container: '.result-loterias, .caixa-result, .loteria-result',
        numbers: '.result-number, .number, .dezena',
        date: '.result-date, .date',
        title: '.lottery-title, h1'
      }
    },
    keywords: ['loterias caixa', 'caixa', 'loteria federal']
  }
];

// Configurações específicas para diferentes formatos
export const FORMAT_DETECTION_RULES = {
  // Regras para detectar quantidade de números
  numberCountRules: [
    { pattern: /10[º°]/gi, count: 10, confidence: 0.9 }, // 10º, 10°
    { pattern: /7[º°]/gi, count: 7, confidence: 0.9 },   // 7º, 7°
    { pattern: /5[º°]/gi, count: 5, confidence: 0.8 },   // 5º, 5°
    { pattern: /1[º°]/gi, count: 1, confidence: 0.7 }    // 1º, 1°
  ],
  
  // Regras para detectar 3 ou 4 dígitos
  digitRules: [
    { pattern: /\d{4}/g, digits: 4, confidence: 0.9 }, // Números com 4 dígitos
    { pattern: /\d{3}/g, digits: 3, confidence: 0.8 }  // Números com 3 dígitos
  ],
  
  // Palavras-chave que indicam formato específico
  formatIndicators: {
    'maluquinha': { numbers: 7, digits: 4 },
    'lotece': { numbers: 10, digits: 4 },
    'federal': { numbers: 5, digits: 4 },
    'lotep': { numbers: 5, digits: 4 },
    'nacional': { numbers: 5, digits: 4 },
    'minas': { numbers: 5, digits: 4 },
    'rio': { numbers: 5, digits: 4 },
    'sp': { numbers: 5, digits: 4 },
    'go': { numbers: 5, digits: 4 },
    'paraíba': { numbers: 5, digits: 4 },
    'caixa': { numbers: 5, digits: 4 }
  }
};

// Horários específicos de cada loteria
export const LOTTERY_SCHEDULES = {
  'FEDERAL': ['20:00'],
  'RIO_DE_JANEIRO': ['14:00', '19:00'],
  'LOOK_GO': ['16:00'],
  'PT_SP': ['14:00', '20:00'],
  'NACIONAL': ['19:00'],
  'MALUQUINHA_RJ': ['13:00', '18:00'],
  'LOTEP': ['15:00'],
  'LOTECE': ['16:00'],
  'MINAS_GERAIS': ['13:00', '19:00'],
  'BOA_SORTE': ['14:00'],
  'LOTERIAS_CAIXA': ['20:00']
};

export function detectFormatFromContent(content: string, lotteryType: string): {
  numbers: number;
  digits: 3 | 4;
  confidence: number;
} {
  const contentLower = content.toLowerCase();
  let bestGuess = { numbers: 5, digits: 4, confidence: 0.5 };
  
  // Verificar indicadores específicos da loteria
  const typeLower = lotteryType.toLowerCase();
  for (const [keyword, format] of Object.entries(FORMAT_DETECTION_RULES.formatIndicators)) {
    if (typeLower.includes(keyword) || contentLower.includes(keyword)) {
      bestGuess = { ...format, confidence: 0.9 };
      break;
    }
  }
  
  // Detectar quantidade de números pelo conteúdo
  for (const rule of FORMAT_DETECTION_RULES.numberCountRules) {
    const matches = content.match(rule.pattern);
    if (matches && matches.length >= 3) { // Pelo menos 3 ocorrências
      bestGuess.numbers = rule.count;
      bestGuess.confidence = Math.max(bestGuess.confidence, rule.confidence);
      break;
    }
  }
  
  // Detectar dígitos
  const allNumbers = content.match(/\d+/g) || [];
  const fourDigitNumbers = allNumbers.filter(n => n.length === 4).length;
  const threeDigitNumbers = allNumbers.filter(n => n.length === 3).length;
  
  if (fourDigitNumbers > threeDigitNumbers * 2) {
    bestGuess.digits = 4 as 3 | 4;
    bestGuess.confidence = Math.max(bestGuess.confidence, 0.8);
  } else if (threeDigitNumbers > fourDigitNumbers * 2) {
    bestGuess.digits = 3 as 3 | 4;
    bestGuess.confidence = Math.max(bestGuess.confidence, 0.8);
  }
  
  return bestGuess;
}

export function getExpectedFormat(lotteryType: string): {
  numbers: number;
  digits: 3 | 4;
  schedule: string[];
} {
  const config = LOTTERY_SITES_CONFIG.find(c => c.lotteryType === lotteryType);
  if (config) {
    return {
      numbers: config.format.expectedNumbers,
      digits: config.format.digits,
      schedule: config.schedule
    };
  }
  
  // Padrão genérico
  return {
    numbers: 5,
    digits: 4,
    schedule: ['20:00']
  };
}