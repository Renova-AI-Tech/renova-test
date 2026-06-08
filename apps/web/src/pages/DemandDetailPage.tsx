import type { DemandDetail } from "@painel-demandas/shared";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { DemandPriorityBadge } from "../components/DemandPriorityBadge";
import { DemandStatusBadge } from "../components/DemandStatusBadge";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../services/api";

export function DemandDetailPage() {
  const params = useParams();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/demands";
  const [demand, setDemand] = useState<DemandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        </div>
      </section>
    </main>
  );
}
