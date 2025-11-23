/**
 * Utilitário para converter ScrapingResult em LotteryResult
 * Garante que a origem (Resultado Fácil) seja identificada internamente
 * mas nunca exposta na API
 */

import { ScrapingResult, LotteryResult, LotteryType } from '../types';

/**
 * Converte ScrapingResult para LotteryResult
 * Identifica internamente se veio do Resultado Fácil
 */
export function convertScrapingResultToLotteryResult(
  scrapingResult: ScrapingResult,
  lotteryType: LotteryType
): LotteryResult {
  // Extrair os 5 primeiros prêmios
  const prizes = scrapingResult.prizes || [];
  
  const results: LotteryResult['results'] = {
    first: prizes.find(p => p.position === 1 || p.position === '1' || String(p.position).includes('1'))?.number,
    second: prizes.find(p => p.position === 2 || p.position === '2' || String(p.position).includes('2'))?.number,
    third: prizes.find(p => p.position === 3 || p.position === '3' || String(p.position).includes('3'))?.number,
    fourth: prizes.find(p => p.position === 4 || p.position === '4' || String(p.position).includes('4'))?.number,
    fifth: prizes.find(p => p.position === 5 || p.position === '5' || String(p.position).includes('5'))?.number,
  };
  
  // Identificar se veio do Resultado Fácil
  const isResultadoFacil = scrapingResult.source && (
    scrapingResult.source.includes('resultadofacil.com.br') ||
    scrapingResult.source.includes('resultado-facil') ||
    scrapingResult.source === 'resultadofacil' ||
    scrapingResult.source.toLowerCase().includes('resultadofacil')
  );
  
  // Source interno - será mascarado na API
  const internalSource = isResultadoFacil ? 'resultadofacil' : scrapingResult.source;
  
  return {
    lotteryType,
    date: scrapingResult.date,
    results,
    source: internalSource, // Salvo internamente como 'resultadofacil' se vier de lá
    status: scrapingResult.status === 'success' ? 'active' : 'pending',
    createdAt: new Date(scrapingResult.scrapedAt),
    updatedAt: new Date()
  };
}

/**
 * Verifica se um resultado veio do Resultado Fácil (uso interno apenas)
 */
export function isFromResultadoFacil(result: LotteryResult | { source?: string }): boolean {
  const source = result.source || '';
  return (
    source.includes('resultadofacil.com.br') ||
    source.includes('resultado-facil') ||
    source === 'resultadofacil' ||
    source.toLowerCase().includes('resultadofacil')
  );
}

