# 🆘 URGENTE: APLICAR CORREÇÃO IMEDIATA

## ❌ PROBLEMA CONFIRMADO

Seu perfil mostra:
- ✅ Email: salvo corretamente  
- ❌ Nome: "Não informado"
- ❌ Telefone: "Não informado"

**Isso confirma que a função `handle_new_user()` NÃO foi atualizada ainda!**

## 🚀 SOLUÇÃO IMEDIATA

### OPÇÃO 1: RESET COMPLETO (RECOMENDADO)

1. **Acesse**: https://app.supabase.com
2. **Vá para**: SQL Editor
3. **Copie o arquivo**: `RESET_COMPLETO_DB.sql` (COMPLETO!)
4. **Execute** no Supabase

### OPÇÃO 2: CORREÇÃO RÁPIDA (SE PRESSA)

Se você tem pressa, execute apenas isso no SQL Editor:

```sql
-- CORREÇÃO URGENTE: Atualizar função para salvar nome e telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Assign client role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;
```

### APÓS APLICAR A CORREÇÃO:

1. **Teste com novo usuário** (não o atual)
2. **O nome e telefone** devem aparecer corretamente
3. **Para seu usuário atual**: use "Editar Perfil" para adicionar os dados

## ⚠️ POR QUE ISSO ACONTECEU?

A função original só salvava:
```sql
INSERT INTO public.profiles (id, email, full_name)  -- SEM phone!
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', '')  -- SEM phone!
);
```

A função corrigida salva:
```sql
INSERT INTO public.profiles (id, email, full_name, phone)  -- COM phone!
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', ''),     -- COM full_name
  COALESCE(NEW.raw_user_meta_data->>'phone', '')          -- COM phone!
);
```

**🎯 Execute a correção AGORA e teste com novo usuário!**