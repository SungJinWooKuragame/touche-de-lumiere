# 🔧 Correção: Erro ao Criar Serviço

## ❌ Problema Identificado

Erro ao tentar criar/editar serviços no painel administrativo:
```
Could not find the 'description_en' column of 'services' in the schema cache
```

## 🎯 Causa Raiz

A tabela `services` no banco de dados não possui as colunas multilíngues necessárias:
- `name_pt`, `name_en`, `name_fr`
- `description_pt`, `description_en`, `description_fr`
- `icon_name`, `icon_emoji`, `hover_color`

Essas colunas deveriam ter sido criadas pela migração `20251028080000_multilingual_services.sql`, mas aparentemente não foram aplicadas.

## ✅ Solução Implementada

### 1. **Migração SQL Corretiva**

Criada nova migração: `supabase/migrations/20251101000000_fix_services_multilingual_columns.sql`

Esta migração:
- ✅ Adiciona todas as colunas multilíngues (`ADD COLUMN IF NOT EXISTS`)
- ✅ Adiciona colunas de customização visual
- ✅ Migra dados existentes para campos de português
- ✅ Cria funções de tradução automática
- ✅ Cria view `services_multilingual` para facilitar consultas
- ✅ Adiciona índices para performance
- ✅ Define permissões corretas

### 2. **Proteção no Frontend**

Atualizado `src/pages/Admin.tsx` para:
- ✅ Detectar erros de schema/coluna automaticamente
- ✅ Fazer fallback para campos básicos se houver erro
- ✅ Exibir avisos no console para debug

## 📋 Como Aplicar a Correção

### **Opção 1: Via Dashboard do Supabase** (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJETO_ID
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo:
   ```
   supabase/migrations/20251101000000_fix_services_multilingual_columns.sql
   ```
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde mensagem de sucesso: ✅

### **Opção 2: Via Supabase CLI** (se configurado)

```powershell
# Aplicar migration
supabase db push

# Ou aplicar manualmente
supabase db execute -f supabase/migrations/20251101000000_fix_services_multilingual_columns.sql
```

## 🧪 Como Testar

Após aplicar a migração:

1. **Recarregue o painel administrativo** (F5)
2. Vá na aba **"Serviços"**
3. Clique em **"Novo Serviço"**
4. Preencha os campos em português (obrigatório)
5. Opcionalmente preencha inglês/francês
6. Clique em **"Salvar"**
7. ✅ **Não deve mais dar erro de schema cache!**

## 📊 Verificação no Banco

Para confirmar que as colunas foram criadas:

```sql
-- Listar todas as colunas da tabela services
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'services'
ORDER BY ordinal_position;
```

Deve aparecer:
- ✅ `name_pt`, `name_en`, `name_fr`
- ✅ `description_pt`, `description_en`, `description_fr`
- ✅ `icon_name`, `icon_emoji`, `hover_color`

## 🔄 Rollback (se necessário)

Se precisar desfazer a migração:

```sql
-- Remover colunas adicionadas
ALTER TABLE public.services 
DROP COLUMN IF EXISTS name_pt,
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS name_fr,
DROP COLUMN IF EXISTS description_pt,
DROP COLUMN IF EXISTS description_en,
DROP COLUMN IF EXISTS description_fr,
DROP COLUMN IF EXISTS icon_name,
DROP COLUMN IF EXISTS icon_emoji,
DROP COLUMN IF EXISTS hover_color;

-- Remover funções
DROP FUNCTION IF EXISTS public.get_service_name(public.services, TEXT);
DROP FUNCTION IF EXISTS public.get_service_description(public.services, TEXT);

-- Remover view
DROP VIEW IF EXISTS public.services_multilingual;
```

## 📝 Observações Importantes

- ⚠️ **Não perca dados**: A migração usa `ADD COLUMN IF NOT EXISTS`, então é seguro executar múltiplas vezes
- ⚠️ **Compatibilidade**: Campos básicos (`name`, `description`) continuam funcionando para retrocompatibilidade
- ⚠️ **Fallback automático**: Se as colunas não existirem, o sistema tenta salvar apenas os campos básicos

## 🎉 Próximos Passos

Após aplicar a correção:

1. ✅ Criar/editar serviços deve funcionar normalmente
2. ✅ Sistema multilíngue estará ativo (PT/EN/FR)
3. ✅ Customização visual de serviços estará disponível
4. ✅ Performance melhorada com índices
