# Teste Técnico Full Stack — Painel de Demandas

## Contexto

Você entrou em um projeto existente de backoffice. Sua tarefa é corrigir bugs e implementar melhorias seguindo a estrutura atual do projeto.

O sistema é um Painel de Demandas usado para acompanhar demandas de clientes e projetos. A base já possui API, frontend, banco local, dados de seed, tipos compartilhados e alguns testes. Algumas partes ainda estão incompletas ou com comportamento incorreto; elas estão descritas nas tarefas abaixo.

Você não precisa arquitetar uma aplicação do zero. O objetivo é mostrar como você entende uma base existente, corrige regras, integra frontend/backend e entrega mudanças com clareza.

## Antes de começar

Instale dependências, crie o banco local e rode o projeto:

```bash
pnpm install
pnpm seed
pnpm dev
```

Portas:

- API: `http://127.0.0.1:3333`
- Web: `http://127.0.0.1:5173`

Checks úteis:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Mapa rápido do projeto

- `packages/shared`: tipos, enums e schemas Zod compartilhados.
- `apps/api`: API Fastify, banco SQLite, seed e testes de API.
- `apps/web`: aplicação React, rotas, páginas, componentes e service de API.

Use esse mapa para se orientar, mas fique livre para navegar pelo código e encontrar os pontos exatos de mudança.

## Tarefas obrigatórias

### 1. Corrigir regra de demandas atrasadas

Uma demanda só deve ser considerada atrasada quando:

- `dueDate` for anterior à data atual;
- `status` não for `done`;
- `status` não for `cancelled`.

A correção deve refletir na API e na listagem do frontend.

### 2. Implementar filtros na listagem

A listagem deve permitir filtrar por:

- `status`
- `priority`
- `clientId`
- `assigneeId`
- `overdue`
- `search`

Os filtros devem:

- chamar a API corretamente;
- ser refletidos na URL;
- ser preservados ao atualizar a página;
- ser preservados ao navegar para detalhe e voltar.

### 3. Criar tela de nova demanda

Implementar `/demands/new` usando React Hook Form.

Campos:

- `title`
- `description`
- `clientId`
- `projectId`
- `assigneeId`
- `status`
- `priority`
- `dueDate`

Validações:

- `title` obrigatório, mínimo 5 caracteres;
- `description` obrigatório, mínimo 20 caracteres;
- `clientId` obrigatório;
- `projectId` obrigatório;
- `priority` obrigatório;
- `dueDate` obrigatório;
- `dueDate` não pode ser anterior à data atual;
- `assigneeId` obrigatório quando `status` for `in_progress`.

### 4. Criar tela de edição de demanda

Implementar `/demands/:id/edit` usando React Hook Form.

A edição não pode apagar campos que o usuário não alterou.

### 5. Implementar transição de status

Finalizar `PATCH /demands/:id/status`.

Regras:

- não permitir `in_progress` sem responsável;
- não permitir `done` sem responsável;
- ao mudar para `done`, preencher `completedAt` automaticamente;
- `done` e `cancelled` não podem ser reabertos;
- ao mudar status, registrar evento no histórico.

### 6. Exibir histórico e comentários

Na página `/demands/:id`:

- listar eventos da demanda;
- listar comentários;
- permitir adicionar comentário.

### 7. Adicionar testes mínimos

Criar pelo menos:

- 1 teste para regra de atraso;
- 1 teste para transição inválida de status;
- 1 teste para criação de demanda com payload inválido.

## Fora do escopo

Você não precisa implementar:

- autenticação ou autorização;
- deploy;
- Docker;
- banco remoto;
- novo design system;
- troca de stack;
- refatoração ampla sem relação com as tarefas.

## Critérios de avaliação

- funcionalidade;
- organização;
- aderência ao padrão existente;
- clareza no código;
- integração frontend/backend;
- tratamento de erro;
- validações;
- testes;
- README ou observações de entrega;
- commits.

## Entrega esperada

Envie o link do repositório, fork, branch ou pull request com sua solução.

Inclua uma breve descrição com:

- o que foi implementado;
- quais comandos você rodou para validar;
- pendências ou decisões importantes, se houver.

Não é necessário entregar uma solução perfeita ou sofisticada. É mais importante entregar uma solução funcional, coerente com a base existente e bem explicada.
