# Painel de Demandas

Repositório base para um teste técnico full stack de nível junior avançado / pleno inicial.

O objetivo é simular manutenção e evolução de um sistema existente. A base já roda, possui API, frontend, banco local, seed e alguns testes, mas não está completa. Algumas regras e telas estão deliberadamente incompletas para que o candidato implemente as melhorias descritas em [ENUNCIADO.md](./ENUNCIADO.md).

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

## Estrutura

```txt
apps/
  api/      API Fastify + SQLite
  web/      App React/Vite
packages/
  shared/   Tipos, enums e schemas Zod compartilhados
```

## Instalação

```bash
pnpm install
```

## Banco e seed

O banco local fica em `apps/api/data/dev.sqlite`.

```bash
pnpm seed
```

O seed cria clientes, projetos, responsáveis, demandas, eventos e comentários.

## Rodando o projeto

Para subir API e web juntos:

```bash
pnpm dev
```

Também é possível rodar separadamente:

```bash
pnpm dev:api
pnpm dev:web
```

Portas:

- API: `http://127.0.0.1:3333`
- Web: `http://127.0.0.1:5173`

## Scripts úteis

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

## Lacunas intencionais

- A regra de demanda atrasada considera qualquer prazo passado como atraso, inclusive demandas `done` e `cancelled`.
- Os filtros avançados da listagem existem na UI, mas não estão completamente refletidos na URL e na API.
- `PATCH /demands/:id/status` existe, mas ainda não aplica todas as validações de transição.
- O histórico já existe, mas o fluxo ainda não cobre todos os eventos esperados.
- O formulário de nova demanda/edição usa React Hook Form, mas o envio ainda não está conectado ao backend.
- Há testes iniciais, mas testes importantes ainda devem ser adicionados pelo candidato.
