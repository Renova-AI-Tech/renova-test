import type { AppDatabase } from "./db";
import { resetDatabase } from "./db";

const dayInMs = 24 * 60 * 60 * 1000;

function dateFromNow(days: number) {
  return new Date(Date.now() + days * dayInMs).toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

const clients = [
  { id: "client-aurora", name: "Aurora Alimentos" },
  { id: "client-boreal", name: "Boreal Energia" },
  { id: "client-campos", name: "Campos & Filhos" },
  { id: "client-delta", name: "Delta Logistica" }
];

const projects = [
  { id: "project-aurora-crm", clientId: "client-aurora", name: "CRM Comercial" },
  { id: "project-aurora-portal", clientId: "client-aurora", name: "Portal do Cliente" },
  { id: "project-boreal-bi", clientId: "client-boreal", name: "BI Operacional" },
  { id: "project-campos-erp", clientId: "client-campos", name: "ERP Interno" },
  { id: "project-campos-app", clientId: "client-campos", name: "Aplicativo de Campo" },
  { id: "project-delta-ops", clientId: "client-delta", name: "Painel de Operacoes" }
];

const assignees = [
  { id: "assignee-ana", name: "Ana Martins", email: "ana.martins@example.com" },
  { id: "assignee-bruno", name: "Bruno Costa", email: "bruno.costa@example.com" },
  { id: "assignee-carla", name: "Carla Dias", email: "carla.dias@example.com" },
  { id: "assignee-diego", name: "Diego Lima", email: "diego.lima@example.com" },
  { id: "assignee-elaine", name: "Elaine Rocha", email: "elaine.rocha@example.com" }
];

const demandSeeds = [
  ["demand-001", "Revisar funil comercial", "Validar divergencias no relatorio de oportunidades por etapa.", "client-aurora", "project-aurora-crm", "assignee-ana", "backlog", "medium", 12, null],
  ["demand-002", "Corrigir importacao de contatos", "A importacao CSV falha quando o arquivo tem colunas opcionais vazias.", "client-aurora", "project-aurora-crm", "assignee-bruno", "todo", "high", -3, null],
  ["demand-003", "Ajustar tela de contrato", "Campos obrigatorios aparecem fora de ordem no fluxo de aceite.", "client-aurora", "project-aurora-portal", null, "todo", "medium", 8, null],
  ["demand-004", "Investigar atraso no dashboard", "O tempo de carregamento do dashboard operacional aumentou apos a ultima release.", "client-boreal", "project-boreal-bi", "assignee-carla", "in_progress", "urgent", -1, null],
  ["demand-005", "Criar exportacao CSV", "Adicionar exportacao simples para a lista de indicadores diarios.", "client-boreal", "project-boreal-bi", "assignee-diego", "blocked", "low", 4, null],
  ["demand-006", "Atualizar permissao financeira", "Permissao do grupo financeiro precisa refletir a matriz atualizada.", "client-campos", "project-campos-erp", "assignee-elaine", "done", "high", -10, -2],
  ["demand-007", "Cancelar integracao antiga", "Demanda cancelada apos mudanca de prioridade no roadmap do cliente.", "client-campos", "project-campos-app", null, "cancelled", "low", -20, null],
  ["demand-008", "Mapear erro em notificacoes", "Notificacoes de aprovacao estao duplicadas para alguns usuarios.", "client-delta", "project-delta-ops", "assignee-ana", "in_progress", "high", 2, null],
  ["demand-009", "Reorganizar cards do painel", "Cliente pediu agrupamento por prioridade no painel de operacoes.", "client-delta", "project-delta-ops", null, "backlog", "medium", 18, null],
  ["demand-010", "Ajustar regra de SLA", "Regra de SLA precisa ignorar demandas canceladas em calculos gerenciais.", "client-boreal", "project-boreal-bi", "assignee-bruno", "todo", "urgent", -7, null],
  ["demand-011", "Normalizar nomes de projetos", "Alguns projetos aparecem duplicados por diferenca de capitalizacao.", "client-campos", "project-campos-erp", "assignee-carla", "done", "medium", 1, 0],
  ["demand-012", "Criar validacao de formulario", "Formulario de demanda aceita descricoes muito curtas no fluxo atual.", "client-aurora", "project-aurora-portal", "assignee-diego", "blocked", "medium", -2, null],
  ["demand-013", "Corrigir busca por cliente", "Busca textual nao encontra demandas quando o termo esta no nome do cliente.", "client-delta", "project-delta-ops", "assignee-elaine", "todo", "medium", 6, null],
  ["demand-014", "Adicionar comentario interno", "Equipe precisa registrar observacoes rapidas no historico da demanda.", "client-aurora", "project-aurora-crm", null, "backlog", "low", 22, null],
  ["demand-015", "Revisar timeout de integracao", "Timeout atual interrompe processamento de cargas maiores no ERP.", "client-campos", "project-campos-erp", "assignee-ana", "in_progress", "urgent", 3, null],
  ["demand-016", "Cancelar melhoria visual", "Mudanca visual removida do escopo depois de reuniao com o cliente.", "client-boreal", "project-boreal-bi", "assignee-bruno", "cancelled", "medium", -5, null],
  ["demand-017", "Fechar ajuste de relatorio", "Relatorio mensal passou a exibir totais corretos apos ajuste pontual.", "client-delta", "project-delta-ops", "assignee-carla", "done", "high", -12, -1],
  ["demand-018", "Planejar nova automacao", "Levantar premissas para uma automacao de conferencias operacionais.", "client-campos", "project-campos-app", null, "backlog", "medium", 30, null],
  ["demand-019", "Desbloquear aprovacao", "Fluxo de aprovacao esta bloqueado aguardando decisao do cliente.", "client-aurora", "project-aurora-portal", "assignee-diego", "blocked", "high", 5, null],
  ["demand-020", "Corrigir ordenacao por prazo", "Demandas sem responsavel aparecem antes das urgentes na ordenacao por prazo.", "client-delta", "project-delta-ops", null, "todo", "high", -4, null]
] as const;

export function seedDatabase(db: AppDatabase) {
  const insertedAt = nowIso();

  const run = db.transaction(() => {
    resetDatabase(db);

    const insertClient = db.prepare("INSERT INTO clients (id, name) VALUES (@id, @name)");
    const insertProject = db.prepare("INSERT INTO projects (id, client_id, name) VALUES (@id, @clientId, @name)");
    const insertAssignee = db.prepare("INSERT INTO assignees (id, name, email) VALUES (@id, @name, @email)");
    const insertDemand = db.prepare(`
      INSERT INTO demands (
        id, title, description, client_id, project_id, assignee_id, status, priority,
        due_date, created_at, updated_at, completed_at
      )
      VALUES (
        @id, @title, @description, @clientId, @projectId, @assigneeId, @status, @priority,
        @dueDate, @createdAt, @updatedAt, @completedAt
      )
    `);
    const insertEvent = db.prepare(`
      INSERT INTO demand_events (id, demand_id, type, message, created_at)
      VALUES (@id, @demandId, @type, @message, @createdAt)
    `);
    const insertComment = db.prepare(`
      INSERT INTO demand_comments (id, demand_id, body, created_at)
      VALUES (@id, @demandId, @body, @createdAt)
    `);

    clients.forEach((client) => insertClient.run(client));
    projects.forEach((project) => insertProject.run(project));
    assignees.forEach((assignee) => insertAssignee.run(assignee));

    demandSeeds.forEach((seed, index) => {
      const [
        id,
        title,
        description,
        clientId,
        projectId,
        assigneeId,
        status,
        priority,
        dueOffset,
        completedOffset
      ] = seed;

      insertDemand.run({
        id,
        title,
        description,
        clientId,
        projectId,
        assigneeId,
        status,
        priority,
        dueDate: dateFromNow(dueOffset),
        createdAt: insertedAt,
        updatedAt: insertedAt,
        completedAt: completedOffset === null ? null : new Date(Date.now() + completedOffset * dayInMs).toISOString()
      });

      insertEvent.run({
        id: `event-${String(index + 1).padStart(3, "0")}`,
        demandId: id,
        type: "status_changed",
        message: `Demanda criada com status ${status}.`,
        createdAt: insertedAt
      });

      if (index % 4 === 0) {
        insertComment.run({
          id: `comment-${String(index + 1).padStart(3, "0")}`,
          demandId: id,
          body: "Comentario inicial criado pelo seed para apoiar a avaliacao.",
          createdAt: insertedAt
        });
      }
    });
  });

  run();
}
