import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDemandSchema,
  demandPriorities,
  demandStatuses,
  type Assignee,
  type Client,
  type CreateDemandInput,
  type DemandDetail,
  type Project
} from "@painel-demandas/shared";
import { useForm } from "react-hook-form";

type DemandFormProps = {
  mode: "create" | "edit";
  clients: Client[];
  projects: Project[];
  assignees: Assignee[];
  demand?: DemandDetail;
};

const statusLabels = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluida",
  cancelled: "Cancelada"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente"
};

export function DemandForm({ mode, clients, projects, assignees, demand }: DemandFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateDemandInput>({
    resolver: zodResolver(createDemandSchema),
    defaultValues: demand
      ? {
          title: demand.title,
          description: demand.description,
          clientId: demand.clientId,
          projectId: demand.projectId,
          assigneeId: demand.assigneeId,
          status: demand.status,
          priority: demand.priority,
          dueDate: demand.dueDate
        }
      : {
          status: "todo",
          priority: "medium"
        }
  });

  function onSubmit(values: CreateDemandInput) {
    // TODO(candidate): connect create/edit submission to the API and preserve
    // untouched fields during edit.
    console.info("DemandForm submitted but not wired yet", mode, values);
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid">
        <label>
          Titulo
          <input {...register("title")} />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
        </label>

        <label>
          Status
          <select {...register("status")}>
            {demandStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cliente
          <select {...register("clientId")}>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId ? <span className="field-error">{errors.clientId.message}</span> : null}
        </label>

        <label>
          Projeto
          <select {...register("projectId")}>
            <option value="">Selecione</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.projectId ? <span className="field-error">{errors.projectId.message}</span> : null}
        </label>

        <label>
          Responsavel
          <select {...register("assigneeId")}>
            <option value="">Sem responsavel</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Prioridade
          <select {...register("priority")}>
            {demandPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Prazo
          <input type="date" {...register("dueDate")} />
          {errors.dueDate ? <span className="field-error">{errors.dueDate.message}</span> : null}
        </label>
      </div>

      <label>
        Descricao
        <textarea rows={6} {...register("description")} />
        {errors.description ? <span className="field-error">{errors.description.message}</span> : null}
      </label>

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={() => window.history.back()}>
          Voltar
        </button>
        <button className="button" type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar demanda" : "Salvar alteracoes"}
        </button>
      </div>
    </form>
  );
}
