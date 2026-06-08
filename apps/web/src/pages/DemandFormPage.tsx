import type { Assignee, Client, DemandDetail, Project } from "@painel-demandas/shared";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DemandForm } from "../components/DemandForm";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../services/api";

type DemandFormPageProps = {
  mode: "create" | "edit";
};

export function DemandFormPage({ mode }: DemandFormPageProps) {
  const params = useParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [demand, setDemand] = useState<DemandDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const metadataRequests = [api.clients(), api.projects(), api.assignees()] as const;
        const [nextClients, nextProjects, nextAssignees] = await Promise.all(metadataRequests);
        const nextDemand = mode === "edit" && params.id ? await api.demand(params.id) : undefined;

        if (active) {
          setClients(nextClients);
          setProjects(nextProjects);
          setAssignees(nextAssignees);
          setDemand(nextDemand);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar formulario.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [mode, params.id]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>{mode === "create" ? "Nova demanda" : "Editar demanda"}</h1>
          <p>Formulario base com validacao inicial e integracao de envio pendente.</p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error ? (
        <DemandForm mode={mode} clients={clients} projects={projects} assignees={assignees} demand={demand} />
      ) : null}
    </main>
  );
}
