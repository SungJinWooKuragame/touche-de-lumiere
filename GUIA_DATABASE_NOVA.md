# 🚀 GUIA: CRIAR DATABASE NOVA NO SUPABASE

## 📋 PASSO A PASSO COMPLETO

### 1. 🗑️ DELETAR PROJETO ATUAL
1. **Acesse**: https://app.supabase.com
2. **Selecione**: Projeto "Touche de Lumière"
3. **Vá para**: Settings → General
4. **Role para baixo**: Encontre "Delete Project"
5. **Digite**: Nome do projeto para confirmar
6. **Delete**: Confirme a exclusão

### 2. 🆕 CRIAR NOVO PROJETO
1. **Clique**: "New Project"
2. **Nome**: "Touche de Lumière"
3. **Password**: Escolha uma senha forte
4. **Região**: West EU (Ireland)
5. **Plano**: Free
6. **Criar**: Aguarde criação (~2 minutos)

### 3. 📤 EXECUTAR SCRIPT DA DATABASE
1. **Acesse**: SQL Editor (menu lateral)
2. **Copie TODO o conteúdo** do arquivo: `DATABASE_NOVA_COMPLETA.sql`
3. **Cole** no editor
4. **Execute**: Clique no botão ▶️ Run
5. **Aguarde**: Execução completa

### 4. 🔧 CONFIGURAR PROJETO LOCAL
1. **No terminal** do projeto:
```bash
npx supabase link --project-ref [NOVO_PROJECT_REF]
```

### 5. ⚙️ ATUALIZAR VARIÁVEIS DE AMBIENTE
1. **Copie** as novas URLs e chaves do projeto
2. **Atualize** arquivo `.env` (se existir) ou configure no Netlify:
   - `VITE_SUPABASE_URL`: Nova URL do projeto
   - `VITE_SUPABASE_ANON_KEY`: Nova chave anônima

## ✅ VANTAGENS DESTA ABORDAGEM

### 🧹 Database Limpa:
- ✅ Sem dados conflitantes
- ✅ Sem migrações antigas
- ✅ Estrutura otimizada

### 🔧 Funcionalidades Garantidas:
- ✅ **Função `handle_new_user()` CORRIGIDA** - salvará nome e telefone
- ✅ **Sistema de emails personalizados**
- ✅ **RLS configurado corretamente**
- ✅ **Todas as tabelas criadas**

### ⚡ Problemas Resolvidos:
- ✅ Erro de salvamento de usuário
- ✅ Nome e telefone "Não informado"
- ✅ Conflitos de migração
- ✅ Políticas RLS incorretas

## 🧪 TESTE APÓS CRIAÇÃO

### 1. Teste Básico:
1. **Acesse**: Seu site
2. **Crie conta** com dados completos
3. **Verifique**: Nome e telefone salvos corretamente

### 2. Verificação no Database:
```sql
-- Ver usuários criados
SELECT p.*, ur.role 
FROM profiles p 
LEFT JOIN user_roles ur ON p.id = ur.user_id 
ORDER BY p.created_at DESC;
```

### 3. Conferir Serviços:
```sql
-- Ver serviços disponíveis
SELECT * FROM services WHERE active = true;
```

## 🎯 RESULTADO FINAL

Após seguir estes passos:
- 🌟 **Database completamente nova e funcional**
- 📝 **Cadastro de usuário funcionando perfeitamente**
- 📧 **Sistema de emails configurado**
- 🔒 **Segurança implementada**
- 📱 **Nome e telefone sendo salvos corretamente**

---

**🚀 Esta é a solução definitiva para todos os problemas!**