# 🔧 Correção: Nome e Telefone não aparecem no Admin

## ❌ Problema
- Cliente aparece como UUID (ex: `Cliente ca593289-a7af-45c4-854b-911b0230aba0`) no admin
- Telefone aparece como "Sem telefone"
- Dados não são salvos ao criar conta

## 🔍 Diagnóstico

### O código está CORRETO:
1. ✅ **Login.tsx** - Envia `full_name` e `phone` no signup:
   ```js
   await supabase.auth.signUp({
     email: signupEmail,
     password: signupPassword,
     options: {
       data: {
         full_name: signupName,
         phone: signupPhone,
       },
     },
   });
   ```

2. ✅ **setup-supabase.sql** - Trigger salva os dados:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, phone)
   VALUES (
     NEW.id,
     NEW.email,
     COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
     COALESCE(NEW.raw_user_meta_data->>'phone', '')
   );
   ```

3. ✅ **Admin.tsx** - Query busca os dados corretamente:
   ```js
   .select(`
     *,
     services (name, price, duration_minutes),
     profiles:client_id (full_name, email, phone)
   `)
   ```

### O PROBLEMA REAL:
- **Dados antigos** criados ANTES do trigger estar correto não têm `full_name` e `phone`
- **Novos usuários** criados após o trigger correto TERÃO os dados salvos

## ✅ Solução

### 1. Para dados EXISTENTES (usuários já criados):
Execute o script SQL no Supabase SQL Editor:
```bash
fix-existing-profiles.sql
```

Este script:
- Pega `full_name` e `phone` de `auth.users.raw_user_meta_data`
- Atualiza a tabela `profiles` com esses dados
- Corrige todos os perfis existentes

### 2. Para NOVOS usuários:
O sistema já está funcionando corretamente! Novos cadastros vão salvar:
- Nome completo
- Telefone com código de país
- Email

### 3. Validação no Signup:
O formulário de cadastro agora:
- ✅ Valida telefone com formato internacional (+33 6 80 53 73 29)
- ✅ Valida email
- ✅ Valida senha (mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número)
- ✅ Mostra indicadores visuais de validação em tempo real
- ✅ Verifica se telefone já está cadastrado

### 4. Exibição no Admin:
- Se `full_name` existe → Mostra o nome
- Se `full_name` está vazio → Mostra "Cliente sem nome" (em vez do UUID)
- Se `phone` existe → Mostra o telefone
- Se `phone` está vazio → Mostra "Sem telefone"

## 📋 Checklist de Verificação

Após executar o script `fix-existing-profiles.sql`:

1. ✅ Verificar que perfis existentes agora têm `full_name` e `phone`
   ```sql
   SELECT id, email, full_name, phone FROM public.profiles;
   ```

2. ✅ Criar uma nova conta de teste e verificar que:
   - Nome aparece corretamente no admin
   - Telefone aparece corretamente
   - Email está correto

3. ✅ Agendar uma consulta com o usuário teste e confirmar que:
   - Nome aparece na lista de agendamentos
   - Telefone aparece nas notificações
   - Dados do cliente estão corretos

## 🎯 Resultado Final

**ANTES:**
```
Cliente ca593289-a7af-45c4-854b-911b0230aba0
email@example.com • Sem telefone
```

**DEPOIS:**
```
João Silva
joao@example.com • +33 6 80 53 73 29
```

## 🚨 Importante

- Execute `fix-existing-profiles.sql` **apenas uma vez**
- Novos cadastros já funcionam automaticamente
- Se um usuário não preencheu nome/telefone no signup, continuará sem esses dados
- Para esses casos, o usuário pode atualizar no **Perfil** depois de fazer login

## 📝 Logs para Debug

Se o problema persistir, verifique:

1. **Supabase SQL Editor:**
   ```sql
   -- Ver dados brutos de um usuário
   SELECT * FROM auth.users WHERE email = 'email@example.com';
   SELECT * FROM public.profiles WHERE email = 'email@example.com';
   ```

2. **Console do navegador (F12):**
   ```
   📊 Agendamentos carregados: [...]
   ```
   Deve mostrar `profiles: { full_name: "Nome", phone: "+33..." }`

3. **Testar trigger manualmente:**
   ```sql
   -- Criar usuário teste e verificar se profile é criado
   -- (só faça isso em ambiente de testes!)
   ```

## ✅ Problema Resolvido!

Com o script executado e o código corrigido:
- ✅ Novos usuários têm dados salvos automaticamente
- ✅ Usuários existentes foram corrigidos
- ✅ Admin mostra nome e telefone corretamente
- ✅ Fallback amigável quando dado não existe
