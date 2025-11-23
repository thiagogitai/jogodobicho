import axios, { AxiosInstance } from 'axios';
import { ProxyAgent } from 'proxy-agent';
import UserAgent from 'user-agents';
import { logger } from './logger';

export class ProxyManager {
  private proxies: string[] = [];
  private currentIndex = 0;
  private axiosInstances: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.loadProxies();
  }

  private loadProxies() {
    const proxyList = process.env.PROXY_LIST || '';
    this.proxies = proxyList.split(',').filter(p => p.trim());
    logger.info(`Carregados ${this.proxies.length} proxies`);
  }

  getNextProxy(): string | null {
    if (this.proxies.length === 0) return null;
    
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  getAxiosInstance(proxy?: string): AxiosInstance {
    const key = proxy || 'default';
    
    if (this.axiosInstances.has(key)) {
      return this.axiosInstances.get(key)!;
    }

    const config: any = {
      timeout: parseInt(process.env.TIMEOUT_MS || '30000'),
      headers: {
        'User-Agent': new UserAgent().toString(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    };

    if (proxy && process.env.PROXY_ROTATION_ENABLED === 'true') {
      config.httpsAgent = new ProxyAgent(proxy);
      config.httpAgent = new ProxyAgent(proxy);
    }

    const instance = axios.create(config);
    this.axiosInstances.set(key, instance);
    
    return instance;
  }

  async rotateProxy(): Promise<string | null> {
    const proxy = this.getNextProxy();
    logger.info(`Rotating to proxy: ${proxy}`);
    return proxy;
  }
}

export const proxyManager = new ProxyManager();