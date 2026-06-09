# Painel de Demandas

Repositório base para um teste técnico full stack.

Este projeto simula um backoffice interno usado para acompanhar demandas de clientes e projetos. A base já possui API, frontend, banco local, seed e alguns testes. O objetivo do teste é evoluir um sistema existente, seguindo a estrutura atual, sem reescrever tudo do zero.

Leia também o [ENUNCIADO.md](./ENUNCIADO.md), que descreve as tarefas obrigatórias.

## Pré-requisitos

- Node.js compatível com `20.x`, `22.x`, `23.x`, `24.x`, `25.x` ou `26.x`.
- pnpm `10` ou superior.

Se você usa Corepack:

```bash
corepack enable
```

## Como rodar do zero

```bash
pnpm install
pnpm seed
pnpm dev
```

Depois disso, acesse:

- Web: `http://127.0.0.1:5173`
- API health check: `http://127.0.0.1:3333/health`

O comando `pnpm dev` sobe API e frontend ao mesmo tempo. Se preferir rodar separadamente:

```bash
pnpm dev:api
pnpm dev:web
```

## Stack

- Node.js
- TypeScript
- Fastify
- React com Vite
- React Router
- React Hook Form
- Zod
- SQLite local com `better-sqlite3`
- pnpm workspaces
- Vitest

## Estrutura do projeto

```txt
apps/
  api/      API Fastify + SQLite
  web/      App React/Vite
packages/
  shared/   Tipos, enums e schemas Zod compartilhados
```

Pontos úteis para se orientar:

- `packages/shared/src/index.ts`: tipos, enums e schemas compartilhados.
- `apps/api/src/server.ts`: registro das rotas HTTP.
- `apps/api/src/repository.ts`: leitura, escrita e regras atuais da API.
- `apps/api/src/seed-data.ts`: dados iniciais do banco local.
- `apps/web/src/pages`: páginas do React Router.
- `apps/web/src/components`: componentes reutilizados nas páginas.
- `apps/web/src/services/api.ts`: wrapper simples de `fetch`.

## Banco e seed

O banco local fica em `apps/api/data/dev.sqlite`.

Para recriar os dados iniciais:

```bash
pnpm seed
```

O seed cria clientes, projetos, responsáveis, demandas, eventos e comentários. Ele inclui demandas em diferentes status, demandas atrasadas, concluídas, canceladas e algumas sem responsável.

## Scripts úteis

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Antes de entregar o teste, rode pelo menos:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Endpoints iniciais

- `GET /health`
- `GET /clients`
- `GET /projects`
- `GET /assignees`
- `GET /demands`
- `GET /demands/:id`
- `POST /demands`
- `PATCH /demands/:id`
- `PATCH /demands/:id/status`
- `GET /demands/:id/events`
- `POST /demands/:id/comments`

## Escopo do teste

O projeto já tem telas, endpoints e dados iniciais suficientes para você entender o domínio e começar a trabalhar. As melhorias esperadas estão descritas no [ENUNCIADO.md](./ENUNCIADO.md).

Use o README para preparar o ambiente e entender a estrutura. Use o enunciado para acompanhar as tarefas que devem ser entregues.

## Orientações para trabalhar na base

- Preserve a estrutura do monorepo e os padrões já existentes.
- Prefira mudanças pequenas e focadas nas tarefas do enunciado.
- Valide regras importantes no backend, mesmo que também exista validação no frontend.
- Use os tipos e schemas compartilhados quando fizer sentido.
- Se encontrar algo fora do escopo, descreva na entrega em vez de abrir uma grande refatoração.

## Problemas comuns

- Se `pnpm install` falhar por versão de Node, confira os pré-requisitos acima.
- Se as portas `3333` ou `5173` estiverem ocupadas, encerre o processo que estiver usando a porta ou rode API e web separadamente com outra configuração.
- Se os dados parecerem inconsistentes durante testes manuais, rode `pnpm seed` novamente para resetar o banco local.
