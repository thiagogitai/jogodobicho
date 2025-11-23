# 📄 Papel e Atrasados - Sistema de Extração

## ✅ Implementação Concluída

Sistema completo para extrair e calcular **Papel** (resultados pendentes/extras) e **Atrasados** (números que não saem há muito tempo).

---

## 🎯 Funcionalidades

### **1. Atrasados (Números Atrasados)**

Calcula quais números não saíram há X dias baseado no histórico de resultados salvos no banco de dados.

**Como funciona:**
- Analisa todos os resultados históricos da loteria
- Identifica quando cada número saiu pela última vez
- Calcula quantos dias se passaram desde a última vez
- Retorna os números mais atrasados

### **2. Papel (Resultados Pendentes/Extras)**

Verifica se há resultados pendentes, extras ou não oficiais nas páginas de resultados.

**Como funciona:**
- Acessa a página de resultados da banca
- Procura por palavras-chave: "pendente", "extra", "papel"
- Se encontrar, extrai os resultados usando o scraper

---

## 📋 Endpoints da API

### **Calcular Atrasados de uma Loteria**

```bash
GET /api/atrasados/:lotteryType
Authorization: Bearer seu-token

Query params:
- dias_minimos: número mínimo de dias atrasado (padrão: 7)
- posicao: posição específica (1º, 2º, 3º, etc) - opcional
```

**Exemplo:**
```bash
GET /api/atrasados/LOTECE?dias_minimos=10&posicao=1
```

**Resposta:**
```json
{
  "lotteryType": "LOTECE",
  "total": 45,
  "atrasados": [
    {
      "milhar": "1234",
      "grupo": "34",
      "diasAtrasado": 25,
      "ultimaVez": "2025-10-29",
      "posicao": 1
    },
    ...
  ]
}
```

### **Calcular Todos os Atrasados**

```bash
GET /api/atrasados
Authorization: Bearer seu-token

Query params:
- dias_minimos: número mínimo de dias atrasado (padrão: 7)
```

**Resposta:**
```json
{
  "LOTECE": {
    "total": 45,
    "atrasados": [...]
  },
  "FEDERAL": {
    "total": 32,
    "atrasados": [...]
  },
  ...
}
```

### **Verificar Papel/Pendentes**

```bash
GET /api/papel/:bancaKey
Authorization: Bearer seu-token

Query params:
- date: data no formato YYYY-MM-DD (opcional, usa hoje se não fornecido)
```

**Exemplo:**
```bash
GET /api/papel/LOTECE?date=2025-11-03
```

**Resposta:**
```json
{
  "banca": "LOTECE",
  "date": "2025-11-03",
  "total": 1,
  "resultados": [
    {
      "banca": "LOTECE",
      "date": "2025-11-03",
      "premios": [
        {
          "position": 1,
          "milhar": "1234",
          "grupo": "34"
        },
        ...
      ],
      "tipo": "pendente",
      "fonte": "https://www.resultadofacil.com.br/..."
    }
  ]
}
```

---

## 🔧 Uso Programático

### **Calcular Atrasados**

```typescript
import { atrasadosService } from './services/AtrasadosService';
import { LotteryType } from './types';

// Calcular atrasados para LOTECE (mínimo 7 dias)
const atrasados = await atrasadosService.calcularAtrasados(LotteryType.LOTECE, 7);

// Calcular apenas para 1º prêmio
const atrasados1o = await atrasadosService.calcularAtrasados(LotteryType.LOTECE, 7, 1);

// Calcular para todas as loterias
const todosAtrasados = await atrasadosService.calcularTodosAtrasados(7);

// Buscar números que nunca saíram
const nuncaSairam = await atrasadosService.buscarNuncaSairam(LotteryType.LOTECE);
```

### **Verificar Papel/Pendentes**

```typescript
import { papelService } from './services/PapelService';

// Verificar papel para uma banca específica
const papel = await papelService.verificarPapelPendentes('LOTECE', '2025-11-03');

// Verificar para todas as bancas
const todosPapel = await papelService.verificarTodosPapelPendentes('2025-11-03');
```

---

## 📊 Estrutura de Dados

### **AtrasadoInfo**

```typescript
interface AtrasadoInfo {
  milhar: string;        // Número de 4 dígitos
  grupo: string;         // Grupo do bicho
  diasAtrasado: number;  // Quantos dias não sai
  ultimaVez: string;     // Data da última vez que saiu (YYYY-MM-DD)
  posicao: number;       // Posição que saiu (1º, 2º, 3º, etc)
}
```

### **PapelResult**

```typescript
interface PapelResult {
  banca: string;         // Chave da banca
  date: string;          // Data do resultado
  horario?: string;      // Horário (se disponível)
  premios: {
    position: number;    // Posição (1º, 2º, etc)
    milhar: string;      // Número de 4 dígitos
    grupo: string;       // Grupo do bicho
  }[];
  tipo: 'papel' | 'pendente' | 'extra';
  fonte?: string;        // URL de origem
}
```

---

## 🚀 Exemplos de Uso

### **1. Encontrar números mais atrasados da LOTECE**

```bash
curl -X GET "http://localhost:3000/api/atrasados/LOTECE?dias_minimos=10" \
  -H "Authorization: Bearer seu-token"
```

### **2. Verificar se há resultados pendentes**

```bash
curl -X GET "http://localhost:3000/api/papel/LOTECE?date=2025-11-03" \
  -H "Authorization: Bearer seu-token"
```

### **3. Listar todos os atrasados de todas as loterias**

```bash
curl -X GET "http://localhost:3000/api/atrasados?dias_minimos=7" \
  -H "Authorization: Bearer seu-token"
```

---

## ⚠️ Observações Importantes

1. **Atrasados**: Requer histórico de resultados no banco de dados. Quanto mais histórico, mais preciso será o cálculo.

2. **Papel**: Depende do site ter seções específicas para papel/pendentes. O sistema verifica automaticamente nas páginas de resultados.

3. **Performance**: Cálculo de atrasados pode ser lento se houver muitos resultados históricos. Considere limitar a quantidade retornada.

4. **Números que nunca saíram**: Retorna todos os números de 0000-9999 que nunca apareceram no histórico.

---

## 📝 Próximos Passos

1. ✅ Cálculo de atrasados baseado em histórico
2. ✅ Verificação de papel/pendentes nas páginas
3. ⏳ Cache de resultados de atrasados
4. ⏳ Notificações quando números muito atrasados saem
5. ⏳ Estatísticas de frequência de números

---

**Status**: ✅ **Implementado e Funcional**  
**Data**: 2025-01-21

