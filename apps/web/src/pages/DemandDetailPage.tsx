import { zodResolver } from "@hookform/resolvers/zod";
import {
  addCommentSchema,
  demandStatuses,
  type DemandDetail,
  type DemandStatus,
} from "@painel-demandas/shared";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "react-router-dom";
import { DemandPriorityBadge } from "../components/DemandPriorityBadge";
import { DemandStatusBadge } from "../components/DemandStatusBadge";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../services/api";

const statusLabels: Record<DemandStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluida",
  cancelled: "Cancelada",
};

function isClosed(status: DemandStatus) {
  return status === "done" || status === "cancelled";
}

export function DemandDetailPage() {
  const params = useParams();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/demands";
  const [demand, setDemand] = useState<DemandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ body: string }>({
    resolver: zodResolver(addCommentSchema),
  });

  const refresh = useCallback(async () => {
    if (!params.id) {
      return;
    }

    const next = await api.demand(params.id);
    setDemand(next);
  }, [params.id]);

  useEffect(() => {
    let active = true;

    async function loadDemand() {
      if (!params.id) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextDemand = await api.demand(params.id);
        if (active) {
          setDemand(nextDemand);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar demanda.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDemand();

    return () => {
      active = false;
    };
  }, [params.id]);

  async function onChangeStatus(status: DemandStatus) {
    if (!demand || status === demand.status) {
      return;
    }

    setStatusError(null);
    setStatusSaving(true);

    try {
      const updated = await api.changeStatus(demand.id, status);
      setDemand(updated);
    } catch (changeError) {
      setStatusError(
        changeError instanceof Error ? changeError.message : "Erro ao alterar status.",
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function onAddComment(values: { body: string }) {
    if (!demand) {
      return;
    }

    await api.addComment(demand.id, values.body);
    reset({ body: "" });
    await refresh();
  }

  if (loading) {
    return (
      <main className="page-shell">
        <LoadingState />
      </main>
    );
  }

  if (error || !demand) {
    return (
      <main className="page-shell">
        <ErrorState message={error ?? "Demanda nao encontrada."} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <Link className="back-link" to={returnTo}>
            Voltar para demandas
          </Link>
          <h1>{demand.title}</h1>
          <p>{demand.description}</p>
        </div>
        <Link className="button" to={`/demands/${demand.id}/edit`}>
          Editar
        </Link>
      </header>

      <section className="detail-grid">
        <div>
          <span className="detail-label">Status</span>
          <DemandStatusBadge status={demand.status} />
        </div>
        <div>
          <span className="detail-label">Prioridade</span>
          <DemandPriorityBadge priority={demand.priority} />
        </div>
        <div>
          <span className="detail-label">Cliente</span>
          <strong>{demand.client?.name ?? "-"}</strong>
        </div>
        <div>
          <span className="detail-label">Projeto</span>
          <strong>{demand.project?.name ?? "-"}</strong>
        </div>
        <div>
          <span className="detail-label">Responsavel</span>
          <strong>{demand.assignee?.name ?? "Sem responsavel"}</strong>
        </div>
        <div>
          <span className="detail-label">Prazo</span>
          <strong className={demand.isOverdue ? "date date--overdue" : "date"}>{demand.dueDate}</strong>
        </div>
      </section>

      <section className="status-control">
        <label>
          Alterar status
          <select
            value={demand.status}
            disabled={statusSaving || isClosed(demand.status)}
            onChange={(event) => onChangeStatus(event.target.value as DemandStatus)}
          >
            {demandStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        {isClosed(demand.status) ? (
          <span className="muted">
            Demandas concluidas ou canceladas nao podem ser reabertas.
          </span>
        ) : null}
        {statusError ? <span className="field-error">{statusError}</span> : null}
      </section>

      <section className="split-section">
        <div>
          <h2>Historico</h2>
          <ul className="timeline">
            {demand.events.map((event) => (
              <li key={event.id}>
                <strong>{event.message}</strong>
                <span>{new Date(event.createdAt).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Comentarios</h2>
          <ul className="comments">
            {demand.comments.map((comment) => (
              <li key={comment.id}>
                <p>{comment.body}</p>
                <span>{new Date(comment.createdAt).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>

          <form className="comment-form" onSubmit={handleSubmit(onAddComment)}>
            <label>
              Novo comentario
              <textarea rows={3} {...register("body")} />
              {errors.body ? (
                <span className="field-error">{errors.body.message}</span>
              ) : null}
            </label>
            <button className="button" type="submit" disabled={isSubmitting}>
              Comentar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
