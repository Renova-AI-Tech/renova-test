import { z } from "zod";

export const demandStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;

export const demandPriorities = ["low", "medium", "high", "urgent"] as const;

export const demandEventTypes = [
  "status_changed",
  "priority_changed",
  "assignee_changed",
  "due_date_changed",
  "comment_added",
] as const;

export const demandStatusSchema = z.enum(demandStatuses);
export const demandPrioritySchema = z.enum(demandPriorities);
export const demandEventTypeSchema = z.enum(demandEventTypes);

export type DemandStatus = z.infer<typeof demandStatusSchema>;
export type DemandPriority = z.infer<typeof demandPrioritySchema>;
export type DemandEventType = z.infer<typeof demandEventTypeSchema>;

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const projectSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
});

export const assigneeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const demandSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  clientId: z.string(),
  projectId: z.string(),
  assigneeId: z.string().nullable(),
  status: demandStatusSchema,
  priority: demandPrioritySchema,
  dueDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

export const demandEventSchema = z.object({
  id: z.string(),
  demandId: z.string(),
  type: demandEventTypeSchema,
  message: z.string(),
  createdAt: z.string(),
});

export const demandCommentSchema = z.object({
  id: z.string(),
  demandId: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

export const createDemandSchema = z.object({
  title: z.string().trim().min(5),
  description: z.string().trim().min(20),
  clientId: z.string().min(1),
  projectId: z.string().min(1),
  assigneeId: z.string().min(1).nullable().optional(),
  status: demandStatusSchema.default("todo"),
  priority: demandPrioritySchema,
  dueDate: z.string().min(1),
});

export const updateDemandSchema = createDemandSchema.partial().extend({
  assigneeId: z.string().min(1).nullable().optional(),
});

export const statusChangeSchema = z.object({
  status: demandStatusSchema,
});

export const addCommentSchema = z.object({
  body: z.string().trim().min(3),
});

export const demandFiltersSchema = z.object({
  status: demandStatusSchema.optional(),
  priority: demandPrioritySchema.optional(),
  clientId: z.string().optional(),
  assigneeId: z.string().optional(),
  overdue: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),
});

export type Client = z.infer<typeof clientSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Assignee = z.infer<typeof assigneeSchema>;
export type Demand = z.infer<typeof demandSchema>;
export type DemandEvent = z.infer<typeof demandEventSchema>;
export type DemandComment = z.infer<typeof demandCommentSchema>;
export type CreateDemandInput = z.infer<typeof createDemandSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>;
export type DemandFilters = z.infer<typeof demandFiltersSchema>;

export type DemandWithRelations = Demand & {
  client: Client | null;
  project: Project | null;
  assignee: Assignee | null;
  isOverdue: boolean;
};

export type DemandDetail = DemandWithRelations & {
  events: DemandEvent[];
  comments: DemandComment[];
};

export function isDemandOverdue(
  demand: Pick<Demand, "dueDate" | "status">,
  now = new Date(),
) {
  if (demand.status === "done" || demand.status === "cancelled") {
    return false;
  }

  const due = new Date(`${demand.dueDate}T23:59:59.999`);

  return due.getTime() < now.getTime();
}
