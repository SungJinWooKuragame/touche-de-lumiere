# 🐛 Correção de Bug: Bloqueios de Horário

**Data:** 21/11/2025  
**Commit:** `3f2bf54`  
**Status:** ✅ CORRIGIDO E NO GITHUB

---

## 🔴 Problema Relatado

1. **Bloqueio de horário específico não funcionava corretamente**
   - Usuário configurava bloqueio 14:00-16:00
   - Horários não eram bloqueados conforme esperado

2. **Bloqueio vazando para o dia seguinte**
   - Bloqueio configurado para um dia
   - Afetava o dia seguinte até ~11:30 sem motivo

---

## 🔍 Causa Raiz

### Bug 1: Comparação de Datas com Timezone
```typescript
// ❌ ANTES (ERRADO)
const blockStart = new Date(block.startDate);  // Ex: 2025-11-25T00:00:00Z
const blockEnd = new Date(block.endDate);      // Ex: 2025-11-25T00:00:00Z
const selectedDateObj = new Date(selectedDateStr);  // Ex: 2025-11-26T03:00:00Z (timezone!)

if (selectedDateObj >= blockStart && selectedDateObj <= blockEnd) {
  // ⚠️ PROBLEMA: selectedDateObj pode ter horas diferentes de 00:00:00
  // causando comparação errada de dias
}
```

**O que acontecia:**
- Data selecionada: `2025-11-26` (dia 26)
- Bloqueio: `2025-11-25` (dia 25)
- `new Date("2025-11-26")` → pode virar `2025-11-26T03:00:00` por causa do timezone
- `selectedDateObj >= blockStart` → `2025-11-26T03:00 >= 2025-11-25T00:00` → **TRUE** ❌
- Resultado: bloqueio do dia 25 afetava o dia 26 até ~11:30 (diferença de fuso)

### Bug 2: Lógica de Sobreposição
A lógica de overlap estava correta, mas executava sobre datas erradas.

---

## ✅ Solução Implementada

### Normalização de Datas para Meia-Noite
```typescript
// ✅ DEPOIS (CORRETO)
const blockStartDate = new Date(block.startDate);
blockStartDate.setHours(0, 0, 0, 0);  // Força 00:00:00.000

const blockEndDate = new Date(block.endDate);
blockEndDate.setHours(0, 0, 0, 0);

const selectedDateNormalized = new Date(selectedDate);
selectedDateNormalized.setHours(0, 0, 0, 0);

const dateInRange = selectedDateNormalized >= blockStartDate && selectedDateNormalized <= blockEndDate;
```

**Por que funciona:**
- Todas as datas comparadas estão em 00:00:00.000
- Elimina qualquer problema de timezone/horário
- Comparação pura de dias (sem influência de horas)

### Logs de Debug Adicionados
```typescript
console.log('🔍 Verificando slot:', {
  time: '14:00',
  slotStart: '14:00',
  slotEnd: '15:00',
  date: '2025-11-25'
});

console.log('🚫 Verificando bloqueio parcial:', {
  blockTitle: 'Reunião Externa',
  blockDate: '2025-11-25 - 2025-11-25',
  blockTime: '14:00 - 16:00',
  blockStartMinutes: 840,  // 14*60 = 840
  blockEndMinutes: 960,    // 16*60 = 960
  slotStartMinutes: 840,
  slotEndMinutes: 900,
  overlaps: true,
  calculation: 'slot(840 a 900) vs block(840 a 960)'
});
```

---

## 🧪 Como Testar a Correção

### Teste 1: Bloqueio Parcial no Mesmo Dia
1. **Criar bloqueio:**
   - Data Inicial: `2025-11-25`
   - Data Final: `2025-11-25`
   - Horário Inicial: `14:00`
   - Horário Final: `16:00`

2. **Verificar em Agendar:**
   - Selecione `25/11/2025`
   - Abra o console (F12)
   - Veja os logs: `🔍 Verificando slot` e `🚫 Verificando bloqueio parcial`

3. **Resultado esperado:**
   ```
   ✅ 08:00 - Disponível
   ✅ 13:30 - Disponível
   ❌ 14:00 - BLOQUEADO (log mostra overlaps: true)
   ❌ 14:30 - BLOQUEADO
   ❌ 15:00 - BLOQUEADO
   ❌ 15:30 - BLOQUEADO
   ✅ 16:00 - Disponível (bloqueio termina às 16:00)
   ✅ 16:30 - Disponível
   ```

### Teste 2: Bloqueio NÃO Vaza para Dia Seguinte
1. **Mesmo bloqueio do Teste 1**

2. **Verificar dia seguinte:**
   - Selecione `26/11/2025`
   - Abra console

3. **Resultado esperado:**
   ```
   Console NÃO mostra logs de bloqueio
   ✅ TODOS horários disponíveis (08:00, 08:30, 09:00, etc.)
   ```

### Teste 3: Bloqueio Dia Inteiro
1. **Criar bloqueio:**
   - Data: `2025-12-25`
   - Horários: *(vazios)*

2. **Verificar:**
   ```
   ❌ TODOS horários bloqueados no dia 25/12
   ✅ Dia 24/12 → Normal
   ✅ Dia 26/12 → Normal
   ```

---

## 📊 SQL para Verificar Bloqueios

Execute no Supabase para ver seus bloqueios:

```sql
SELECT 
  id,
  title,
  start_date,
  end_date,
  start_time,
  end_time,
  CASE 
    WHEN start_time IS NULL THEN 'DIA INTEIRO'
    ELSE start_time::text || ' - ' || end_time::text
  END as tipo
FROM public.date_blocks
WHERE end_date >= CURRENT_DATE
ORDER BY start_date, start_time;
```

---

## 🐛 Debug em Tempo Real

Para ver o que está acontecendo:

1. **Abra a página Agendar**
2. **Abra o Console (F12)**
3. **Selecione um serviço e uma data**
4. **Observe os logs:**

```javascript
// Você verá para CADA horário:
🔍 Verificando slot: {time: "14:00", slotStart: "14:00", slotEnd: "15:00", date: "2025-11-25"}

// Se houver bloqueio que afeta esse horário:
🚫 Verificando bloqueio parcial: {
  blockTitle: "Reunião Externa",
  blockTime: "14:00 - 16:00",
  overlaps: true,  // ← TRUE = vai bloquear
  calculation: "slot(840 a 900) vs block(840 a 960)"
}
```

---

## 🎯 Explicação Técnica da Lógica

### Cálculo de Sobreposição de Horários
```
Bloqueio:    |-------|          (14:00 - 16:00)
             840    960

Slot 1:  |---|                   (13:00 - 14:00)
         780 840
Overlaps? 780 < 960 AND 840 > 840 → FALSE ✅ Disponível

Slot 2:      |---|               (14:00 - 15:00)
             840 900
Overlaps? 840 < 960 AND 900 > 840 → TRUE ❌ BLOQUEADO

Slot 3:          |---|           (15:00 - 16:00)
                 900 960
Overlaps? 900 < 960 AND 960 > 840 → TRUE ❌ BLOQUEADO

Slot 4:              |---|       (16:00 - 17:00)
                     960 1020
Overlaps? 960 < 960 AND 1020 > 840 → FALSE ✅ Disponível
```

**Fórmula:**
```typescript
overlaps = (slotStart < blockEnd) && (slotEnd > blockStart)
```

---

## ✅ Checklist de Validação

Após atualizar, confirme:

- [ ] Bloqueio 14:00-16:00 bloqueia APENAS 14:00, 14:30, 15:00, 15:30
- [ ] Bloqueio no dia 25 NÃO afeta dia 26
- [ ] Console mostra logs detalhados de cada verificação
- [ ] Bloqueio dia inteiro bloqueia todos os horários
- [ ] Horários antes e depois do bloqueio ficam disponíveis

---

## 🚀 Próximos Passos

1. **Reinicie o servidor dev:** `npm run dev`
2. **Limpe o cache do navegador:** Ctrl+Shift+R
3. **Teste criar um bloqueio** e veja os logs no console
4. **Se ainda tiver problema:** Me envie:
   - Screenshot dos logs do console
   - Horário exato que configurou
   - Horários que estão bloqueados (mas não deveriam)

---

## 📞 Suporte

Se o problema persistir mesmo após esta correção:

1. Execute no console do navegador:
```javascript
// Ver bloqueios carregados
console.table(JSON.parse(localStorage.getItem('dateBlocks')));
```

2. Tire print mostrando:
   - Configuração do bloqueio no Admin
   - Horários bloqueados no Agendar
   - Logs do console (F12)

3. Me envie junto com a data/hora que tentou bloquear

---

**Commit:** `3f2bf54`  
**Arquivo alterado:** `src/pages/Agendar.tsx`  
**Linhas modificadas:** ~57 linhas (normalização de datas + debug logs)
