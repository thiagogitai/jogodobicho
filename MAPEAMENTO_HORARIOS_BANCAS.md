# ⏰ Mapeamento Completo de Horários - Bancas Resultado Fácil

## 📋 Resumo

Todas as **19 bancas** do Resultado Fácil foram mapeadas com seus respectivos **horários de sorteio**.

---

## 🎯 Mudanças Implementadas

### ✅ **1. Data Atual Sempre**
- **ANTES**: Sistema usava data de ontem por padrão
- **AGORA**: Sistema sempre usa **data atual** quando não especificada
- **Motivo**: O site sempre atualiza com a data do dia atual

### ✅ **2. Mapeamento de Horários**
- Todas as 19 bancas têm horários mapeados
- Configuração centralizada em `src/config/resultadoFacilBancasConfig.ts`
- Funções auxiliares para gerar URLs e cron expressions

---

## 📊 Horários por Banca

### **Bancas Nacionais (10 bancas)**

| Banca | Horário(s) | Observação |
|-------|------------|------------|
| **LOTECE** | 16:00 | Único horário |
| **LOTERIA TRADICIONAL** | 19:00 | Único horário |
| **LOTEP** | 15:00 | Único horário |
| **LOTERIA NACIONAL** | 19:30 | Único horário |
| **LBR** | 19:00 | Único horário |
| **LOOK LOTERIAS** | 16:00 | Único horário |
| **CAMINHO DA SORTE** | 14:00 | Único horário |
| **LOTERIA POPULAR** | 14:00 | Único horário |
| **NORDESTE MONTE CARLOS** | 15:00 | Único horário |
| **BANDEIRANTES** | 14:00 | Único horário |

### **Bancas com Estado (9 bancas)**

| Banca | Estado | Horário(s) | Observação |
|-------|--------|------------|------------|
| **MALUCA BAHIA** | BA | 18:00 | Único horário |
| **PARATODOS BAHIA** | BA | 18:00 | Único horário |
| **MINAS MG** | MG | **13:00, 19:00** | ⚠️ Dois horários |
| **AVAL PERNAMBUCO** | PE | 14:00 | Único horário |
| **PT RIO** | RJ | **14:00, 19:00** | ⚠️ Dois horários |
| **PT SP** | SP | **14:00, 20:00** | ⚠️ Dois horários |
| **RIO GRANDE DO SUL** | RS | 19:00 | Único horário |
| **CAMPINA GRANDE** | PB | 19:00 | Único horário |
| **ABAESE - ITABAIANA** | SE | 18:00 | Único horário |

---

## ⚠️ Bancas com Múltiplos Horários (3 bancas)

Estas bancas têm **dois sorteios por dia**:

1. **MINAS MG**: 13:00 e 19:00
2. **PT RIO**: 14:00 e 19:00
3. **PT SP**: 14:00 e 20:00

**Importante**: Para essas bancas, o sistema deve fazer scrape **após cada horário** para pegar ambos os resultados.

---

## 🔧 Implementação Técnica

### **Arquivo de Configuração**
`src/config/resultadoFacilBancasConfig.ts`

### **Funções Principais**

```typescript
// Gerar URL com data atual automaticamente
getResultadoFacilUrl(bancaKey: string, date?: string): string

// Obter data atual formatada (YYYY-MM-DD)
getCurrentDateFormatted(): string

// Obter data de ontem formatada
getYesterdayDateFormatted(): string

// Gerar expressões cron para agendamento
getCronExpressionsForBanca(bancaKey: string): string[]

// Obter próximo horário de sorteio
getNextScheduleTime(bancaKey: string): Date | null
```

### **Exemplo de Uso**

```typescript
import { ResultadoFacilDefinitiveScraper } from './scrapers/ResultadoFacilDefinitiveScraper';

const scraper = new ResultadoFacilDefinitiveScraper();

// Scrape de hoje (data atual) - TODAS as bancas
const resultsToday = await scraper.scrapeToday();

// Scrape de uma banca específica (data atual)
const ptRioResult = await scraper.scrapeBanca('PT_RIO');

// Scrape de ontem (histórico)
const resultsYesterday = await scraper.scrapeYesterday();

// Obter horários de uma banca
const horarios = scraper.getBancaHorarios('PT_RIO');
// Retorna: ['14:00', '19:00']
```

---

## 📅 Agendamento Automático

### **Cron Expressions Geradas**

Para bancas com um horário:
- `LOTECE` (16:00): `0 16 * * *`
- `LOTEP` (15:00): `0 15 * * *`

Para bancas com dois horários:
- `PT_RIO` (14:00, 19:00): `0 14 * * *` e `0 19 * * *`
- `PT_SP` (14:00, 20:00): `0 14 * * *` e `0 20 * * *`
- `MINAS_MG` (13:00, 19:00): `0 13 * * *` e `0 19 * * *`

### **Exemplo de Agendamento**

```typescript
import { getCronExpressionsForBanca } from './config/resultadoFacilBancasConfig';

// Obter cron expressions para PT RIO
const cronExpressions = getCronExpressionsForBanca('PT_RIO');
// Retorna: ['0 14 * * *', '0 19 * * *']

// Criar jobs para cada horário
cronExpressions.forEach(cronExpr => {
  const job = new CronJob(cronExpr, async () => {
    await scraper.scrapeBanca('PT_RIO');
  });
  job.start();
});
```

---

## ✅ Checklist de Implementação

- [x] Mapeamento de todas as 19 bancas
- [x] Horários identificados e documentados
- [x] Configuração centralizada criada
- [x] Funções auxiliares implementadas
- [x] Scraper atualizado para usar data atual
- [x] Suporte a múltiplos horários
- [x] Funções para gerar cron expressions
- [x] Documentação completa

---

## 🚀 Próximos Passos Recomendados

1. **Implementar Agendamento Automático**
   - Criar jobs cron para cada banca baseado nos horários
   - Considerar múltiplos horários para PT_RIO, PT_SP, MINAS_MG

2. **Validação de Horários**
   - Testar se os horários estão corretos
   - Ajustar se necessário baseado em observações reais

3. **Monitoramento**
   - Alertar se resultado não for encontrado após o horário
   - Logs de sucesso/falha por banca

4. **Cache Inteligente**
   - Não fazer scrape se já foi feito no mesmo dia
   - Verificar se resultado já existe antes de scrape

---

## 📝 Notas Importantes

1. **Data Atual**: O sistema agora **sempre usa data atual** por padrão, não mais ontem
2. **Múltiplos Horários**: Bancas com 2 horários precisam de 2 scrapes por dia
3. **Fuso Horário**: Horários estão em horário de Brasília (UTC-3)
4. **Finais de Semana**: Algumas bancas podem não ter sorteio aos domingos

---

**Data de Criação**: 2025-01-21  
**Última Atualização**: 2025-01-21  
**Status**: ✅ Completo e Implementado

