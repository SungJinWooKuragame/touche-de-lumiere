// Configurações do Google Calendar
// Altere estes valores com suas credenciais reais e salve o arquivo

export const GOOGLE_CALENDAR_CONFIG = {
  // Suas credenciais do Google Cloud Console
  CLIENT_ID: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
  CLIENT_SECRET: "SEU_CLIENT_SECRET_AQUI",
  
  // URLs de redirecionamento
  REDIRECT_URIS: [
    "http://localhost:8080/admin",
    "http://localhost:5173/admin",
    "https://c09dfea7-6357-4649-8415-19ad93935da0.lovableproject.com/admin"
  ],
  
  // Configurações do OAuth
  SCOPES: [
    "https://www.googleapis.com/auth/calendar"
  ],
  
  // Email de teste
  TEST_EMAIL: "okamichan2022@gmail.com"
};

// Para usar:
// 1. Substitua CLIENT_ID e CLIENT_SECRET pelos seus valores reais
// 2. O sistema carregará automaticamente essas configurações
// 3. Não precisará digitar novamente!