# Frontend - Processo Seletivo Banana Ltda.

Frontend em **React + TypeScript + Vite** para o teste técnico de FullStack. Este projeto consome dois microsserviços independentes:

- **Back-end C#** para autenticação de usuários e emissão de JWT.
- **Back-end Python** para gestão de reservas, salas e locais.

O objetivo desta aplicação é entregar uma interface web responsiva, organizada e funcional para o fluxo completo de autenticação, cadastro, listagem, edição e exclusão de reservas.

## Arquitetura e Diagramas

Para uma visão visual da arquitetura, fluxo de autenticação e modelo de domínio, consulte [**DIAGRAMAS.md**](../DIAGRAMAS.md).

## Visão geral da arquitetura

A solução foi desenhada para seguir a separação de responsabilidades descrita no enunciado:

- **Serviço de autenticação (C#)**
  - Responsável por cadastro e login.
  - Retorna um JWT assinado após autenticação.
- **Serviço de reservas (Python)**
  - Responsável por locais, salas e reservas.
  - Valida o JWT em todas as rotas protegidas.
  - Processa listagem, criação, edição e exclusão de reservas.
- **Frontend (este repositório)**
  - Consome os dois serviços.
  - Usa o serviço C# para login/cadastro.
  - Usa o serviço Python para todas as operações de reserva.
  - Envia o JWT no header `Authorization: Bearer <token>`.

### Fluxo de autenticação e uso do JWT

1. O usuário informa e-mail e senha na tela de login.
2. O frontend envia `POST /login` para o serviço C#.
3. O serviço C# retorna um JWT assinado.
4. O frontend salva o token em `localStorage`.
5. Em toda requisição para o serviço Python, o token é enviado no header `Authorization`.
6. O backend Python valida o JWT localmente antes de processar a requisição.

> A chave de assinatura do JWT deve ser compartilhada entre os dois serviços via variável de ambiente, conforme solicitado no enunciado.

## Funcionalidades implementadas

- Tela de login e cadastro.
- Proteção de rotas com redirecionamento para login quando não autenticado.
- Listagem de reservas.
- Cadastro e edição de reservas.
- Exclusão individual de reservas.
- Exclusão em lote de reservas selecionadas.
- Cadastro e listagem de locais.
- Cadastro e listagem de salas.
- Tratamento de expiração de token JWT.
- Persistência de sessão via `localStorage`.
- Modal de confirmação para exclusões.
- Interface responsiva para uso em desktop e mobile.

Foi adicionada uma interface simples de gerenciamento de salas e locais para facilitar testes e uso da aplicação, embora isso não fosse um requisito obrigatório do enunciado.

## Tecnologias e justificativas

- **React**: base do front-end componentizado e reativo.
- **TypeScript**: adiciona tipagem estática, reduz erros e melhora manutenção.
- **Vite**: ambiente de desenvolvimento rápido e build enxuto.
- **React Router DOM**: gerenciamento de rotas públicas e privadas.
- **Axios**: cliente HTTP para integração com os microsserviços.

## Estrutura do projeto

```text
src/
  App.tsx              # Rotas principais da aplicação
  App.css              # Layout e identidade visual da interface
  index.css            # Estilos globais
  main.tsx             # Ponto de entrada do React
  components/
    ConfirmDialog.tsx  # Modal de confirmação
    ProtectedRoute.tsx # Proteção de rotas autenticadas
  context/
    AuthContext.tsx    # Estado global de autenticação
  lib/
    dates.ts           # Conversão e formatação de datas
  pages/
    LoginPage.tsx      # Tela de login e cadastro
    DashboardPage.tsx  # Painel principal de reservas
  services/
    api.ts             # Instâncias Axios e interceptors
    authService.ts     # Integração com o serviço C#
    reservationService.ts # Integração com o serviço Python
  types.ts             # Tipos TypeScript do domínio
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, se necessário, com as URLs dos serviços:

```env
VITE_AUTH_API_URL=https://localhost:7081/api/user
VITE_RESERVATIONS_API_URL=http://localhost:8000
```

### Padrões usados

Se as variáveis acima não forem informadas, o frontend usa estes valores padrão:

- `VITE_AUTH_API_URL` → `https://localhost:7081/api/user`
- `VITE_RESERVATIONS_API_URL` → `http://localhost:8000`

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o ambiente de desenvolvimento

```bash
npm run dev
```

O Vite normalmente sobe em:

```text
http://localhost:5173/
```

### 3. Build de produção

```bash
npm run build
```

### 4. Visualizar o build gerado

```bash
npm run preview
```

### 5. Verificação de lint

```bash
npm run lint
```

## Integração com os microsserviços

### Serviço C# de autenticação

Este frontend espera que o serviço de autenticação exponha, no mínimo:

- `POST /login`
- `POST /register`

No login, o retorno esperado é um JSON com a propriedade `token`.

Exemplo esperado:

```json
{
  "token": "<jwt-assinado>"
}
```

### Serviço Python de reservas

Este frontend consome as rotas de reservas, locais e salas do serviço Python, incluindo:

- `GET /locations/`
- `POST /locations/`
- `GET /rooms/`
- `POST /rooms/`
- `PUT /rooms/{id}`
- `GET /reservations/`
- `POST /reservations/`
- `PUT /reservations/{id}`
- `DELETE /reservations/{id}`
- `DELETE /reservations/batch/` para exclusão em lote

Todas as requisições autenticadas enviam o JWT no header:

```http
Authorization: Bearer <token>
```

## Observações de implementação

- O token JWT é armazenado em `localStorage` com a chave `banana.test.jwt`.
- Tokens expirados são removidos automaticamente no frontend.
- Quando o backend Python responde `401`, o frontend limpa a sessão e redireciona para `/login`.
- A exclusão em lote é suportada via checkbox na listagem de reservas.
- O formulário de reservas permite informar café e quantidade de pessoas quando aplicável.
- As datas são enviadas como datetime local sem fuso, para compatibilidade com o backend Python.

## Decisões de qualidade e organização

- Separação clara entre páginas, componentes, contexto, serviços e utilitários.
- Tipos centralizados em `src/types.ts`.
- Reuso de lógica HTTP via `src/services/api.ts`.
- Tratamento de erros padronizado com mensagens amigáveis.
- Interface pensada para produtividade em desktop, mantendo responsividade para telas menores.

## Responsabilidade deste repositório

Este repositório contém apenas o **frontend web**. A persistência dos dados e a regra de negócio ficam nos microsserviços de back-end.

Em outras palavras:

- este projeto não implementa banco de dados;
- este projeto não implementa a API de autenticação;
- este projeto não implementa a API de reservas;
- este projeto apenas consome essas APIs e apresenta a experiência do usuário.

## Licença

Projeto desenvolvido para fins de avaliação técnica.
