# 🧪 Guia Completo de Teste - Sistema de Bloqueios

**Data:** 21 de Novembro de 2025  
**Objetivo:** Verificar que bloqueios de horários e datas funcionam corretamente

---

## 📋 Pré-requisitos

Antes de começar os testes:

1. ✅ **Migration executado** no Supabase
2. ✅ **Servidor dev rodando** (`npm run dev`)
3. ✅ **Logado como owner** no Admin

---

## 🧪 TESTE 1: Bloqueio de Dia Inteiro

### Passo 1: Criar bloqueio
1. Acesse **Admin > Horários** (aba com ícone de relógio)
2. Role até "Bloqueios de Datas e Horários"
3. Preencha o formulário:
   - **Título:** `Férias de Natal`
   - **Tipo:** `Férias`
   - **Descrição:** `Consultório fechado para festas`
   - **Data Inicial:** `2025-12-25`
   - **Data Final:** `2025-12-25`
   - **Horário Inicial:** *(deixe vazio)*
   - **Horário Final:** *(deixe vazio)*
4. Clique em **"Adicionar Bloqueio"**

### ✅ Resultado esperado:
- Mensagem de sucesso aparece
- Bloqueio aparece na lista "Bloqueios Ativos (1)"
- Mostra: "25/12/2025 - 25/12/2025" (sem horários)
- Badge: "Férias"

### Passo 2: Verificar no Agendar
1. Acesse **Agendar** (como cliente)
2. Selecione um serviço qualquer
3. Tente selecionar **25 de Dezembro de 2025** no calendário
4. Observe os horários disponíveis

### ✅ Resultado esperado:
- **TODOS** os horários do dia 25/12 devem estar **desabilitados/cinza**
- Não é possível agendar nenhum horário neste dia

---

## 🧪 TESTE 2: Bloqueio de Horário Parcial

### Passo 1: Criar bloqueio parcial
1. Acesse **Admin > Horários**
2. Preencha o formulário:
   - **Título:** `Reunião Externa`
   - **Tipo:** `Compromisso Externo`
   - **Descrição:** `Reunião com fornecedores`
   - **Data Inicial:** `2025-11-25` (segunda-feira)
   - **Data Final:** `2025-11-25`
   - **Horário Inicial:** `14:00`
   - **Horário Final:** `16:00`
3. Clique em **"Adicionar Bloqueio"**

### ✅ Resultado esperado:
- Bloqueio aparece na lista com "• 14:00 às 16:00"
- Badge: "Compromisso Externo"

### Passo 2: Verificar no Agendar
1. Acesse **Agendar**
2. Selecione serviço (ex: duração 60min)
3. Selecione **25 de Novembro de 2025**
4. Observe os horários

### ✅ Resultado esperado:
- Horários **antes de 14:00** → ✅ Disponíveis (8:00, 9:00, 10:00, etc.)
- Horários **14:00 - 16:00** → ❌ **Desabilitados** (cinza)
- Horários **após 16:00** → ✅ Disponíveis (16:30, 17:00, etc.)

---

## 🧪 TESTE 3: Bloqueio NÃO Afeta Consultas Existentes

### Passo 1: Criar consulta ANTES do bloqueio
1. Como cliente, acesse **Agendar**
2. Crie um agendamento para **26/11/2025 às 14:00**
3. Admin confirma a consulta

### Passo 2: Criar bloqueio que "cobre" a consulta
1. Admin > Horários
2. Criar bloqueio:
   - **Data:** `2025-11-26`
   - **Horário:** `13:00` - `15:00`

### ✅ Resultado esperado:
- Bloqueio é criado SEM erro
- Consulta existente às 14:00 **NÃO é cancelada**
- Admin vê AVISO: "⚠️ Bloqueio Criado com Consultas Existentes"
- Console mostra: "1 consulta(s) existente(s) afetadas"
- **NOVOS** agendamentos 13:00-15:00 ficam bloqueados

---

## 🧪 TESTE 4: Horário de Funcionamento

### Passo 1: Configurar horários
1. Admin > Horários
2. Seção "Horários de Funcionamento"
3. **Segunda-feira:**
   - ✅ Aberto
   - Horário: `09:00` - `17:00`
4. **Domingo:**
   - ❌ Fechado
5. Clique **"Salvar"** em cada dia alterado

### Passo 2: Verificar no Agendar
1. Tente agendar para **domingo** (qualquer data)
2. Tente agendar para **segunda às 08:00** (antes de abrir)
3. Tente agendar para **segunda às 17:30** (após fechar)

### ✅ Resultado esperado:
- **Domingo:** TODOS horários desabilitados
- **Segunda 08:00:** ❌ Desabilitado (abre só às 09:00)
- **Segunda 09:00-17:00:** ✅ Disponíveis
- **Segunda 17:30+:** ❌ Desabilitados (fecha às 17:00)

---

## 🧪 TESTE 5: Remover Bloqueio

### Passo 1: Remover
1. Admin > Horários > Lista de bloqueios
2. Clique no botão **vermelho com ícone de lixeira**
3. Confirme "Tem certeza?"

### ✅ Resultado esperado:
- Bloqueio some da lista
- Mensagem: "✅ Bloqueio Removido"
- Horários ficam disponíveis novamente no Agendar

---

## 🐛 Diagnóstico de Problemas

### Problema: Bloqueio criado mas horários ainda disponíveis

**Verifique:**
```sql
-- No Supabase SQL Editor
SELECT * FROM public.date_blocks ORDER BY created_at DESC LIMIT 5;
```

**Esperado:** Ver seus bloqueios com start_date, end_date, start_time, end_time

**Se vazio:** Migration não foi executado ou dados não salvaram

---

### Problema: Erro ao criar bloqueio

**Console do navegador (F12):**
- Procure por erros vermelhos
- Veja mensagem de "null value in column"

**Solução:** Certifique-se que:
- Data Inicial está preenchida
- Data Final está preenchida
- Se colocar horário, preencha AMBOS (inicial E final)

---

### Problema: Horários de funcionamento não aplicam

**Verifique banco:**
```sql
SELECT * FROM public.operating_hours ORDER BY day_of_week;
```

**Esperado:** 7 linhas (0=Domingo, 6=Sábado) com is_open, open_time, close_time

**Força reload no Agendar:**
- F5 para recarregar página
- Limpe localStorage: `localStorage.clear()` no console

---

## 📊 SQL de Diagnóstico Completo

Execute no **Supabase SQL Editor**:

```sql
-- Verificar tabelas existem
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('operating_hours', 'date_blocks', 'site_settings')
ORDER BY table_name;

-- Verificar horários configurados
SELECT 
  day_of_week,
  CASE day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as dia,
  is_open,
  open_time,
  close_time
FROM public.operating_hours
ORDER BY day_of_week;

-- Verificar bloqueios ativos
SELECT 
  id,
  title,
  block_type,
  start_date,
  end_date,
  start_time,
  end_time,
  CASE 
    WHEN start_time IS NULL AND end_time IS NULL THEN 'Dia inteiro'
    ELSE 'Horário parcial'
  END as tipo_bloqueio,
  created_at
FROM public.date_blocks
WHERE end_date >= CURRENT_DATE
ORDER BY start_date, start_time;

-- Verificar consultas existentes vs bloqueios
SELECT 
  a.id as appt_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  p.full_name as client,
  s.name as service,
  (
    SELECT COUNT(*) 
    FROM public.date_blocks b
    WHERE a.appointment_date BETWEEN b.start_date AND b.end_date
  ) as bloqueios_no_mesmo_dia
FROM public.appointments a
LEFT JOIN public.profiles p ON p.id = a.client_id
LEFT JOIN public.services s ON s.id = a.service_id
WHERE a.status IN ('pending', 'confirmed')
  AND a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time;
```

---

## ✅ Checklist Final

Após executar todos os testes, marque:

- [ ] Bloqueio de dia inteiro funciona
- [ ] Bloqueio de horário parcial funciona
- [ ] Consultas existentes não são afetadas
- [ ] Horário de funcionamento aplica corretamente
- [ ] Remoção de bloqueio funciona
- [ ] Console sem erros vermelhos
- [ ] Banco tem dados em `operating_hours` e `date_blocks`

---

## 🎯 Resultado Final Esperado

Ao terminar os testes, você deve ter:

1. ✅ Sistema bloqueando novos agendamentos conforme configurado
2. ✅ Consultas existentes preservadas mesmo em períodos bloqueados
3. ✅ Horários de funcionamento respeitados no calendário
4. ✅ Interface clara mostrando bloqueios ativos
5. ✅ Dados persistindo no banco (não apenas localStorage)

---

## 📞 Suporte

Se algo não funcionar:
1. Execute o SQL de diagnóstico
2. Verifique console do navegador (F12)
3. Tire print do erro e me envie
4. Inclua resultado do SQL de diagnóstico

**Último commit:** `008e3a7` - fix(admin): align date block form to camelCase
