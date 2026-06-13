# Entrega — Painel de Demandas

Observações de entrega do teste técnico. Descreve **o que foi implementado**, **como validar**
e as **decisões/pendências**. O detalhamento vai por tarefa, seguido das correções extras que
surgiram durante os testes, da estratégia de validação, do tratamento de erros, dos testes e
dos commits.

> **Resumo:** as 7 tarefas do enunciado foram concluídas seguindo a estrutura existente do
> monorepo, com as regras de negócio validadas no backend e replicadas no formulário via
> schemas Zod compartilhados.

---

## Índice

1. [Como rodar](#como-rodar)
2. [As 7 tarefas](#as-7-tarefas)
3. [Correções extras encontradas nos testes](#correções-extras-encontradas-nos-testes)
4. [Validação compartilhada](#validação-compartilhada)
5. [Tratamento de erros](#tratamento-de-erros)
6. [Testes](#testes)
7. [Comandos rodados para validar](#comandos-rodados-para-validar)
8. [Commits](#commits)

---

## Como rodar

```bash
pnpm install
pnpm seed
pnpm dev
```

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3333` (health em `/health`)

### Notas de ambiente (Windows)

- **Node 22.x** é recomendado. No Node 20 o `better-sqlite3` não encontrou binário
  pré-compilado e tentou compilar (exigindo Visual Studio Build Tools + Windows SDK). No
  Node 22 o binário é baixado pronto e a instalação funciona sem compilar.
- O projeto fixa **pnpm 10.28.0** via `packageManager`. Com Corepack antigo, pode ser preciso
  atualizá-lo (`npm i -g corepack@latest`) antes de
  `corepack enable && corepack prepare pnpm@10.28.0 --activate`.

---

## As 7 tarefas

Para cada uma: **Pedido** · **Estado anterior** (o que estava errado/faltando) · **O que foi
feito** · **Arquivos**.

### Tarefa 1 — Corrigir regra de demandas atrasadas
- **Pedido:** atrasada apenas quando `dueDate < hoje` **e** `status !== 'done'` **e**
  `status !== 'cancelled'`.
- **Estado anterior (bug):** `isDemandOverdue` recebia o `status` mas **só comparava a data** —
  ignorava o status. Havia até um teste que afirmava o comportamento bugado.
- **O que foi feito:** a função retorna `false` para `done`/`cancelled` antes de comparar a
  data. Como API (`mapDemandWithRelations`) e front (que lê `isOverdue`) usam essa função, a
  correção propaga aos dois lados. O teste foi reescrito para validar o comportamento correto.
- **Arquivos:** `packages/shared/src/index.ts`, `packages/shared/src/index.test.ts`.

### Tarefa 2 — Filtros na listagem (`GET /demands`)
- **Pedido:** filtrar por `status`, `priority`, `clientId`, `assigneeId`, `overdue`, `search`;
  refletir na URL; preservar no reload e na volta do detalhe.
- **Estado anterior:** backend só filtrava `status` e `search`; os outros 4 eram ignorados.
  No front, `updateFilters` só gravava `status`/`search` na URL.
- **O que foi feito:** backend ganhou os `WHERE` de `priority`/`clientId`/`assigneeId` e o
  filtro `overdue` em memória (reusando `isOverdue`, sem duplicar a regra em SQL). O front passa
  a serializar **todos** os filtros na query string. Reload e volta do detalhe já funcionam
  porque o estado deriva da URL (`useSearchParams`) e a tabela injeta `returnTo`.
- **Arquivos:** `apps/api/src/repository.ts`, `apps/web/src/pages/DemandsListPage.tsx`.

### Tarefa 3 — Tela de nova demanda (`/demands/new`)
- **Pedido:** formulário com os 8 campos e validações (`title ≥ 5`, `description ≥ 20`,
  obrigatórios, `dueDate ≥ hoje`, responsável obrigatório em `in_progress`).
- **Estado anterior:** o `DemandForm` existia, mas o `onSubmit` era um **stub** (`console.info`).
- **O que foi feito:** criado `createDemandFormSchema` no `shared` (refine de `dueDate ≥ hoje` e
  responsável obrigatório por status); a API passou a usar esse schema (removendo as checagens
  imperativas duplicadas); `onSubmit` ligado ao `api.createDemand` com navegação e tratamento de
  erro. Coerção de `assigneeId: "" → null` (o select "Sem responsável" emitia `""`).
- **Arquivos:** `packages/shared/src/index.ts`, `apps/api/src/repository.ts`,
  `apps/web/src/components/DemandForm.tsx`, `apps/web/src/pages/DemandFormPage.tsx`.

### Tarefa 4 — Tela de edição (`/demands/:id/edit`)
- **Pedido:** edição via `PATCH`; não sobrescrever campos não alterados.
- **Estado anterior:** mesmo `onSubmit` stub. A infra de PATCH parcial já existia na API
  (`normalizePatchPayload`), mas nada no front a usava.
- **O que foi feito:** no modo edição, o payload é montado a partir de `formState.dirtyFields` —
  só os campos alterados são enviados. O resolver de edição não aplica `dueDate ≥ hoje` (para
  não travar demandas já vencidas).
- **Arquivos:** `apps/web/src/components/DemandForm.tsx`.

### Tarefa 5 — Transição de status (`PATCH /demands/:id/status`)
- **Pedido:** proibir `in_progress`/`done` sem responsável; `completedAt` ao concluir;
  `done`/`cancelled` irreversíveis; registrar evento.
- **Estado anterior:** `changeDemandStatus` só gravava o status, **sem nenhuma regra**.
- **O que foi feito (backend):** guardas — demanda concluída/cancelada → **409** (irreversível);
  alvo `in_progress`/`done` sem responsável → **400**. `completedAt` e evento `status_changed`
  mantidos. **(frontend):** `api.changeStatus` + controle de status no detalhe, desabilitado em
  estado terminal e exibindo o erro 409/400.
- **Arquivos:** `apps/api/src/repository.ts`, `apps/web/src/services/api.ts`,
  `apps/web/src/pages/DemandDetailPage.tsx`.

### Tarefa 6 — Histórico e comentários (`/demands/:id`)
- **Pedido:** listar eventos, listar comentários, permitir adicionar comentário.
- **Estado anterior:** listagem de eventos/comentários já existia; faltava **adicionar**.
- **O que foi feito:** formulário de novo comentário validado por `addCommentSchema`; ao enviar,
  chama `api.addComment` e recarrega a demanda (reflete o comentário e o evento `comment_added`).
- **Arquivos:** `apps/web/src/pages/DemandDetailPage.tsx`.

### Tarefa 7 — Testes mínimos (Vitest)
- **Pedido:** ≥1 teste de atraso, ≥1 de transição inválida, ≥1 de criação inválida.
- **O que foi feito:** atraso no `shared` (incl. `done`/`cancelled` e prazo futuro); na `api`,
  criação inválida (400), reabertura proibida (409), `in_progress` sem responsável (400), além
  dos testes de regressão das correções extras.
- **Arquivos:** `packages/shared/src/index.test.ts`, `apps/api/src/demands.test.ts`.

---

## Correções extras encontradas nos testes

Três problemas **latentes da base** só apareceram depois que os fluxos de escrita foram ligados
no frontend. Foram corrigidos com testes de regressão:

1. **CORS sem PATCH** — o `@fastify/cors` estava registrado só com `{ origin: true }`, e o
   default da lib é `methods: 'GET,HEAD,POST'`. Como antes nenhum PATCH partia do navegador, o
   problema era invisível; ao ligar edição/troca de status, o navegador passou a bloquear o
   PATCH no preflight ("Failed to fetch"). **Fix:** incluir `PATCH` em `methods`
   (`apps/api/src/server.ts`).

2. **Invariante de responsável** — pela edição dava para remover o responsável de uma demanda
   `in_progress`/`done`, deixando-a sem responsável. **Fix:** `updateDemand` rejeita (**400**)
   qualquer edição que viole a invariante; o `editDemandFormSchema` espelha a regra no formulário.
   (`apps/api/src/repository.ts`, `packages/shared/src/index.ts`,
   `apps/web/src/components/DemandForm.tsx`).

---

## Validação compartilhada

`packages/shared` é a fonte única; API e formulário consomem os mesmos schemas Zod:

| Regra | Schema | API | Formulário |
|---|---|---|---|
| Shape + mínimos | `createDemandSchema` | `createDemand` | base de criação/edição |
| `dueDate ≥ hoje` + responsável por status (criação) | `createDemandFormSchema` | `createDemand` | resolver de criação |
| Responsável por status (edição, sem regra de data) | `editDemandFormSchema` | — | resolver de edição |
| Update parcial | `updateDemandSchema` | `updateDemand` | — |
| Status | `statusChangeSchema` | `changeDemandStatus` | `api.changeStatus` |
| Comentário | `addCommentSchema` | `addComment` | form de comentário |
| Filtros | `demandFiltersSchema` | `listDemands` | leitura da URL |

`createDemandSchema` é mantido como objeto puro (para `updateDemandSchema` derivar via
`.partial()`); as regras cruzadas ficam em schemas derivados com `.refine()`. As regras de
**estado** (transição, invariante) ficam na API, pois dependem do estado atual no banco.

---

## Tratamento de erros

Padrão existente `RepositoryResult` → `sendRepositoryResult` → `reply.code().send()`:

- **400** — payload inválido (Zod, com `issues`) e regras de responsável (criação, edição,
  transição).
- **404** — demanda inexistente.
- **409** — reabrir demanda concluída/cancelada (conflito de estado).

No front, o wrapper `request` lança `Error` com a `message`; formulários e controle de status
exibem essa mensagem (erros de campo e de envio).

---

## Testes

```bash
pnpm test
```

- `packages/shared` — 4 testes (regra de atraso + contrato de criação).
- `apps/api` — 7 testes (2 originais + criação inválida, reabertura 409, `in_progress` sem
  responsável 400, status não muda via PATCH genérico, remover responsável de `in_progress` 400).
- `apps/web` — sem testes (passa com `--passWithNoTests`).

Além disso, todas as regras foram exercitadas de ponta a ponta contra a API em execução
(criação válida/inválida, transições 400/409/200, evento na transição, `completedAt`, PATCH
parcial, invariante de responsável, comentário + evento, filtros, atraso).

---

## Comandos rodados para validar

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Todos passam nesta entrega.

---

## Commits

12 commits incrementais (Conventional Commits, em inglês):

```
fix:  exclude done and cancelled demands from overdue rule           # T1
feat: filter demands by priority, client, assignee and overdue       # T2 (API)
feat: persist all demand filters in the URL query string             # T2 (Web)
feat: enforce status transition rules on demands                     # T5 (API)
feat: wire new demand creation with shared form validation           # T3
feat: send only changed fields when editing a demand                 # T4
feat: change status and add comments from demand detail              # T6 + T5 (Web)
test: cover invalid create payload and status transitions            # T7
fix:  allow PATCH method in CORS configuration                       # extra
fix:  keep status changes behind the guarded status endpoint         # extra
fix:  require an assignee when editing in_progress or done demands    # extra
docs: add delivery notes                                             # entrega
```
