# 📊 Atrasados e Palpites - Sistema Completo

## ✅ Implementação Concluída

Sistema completo para calcular **atrasados** (por quantidade de sorteios) e gerar **palpites aleatórios** para envio aos grupos.

---

## 🎯 Atrasados - Por Quantidade de Sorteios

### **O que são Atrasados?**

Atrasados são valores (dezena, centena, milhar ou animal) que **não apareceram** nos últimos N sorteios.

**Tipos de atrasados calculados:**
- **Dezena** (00-99): Últimos 2 dígitos
- **Centena** (000-999): Últimos 3 dígitos  
- **Milhar** (0000-9999): Número completo de 4 dígitos
- **Animal**: Animal do jogo do bicho que não saiu

### **Como Funciona**

1. Analisa **todos os resultados históricos** da loteria
2. Identifica em qual sorteio cada valor apareceu pela última vez
3. Calcula quantos sorteios se passaram desde então
4. Retorna os valores mais atrasados

---

## 🎲 Palpites Aleatórios

### **Tipos de Palpites**

1. **Aleatórios**: Gerados completamente ao acaso
2. **Por Atrasados**: Baseados nos números mais atrasados
3. **Mistos**: Combinação de aleatórios + atrasados

### **Estrutura de Palpites**

Cada palpite contém:
- **Dezenas**: 5 dezenas aleatórias
- **Centenas**: 5 centenas aleatórias
- **Milhares**: 5 milhares aleatórios (com animal e grupo)
- **Animais**: 5 animais aleatórios

---

## 📋 Endpoints da API

### **1. Calcular Atrasados**

```bash
GET /api/atrasados/:lotteryType
Authorization: Bearer seu-token

Query params:
- sorteios_minimos: mínimo de sorteios atrasado (padrão: 10)
- tipo: 'dezena' | 'centena' | 'milhar' | 'animal' (opcional)
```

**Exemplo:**
```bash
GET /api/atrasados/LOTECE?sorteios_minimos=15
```

**Resposta:**
```json
{
  "lotteryType": "LOTECE",
  "total": 245,
  "atrasados": [
    {
      "tipo": "milhar",
      "valor": "1234",
      "sorteiosAtrasado": 45,
      "ultimaVez": "2025-10-15",
      "ultimaPosicao": 1
    },
    {
      "tipo": "animal",
      "valor": "Avestruz",
      "grupo": "01",
      "sorteiosAtrasado": 32,
      "ultimaVez": "2025-10-28"
    }
  ]
}
```

### **2. Top Atrasados por Tipo**

```bash
GET /api/atrasados/:lotteryType/top
Authorization: Bearer seu-token

Query params:
- top: quantidade (padrão: 10)
- sorteios_minimos: mínimo (padrão: 10)
```

**Resposta:**
```json
{
  "dezenas": [...],
  "centenas": [...],
  "milhares": [...],
  "animais": [...]
}
```

### **3. Gerar Palpites Aleatórios**

```bash
GET /api/palpites/aleatorios
Authorization: Bearer seu-token

Query params:
- dezenas: quantidade (padrão: 5)
- centenas: quantidade (padrão: 5)
- milhares: quantidade (padrão: 5)
- animais: quantidade (padrão: 5)
```

**Resposta:**
```json
{
  "dezenas": [
    { "tipo": "dezena", "valor": "23", "motivo": "aleatório" },
    ...
  ],
  "centenas": [...],
  "milhares": [
    {
      "tipo": "milhar",
      "valor": "1234",
      "grupo": "01",
      "animal": "Avestruz",
      "motivo": "aleatório"
    },
    ...
  ],
  "animais": [...],
  "geradoEm": "2025-11-23T12:00:00.000Z"
}
```

### **4. Gerar Palpites por Atrasados**

```bash
GET /api/palpites/atrasados/:lotteryType
Authorization: Bearer seu-token

Query params:
- dezenas, centenas, milhares, animais: quantidades
- sorteios_minimos: mínimo de sorteios atrasado (padrão: 10)
```

### **5. Gerar Palpites Mistos**

```bash
GET /api/palpites/mistos/:lotteryType
Authorization: Bearer seu-token

Query params:
- dezenas, centenas, milhares, animais: quantidades
- percentual_atrasados: % de atrasados (padrão: 50)
```

### **6. Enviar Palpites para Grupos**

```bash
POST /api/palpites/enviar
Authorization: Bearer seu-token

Body:
{
  "lotteryType": "LOTECE",
  "tipo": "aleatorios", // ou "atrasados" ou "mistos"
  "grupos": ["grupo1", "grupo2"] // opcional
}
```

---

## 🔧 Uso Programático

### **Calcular Atrasados**

```typescript
import { atrasadosService } from './services/AtrasadosService';
import { LotteryType } from './types';

// Calcular todos os atrasados (mínimo 10 sorteios)
const atrasados = await atrasadosService.calcularAtrasados(LotteryType.LOTECE, 10);

// Calcular apenas dezenas atrasadas
const dezenasAtrasadas = await atrasadosService.calcularAtrasadosPorTipo(
  LotteryType.LOTECE,
  'dezena',
  10
);

// Top 10 mais atrasados de cada tipo
const top = await atrasadosService.getTopAtrasados(LotteryType.LOTECE, 10, 10);
```

### **Gerar Palpites**

```typescript
import { palpitesService } from './services/PalpitesService';

// Palpites aleatórios
const aleatorios = palpitesService.gerarPalpitesAleatorios(5, 5, 5, 5);

// Palpites baseados em atrasados
const porAtrasados = await palpitesService.gerarPalpitesPorAtrasados(
  LotteryType.LOTECE,
  5, 5, 5, 5, 10
);

// Palpites mistos (50% atrasados, 50% aleatórios)
const mistos = await palpitesService.gerarPalpitesMistos(
  LotteryType.LOTECE,
  5, 5, 5, 5, 50
);

// Formatar para mensagem
const mensagem = palpitesService.formatarPalpitesParaMensagem(mistos);
```

---

## 📱 Formato de Mensagem

Os palpites são formatados automaticamente para envio via WhatsApp/Telegram:

```
🎯 *PALPITES DO DIA*

📋 *LOTECE*

🔹 *DEZENAS:*
   23 (aleatório)
   45 (aleatório)
   ...

🔹 *CENTENAS:*
   123 (aleatório)
   456 (aleatório)
   ...

🔹 *MILHARES:*
   1234 - Avestruz (Grupo 01) - aleatório
   5678 - Leão (Grupo 16) - 15 sorteios atrasado
   ...

🔹 *ANIMAIS:*
   Avestruz (Grupo 01) - aleatório
   Leão (Grupo 16) - 12 sorteios atrasado
   ...

⏰ Gerado em: 23/11/2025 12:00:00

⚠️ *Lembre-se: Palpites são apenas sugestões. Jogue com responsabilidade!*
```

---

## 🚀 Exemplos de Uso

### **1. Gerar e Enviar Palpites Aleatórios**

```bash
# Gerar palpites
curl -X GET "http://localhost:3000/api/palpites/aleatorios" \
  -H "Authorization: Bearer seu-token"

# Enviar para grupos
curl -X POST "http://localhost:3000/api/palpites/enviar" \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "aleatorios"
  }'
```

### **2. Ver Atrasados da LOTECE**

```bash
curl -X GET "http://localhost:3000/api/atrasados/LOTECE?sorteios_minimos=20" \
  -H "Authorization: Bearer seu-token"
```

### **3. Gerar Palpites Baseados em Atrasados**

```bash
curl -X GET "http://localhost:3000/api/palpites/atrasados/LOTECE?sorteios_minimos=15" \
  -H "Authorization: Bearer seu-token"
```

---

## ⚠️ Observações Importantes

1. **Atrasados**: Requer histórico de resultados no banco. Quanto mais histórico, mais preciso.

2. **Cálculo por Sorteios**: Não é por dias, mas por **quantidade de sorteios** que não apareceu.

3. **Palpites Aleatórios**: São gerados completamente ao acaso, sem garantia de acerto.

4. **Responsabilidade**: Sempre incluir aviso de que palpites são apenas sugestões.

---

## 📝 Próximos Passos

1. ✅ Cálculo de atrasados por sorteios (dezena, centena, milhar, animal)
2. ✅ Geração de palpites aleatórios
3. ✅ Geração de palpites por atrasados
4. ✅ Formatação para mensagem
5. ⏳ Integração completa com envio automático aos grupos
6. ⏳ Agendamento de envio de palpites

---

**Status**: ✅ **Implementado e Funcional**  
**Data**: 2025-11-23

