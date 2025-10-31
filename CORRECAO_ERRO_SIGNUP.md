# 🐛 CORREÇÃO: Erro ao Salvar Usuário na DB

## ❌ PROBLEMA IDENTIFICADO

A função `handle_new_user()` não estava capturando o campo `phone` dos metadados do usuário durante o signup, causando falha ao salvar no banco.

## ✅ SOLUÇÃO APLICADA

Criei uma nova migração: `20251031130000_fix_user_signup_phone.sql`

A função agora captura corretamente:
- ✅ **Nome completo** dos metadados
- ✅ **Telefone** dos metadados  
- ✅ **Email** padrão do auth
- ✅ **Role** de cliente

## 🚀 COMO APLICAR A CORREÇÃO

### OPÇÃO 1: Dashboard Supabase (RECOMENDADO)

1. **Acesse**: [Supabase Dashboard](https://app.supabase.com)
2. **Vá para**: SQL Editor
3. **Copie o conteúdo** do arquivo: `supabase/migrations/20251031130000_fix_user_signup_phone.sql`
4. **Cole** no editor
5. **Execute** (botão Run)

### OPÇÃO 2: Supabase CLI (se disponível)

```bash
npx supabase db push
```

## 🧪 COMO TESTAR

### 1. Após aplicar a migração:
1. **Acesse**: Seu site 
2. **Clique**: "Criar Conta"
3. **Preencha todos os campos** (nome, email, telefone, senha)
4. **Crie a conta**
5. **Verifique**: Se não há mais erro

### 2. Verificar no banco:
```sql
-- Ver se o usuário foi criado corretamente
SELECT p.*, ur.role 
FROM profiles p 
LEFT JOIN user_roles ur ON p.id = ur.user_id 
ORDER BY p.created_at DESC 
LIMIT 5;
```

## 🔍 LOGS PARA MONITORAR

### Console do Browser (F12):
- Procure por erros durante o signup
- Mensagens de "📧 Email personalizado enviado"

### Supabase Dashboard:
- **Authentication → Users**: Ver novos usuários
- **Database → profiles**: Verificar dados salvos
- **Database → user_roles**: Verificar roles atribuídas

## 🎯 RESULTADO ESPERADO

Após a correção:
- ✅ **Usuário criado** sem erro
- ✅ **Perfil salvo** com todos os dados
- ✅ **Role atribuída** (client)
- ✅ **Email de verificação** enviado
- ✅ **Telefone registrado** corretamente

---

**🔧 Status**: Correção pronta para aplicação no banco de dados!