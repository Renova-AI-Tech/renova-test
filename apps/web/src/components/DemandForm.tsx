import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDemandFormSchema,
  editDemandFormSchema,
  demandPriorities,
  demandStatuses,
  type Assignee,
  type Client,
  type CreateDemandInput,
  type DemandDetail,
  type Project,
} from "@painel-demandas/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

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
  cancelled: "Cancelada",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function DemandForm({
  mode,
  clients,
  projects,
  assignees,
  demand,
}: DemandFormProps) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CreateDemandInput>({
    resolver:
      mode === "create"
        ? zodResolver(createDemandFormSchema)
        : zodResolver(editDemandFormSchema),
    defaultValues: demand
      ? {
          title: demand.title,
          description: demand.description,
          clientId: demand.clientId,
          projectId: demand.projectId,
          assigneeId: demand.assigneeId,
          status: demand.status,
          priority: demand.priority,
          dueDate: demand.dueDate,
        }
      : {
          status: "todo",
          priority: "medium",
        },
  });

  async function onSubmit(values: CreateDemandInput) {
    setSubmitError(null);

    try {
      if (mode === "create") {
        const created = await api.createDemand(values);
        navigate(`/demands/${created.id}`);
      } else if (demand) {
        const changed = Object.keys(dirtyFields) as Array<
          keyof CreateDemandInput
        >;
        const patch = changed.reduce<Partial<CreateDemandInput>>(
          (acc, field) => ({ ...acc, [field]: values[field] }),
          {},
        );

        await api.updateDemand(demand.id, patch);
        navigate(`/demands/${demand.id}`);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Erro ao salvar a demanda.",
      );
    }
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid">
        <label>
          Titulo
          <input {...register("title")} />
          {errors.title ? (
            <span className="field-error">{errors.title.message}</span>
          ) : null}
        </label>

        {mode === "create" ? (
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
        ) : (
          <input type="hidden" {...register("status")} />
        )}

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
          {errors.clientId ? (
            <span className="field-error">{errors.clientId.message}</span>
          ) : null}
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
          {errors.projectId ? (
            <span className="field-error">{errors.projectId.message}</span>
          ) : null}
        </label>

        <label>
          Responsavel
          <select
            {...register("assigneeId", {
              setValueAs: (value) => (value === "" ? null : value),
            })}
          >
            <option value="">Sem responsavel</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
          {errors.assigneeId ? (
            <span className="field-error">{errors.assigneeId.message}</span>
          ) : null}
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
          {errors.dueDate ? (
            <span className="field-error">{errors.dueDate.message}</span>
          ) : null}
        </label>
      </div>

      <label>
        Descricao
        <textarea rows={6} {...register("description")} />
        {errors.description ? (
          <span className="field-error">{errors.description.message}</span>
        ) : null}
      </label>

      {submitError ? <p className="field-error">{submitError}</p> : null}

      <div className="form-actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => window.history.back()}
        >
          Voltar
        </button>
        <button className="button" type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar demanda" : "Salvar alteracoes"}
        </button>
      </div>
    </form>
  );
}
