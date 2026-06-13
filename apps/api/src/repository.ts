import {
  addCommentSchema,
  createDemandFormSchema,
  demandFiltersSchema,
  isDemandOverdue,
  statusChangeSchema,
  updateDemandSchema,
  type Assignee,
  type Client,
  type Demand,
  type DemandComment,
  type DemandDetail,
  type DemandEvent,
  type DemandFilters,
  type DemandWithRelations,
  type Project,
} from "@painel-demandas/shared";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "./db";

type DemandRow = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  projectId: string;
  assigneeId: string | null;
  status: Demand["status"];
  priority: Demand["priority"];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

type JoinedDemandRow = DemandRow & {
  clientName: string | null;
  projectName: string | null;
  projectClientId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

type EventRow = {
  id: string;
  demandId: string;
  type: DemandEvent["type"];
  message: string;
  createdAt: string;
};

type CommentRow = {
  id: string;
  demandId: string;
  body: string;
  createdAt: string;
};

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; statusCode: number; message: string; issues?: unknown };

export type AddCommentInput = {
  body: string;
};

function mapDemand(row: DemandRow): Demand {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    clientId: row.clientId,
    projectId: row.projectId,
    assigneeId: row.assigneeId,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}

function mapDemandWithRelations(row: JoinedDemandRow): DemandWithRelations {
  const demand = mapDemand(row);

  return {
    ...demand,
    isOverdue: isDemandOverdue(demand),
    client: row.clientName ? { id: row.clientId, name: row.clientName } : null,
    project:
      row.projectName && row.projectClientId
        ? {
            id: row.projectId,
            clientId: row.projectClientId,
            name: row.projectName,
          }
        : null,
    assignee:
      row.assigneeId && row.assigneeName && row.assigneeEmail
        ? {
            id: row.assigneeId,
            name: row.assigneeName,
            email: row.assigneeEmail,
          }
        : null,
  };
}

function normalizePatchPayload(input: unknown) {
  if (!input || typeof input !== "object") {
    return input;
  }

  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
}

function insertEvent(
  db: AppDatabase,
  demandId: string,
  type: DemandEvent["type"],
  message: string,
) {
  const createdAt = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO demand_events (id, demand_id, type, message, created_at)
    VALUES (@id, @demandId, @type, @message, @createdAt)
  `,
  ).run({
    id: randomUUID(),
    demandId,
    type,
    message,
    createdAt,
  });
}

const baseDemandSelect = `
  SELECT
    d.id,
    d.title,
    d.description,
    d.client_id AS clientId,
    d.project_id AS projectId,
    d.assignee_id AS assigneeId,
    d.status,
    d.priority,
    d.due_date AS dueDate,
    d.created_at AS createdAt,
    d.updated_at AS updatedAt,
    d.completed_at AS completedAt,
    c.name AS clientName,
    p.name AS projectName,
    p.client_id AS projectClientId,
    a.name AS assigneeName,
    a.email AS assigneeEmail
  FROM demands d
  LEFT JOIN clients c ON c.id = d.client_id
  LEFT JOIN projects p ON p.id = d.project_id
  LEFT JOIN assignees a ON a.id = d.assignee_id
`;

export function listClients(db: AppDatabase) {
  return db
    .prepare("SELECT id, name FROM clients ORDER BY name")
    .all() as Client[];
}

export function listProjects(db: AppDatabase) {
  return db
    .prepare(
      "SELECT id, client_id AS clientId, name FROM projects ORDER BY name",
    )
    .all() as Project[];
}

export function listAssignees(db: AppDatabase) {
  return db
    .prepare("SELECT id, name, email FROM assignees ORDER BY name")
    .all() as Assignee[];
}

export function listDemands(db: AppDatabase, query: unknown) {
  const parsed = demandFiltersSchema.safeParse(query);
  const filters: DemandFilters = parsed.success ? parsed.data : {};
  const where: string[] = [];
  const params: Record<string, string> = {};

  if (filters.status) {
    where.push("d.status = @status");
    params.status = filters.status;
  }

  if (filters.priority) {
    where.push("d.priority = @priority");
    params.priority = filters.priority;
  }

  if (filters.clientId) {
    where.push("d.client_id = @clientId");
    params.clientId = filters.clientId;
  }

  if (filters.assigneeId) {
    where.push("d.assignee_id = @assigneeId");
    params.assigneeId = filters.assigneeId;
  }

  if (filters.search) {
    where.push(
      "(LOWER(d.title) LIKE @search OR LOWER(d.description) LIKE @search)",
    );
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  const sql = `
    ${baseDemandSelect}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE d.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      d.due_date ASC
  `;

  const demands = (db.prepare(sql).all(params) as JoinedDemandRow[]).map(
    mapDemandWithRelations,
  );

  if (filters.overdue) {
    const overdue = filters.overdue === "true";
    return demands.filter((demand) => demand.isOverdue === overdue);
  }

  return demands;
}

export function getDemandById(
  db: AppDatabase,
  id: string,
): DemandDetail | null {
  const row = db.prepare(`${baseDemandSelect} WHERE d.id = @id`).get({ id }) as
    | JoinedDemandRow
    | undefined;

  if (!row) {
    return null;
  }

  return {
    ...mapDemandWithRelations(row),
    events: listEvents(db, id),
    comments: listComments(db, id),
  };
}

export function createDemand(
  db: AppDatabase,
  payload: unknown,
): RepositoryResult<DemandDetail> {
  const parsed = createDemandFormSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 400,
      message: "Payload invalido.",
      issues: parsed.error.flatten(),
    };
  }

  const input = parsed.data;

  const now = new Date().toISOString();
  const demand = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    clientId: input.clientId,
    projectId: input.projectId,
    assigneeId: input.assigneeId ?? null,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
    completedAt: input.status === "done" ? now : null,
  };

  db.prepare(
    `
    INSERT INTO demands (
      id, title, description, client_id, project_id, assignee_id, status, priority,
      due_date, created_at, updated_at, completed_at
    )
    VALUES (
      @id, @title, @description, @clientId, @projectId, @assigneeId, @status, @priority,
      @dueDate, @createdAt, @updatedAt, @completedAt
    )
  `,
  ).run(demand);

  insertEvent(
    db,
    demand.id,
    "status_changed",
    `Demanda criada com status ${demand.status}.`,
  );
  return { ok: true, data: getDemandById(db, demand.id) as DemandDetail };
}

export function updateDemand(
  db: AppDatabase,
  id: string,
  payload: unknown,
): RepositoryResult<DemandDetail> {
  const existing = getDemandById(db, id);

  if (!existing) {
    return { ok: false, statusCode: 404, message: "Demanda nao encontrada." };
  }

  const parsed = updateDemandSchema.safeParse(normalizePatchPayload(payload));

  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 400,
      message: "Payload invalido.",
      issues: parsed.error.flatten(),
    };
  }

  const fields = parsed.data;
  const updates: string[] = [];
  const params: Record<string, string | null> = { id };

  const columnMap = {
    title: "title",
    description: "description",
    clientId: "client_id",
    projectId: "project_id",
    assigneeId: "assignee_id",
    priority: "priority",
    dueDate: "due_date",
  } as const;

  for (const [field, column] of Object.entries(columnMap)) {
    const value = fields[field as keyof typeof fields];
    if (value !== undefined) {
      updates.push(`${column} = @${field}`);
      params[field] = value;
    }
  }

  if (!updates.length) {
    return { ok: true, data: existing };
  }

  params.updatedAt = new Date().toISOString();
  updates.push("updated_at = @updatedAt");

  db.prepare(`UPDATE demands SET ${updates.join(", ")} WHERE id = @id`).run(
    params,
  );
  return { ok: true, data: getDemandById(db, id) as DemandDetail };
}

export function changeDemandStatus(
  db: AppDatabase,
  id: string,
  payload: unknown,
): RepositoryResult<DemandDetail> {
  const existing = getDemandById(db, id);

  if (!existing) {
    return { ok: false, statusCode: 404, message: "Demanda nao encontrada." };
  }

  const parsed = statusChangeSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 400,
      message: "Payload invalido.",
      issues: parsed.error.flatten(),
    };
  }

  const status = parsed.data.status;

  if (existing.status === "done" || existing.status === "cancelled") {
    return {
      ok: false,
      statusCode: 409,
      message: "Demandas concluidas ou canceladas nao podem ser reabertas.",
    };
  }

  if (
    (status === "in_progress" || status === "done") &&
    !existing.assigneeId
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "Demandas em andamento ou concluidas precisam de responsavel.",
    };
  }

  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE demands
    SET status = @status,
        updated_at = @updatedAt,
        completed_at = @completedAt
    WHERE id = @id
  `,
  ).run({
    id,
    status,
    updatedAt: now,
    completedAt: status === "done" ? now : existing.completedAt,
  });

  insertEvent(
    db,
    id,
    "status_changed",
    `Status alterado de ${existing.status} para ${status}.`,
  );
  return { ok: true, data: getDemandById(db, id) as DemandDetail };
}

export function listEvents(db: AppDatabase, demandId: string) {
  return db
    .prepare(
      `
      SELECT id, demand_id AS demandId, type, message, created_at AS createdAt
      FROM demand_events
      WHERE demand_id = @demandId
      ORDER BY created_at DESC
    `,
    )
    .all({ demandId }) as EventRow[];
}

export function listComments(db: AppDatabase, demandId: string) {
  return db
    .prepare(
      `
      SELECT id, demand_id AS demandId, body, created_at AS createdAt
      FROM demand_comments
      WHERE demand_id = @demandId
      ORDER BY created_at DESC
    `,
    )
    .all({ demandId }) as CommentRow[];
}

export function addComment(
  db: AppDatabase,
  demandId: string,
  payload: AddCommentInput,
): RepositoryResult<DemandComment> {
  const existing = getDemandById(db, demandId);

  if (!existing) {
    return { ok: false, statusCode: 404, message: "Demanda nao encontrada." };
  }

  const parsed = addCommentSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 400,
      message: "Payload invalido.",
      issues: parsed.error.flatten(),
    };
  }

  const comment = {
    id: randomUUID(),
    demandId,
    body: parsed.data.body,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `
    INSERT INTO demand_comments (id, demand_id, body, created_at)
    VALUES (@id, @demandId, @body, @createdAt)
  `,
  ).run(comment);

  insertEvent(db, demandId, "comment_added", "Comentario adicionado.");
  return { ok: true, data: comment };
}
