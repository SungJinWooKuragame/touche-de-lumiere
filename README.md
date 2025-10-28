# 🌸 Touche de Lumière - Sistema de Agendamento para Terapias

Uma plataforma moderna e elegante para agendamento de sessões de terapia, desenvolvida com React, TypeScript e Supabase.

## ✨ Características Principais

- 🎨 **Design Moderno**: Interface limpa com gradientes suaves e animações elegantes
- 🪷 **Logo Personalizada**: Linda flor de lótus SVG simbolizando renovação e bem-estar
- 🌐 **Multilíngue**: Suporte para Português, Inglês e Francês
- 📱 **Responsivo**: Funciona perfeitamente em desktop e mobile
- 🔐 **Autenticação Segura**: Sistema completo com Supabase Auth
- 📅 **Integração Google Calendar**: Sincronização automática de agendamentos
- 💰 **Gestão Financeira**: Dashboard com métricas de receita por cliente
- 📧 **Email Automático**: Notificações de cancelamento de consultas
- ⏰ **Horários de Funcionamento**: Sistema inteligente de disponibilidade
- 🎯 **Organização por Cliente**: Agendamentos agrupados em pastas expansíveis

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Integração**: Google Calendar API
- **Ícones**: Lucide React
- **Animações**: CSS Transitions + Transforms
- **Deploy**: Netlify (configuração automática)

## 🚀 Configuração e Deploy

### Pré-requisitos
- Node.js 18+
- Conta no Supabase
- Conta no Google Cloud (para Calendar API)

### Instalação Local
```bash
# Clone o repositório
git clone https://github.com/SungJinWooKuragame/touche-de-lumiere.git
cd touche-de-lumiere

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas chaves

# Execute o projeto
npm run dev
```

### Deploy Automático no Netlify
1. Conecte este repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O deploy acontece automaticamente a cada push na branch `main`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes reutilizáveis (Shadcn/UI)
│   ├── Navbar.tsx       # Navegação principal
│   └── ThemeToggle.tsx  # Alternador de tema
├── pages/
│   ├── Index.tsx        # Página inicial
│   ├── Agendar.tsx      # Sistema de agendamento
│   ├── Admin.tsx        # Painel administrativo
│   └── Login.tsx        # Autenticação
├── integrations/
│   └── supabase/        # Configuração do banco
└── i18n/               # Arquivos de tradução
```

## 🎨 Design System

### Cores Principais
- **Primary**: Gradientes roxo/rosa para elementos principais
- **Secondary**: Tons complementares para acentos
- **Background**: Branco/cinza claro com blur backdrop

### Tipografia
- **Headings**: Inter Bold com gradientes
- **Body**: Inter Regular
- **UI Elements**: Inter Medium

### Componentes
- Botões com hover effects e transitions
- Cards com shadow soft e border radius
- Inputs com focus states elegantes
- Modais com backdrop blur

## 💾 Banco de Dados

### Tabelas Principais
- `profiles` - Perfis de usuários
- `user_roles` - Níveis de acesso (owner/user)
- `services` - Tipos de terapia oferecidos
- `appointments` - Agendamentos realizados
- `operating_hours` - Horários de funcionamento
- `google_calendar_settings` - Configurações de integração

### Funcionalidades do Supabase
- Row Level Security (RLS) habilitada
- Triggers para atualizações automáticas
- Edge Functions para integrações externas
- Real-time subscriptions para updates

## 🔗 Integrações

### Google Calendar API
- Criação automática de eventos
- Sincronização bidirecional
- OAuth 2.0 seguro
- Gestão de conflitos de horários

### Sistema de Email
- Templates personalizados
- Notificações de cancelamento
- Confirmações de agendamento
- Lembretes automáticos

## 📈 Métricas e Analytics

- Dashboard financeiro por cliente
- Relatórios de receita mensal
- Acompanhamento de agendamentos
- Estatísticas de cancelamentos

## 🔒 Segurança

- Autenticação JWT via Supabase
- Proteção de rotas sensíveis
- Validação de dados no frontend/backend
- Rate limiting em APIs
- HTTPS obrigatório

## 🌍 Deploy e Monitoramento

### Netlify Configuration
- Build automático via Git push
- Preview deployments para PRs
- Custom domain support
- SSL automático
- Performance monitoring

### Variáveis de Ambiente Necessárias
```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_key_anonima
GOOGLE_CALENDAR_API_KEY=sua_api_key_google
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:
- Email: leonardomanuelmoreiradasilva@gmail.com
- GitHub: [@SungJinWooKuragame](https://github.com/SungJinWooKuragame)

---

Desenvolvido com 💜 por Leonardo Silva
