export interface LotteryResult {
  id?: string;
  lotteryType: LotteryType;
  date: string;
  results: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
    fifth?: string;
  };
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
    fifth?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  source: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface ScrapingResult {
  lotteryName: string;
  date: string;
  prizes: LotteryPrize[];
  source: string;
  scrapedAt: string;
  format: string;
  status: 'success' | 'error';
}

export interface LotteryPrize {
  position: number;
  number: string;
  animal: string;
  group: string;
}

export enum LotteryType {
  FEDERAL = 'FEDERAL',
  RIO_DE_JANEIRO = 'RIO_DE_JANEIRO',
  LOOK_GO = 'LOOK_GO',
  PT_SP = 'PT_SP',
  NACIONAL = 'NACIONAL',
  MALUQUINHA_RJ = 'MALUQUINHA_RJ',
  LOTEP = 'LOTEP',
  LOTECE = 'LOTECE',
  MINAS_GERAIS = 'MINAS_GERAIS',
  BOA_SORTE = 'BOA_SORTE',
  LOTERIAS_CAIXA = 'LOTERIAS_CAIXA'
}

export interface ScraperConfig {
  url: string;
  selector: string;
  lotteryType: LotteryType;
  enabled: boolean;
  proxy?: string;
  headers?: Record<string, string>;
  parser: 'cheerio' | 'puppeteer' | 'regex';
}

export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  enabled: boolean;
}

export interface EvolutionAPIConfig {
  baseUrl: string;
  apiToken: string;
  instanceName: string;
}

export interface MessageTemplate {
  id?: string;
  name: string;
  content: string;
  variables: string[];
  lotteryTypes: LotteryType[];
  enabled: boolean;
}

export interface GroupConfig {
  id?: string;
  name: string;
  platform: 'whatsapp' | 'telegram';
  groupId: string;
  instanceName?: string;
  enabled: boolean;
  lotteryTypes: LotteryType[];
  templateId?: string;
  schedule?: string;
}