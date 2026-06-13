import {
  demandFiltersSchema,
  type Assignee,
  type Client,
  type DemandFilters,
  type DemandWithRelations,
} from "@painel-demandas/shared";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DemandFilters as DemandFiltersForm } from "../components/DemandFilters";
import { DemandTable } from "../components/DemandTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { api } from "../services/api";

function parseFilters(searchParams: URLSearchParams): DemandFilters {
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = demandFiltersSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function DemandsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [demands, setDemands] = useState<DemandWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [nextDemands, nextClients, nextAssignees] = await Promise.all([
          api.demands(filters),
          api.clients(),
          api.assignees(),
        ]);

        if (active) {
          setDemands(nextDemands);
          setClients(nextClients);
          setAssignees(nextAssignees);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Erro ao carregar demandas.",
          );
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
  }, [filters]);

  function updateFilters(nextFilters: DemandFilters) {
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Painel de Demandas</h1>
          <p>
            Backoffice interno para acompanhar demandas de clientes e projetos.
          </p>
        </div>
        <Link className="button" to="/demands/new">
          Nova demanda
        </Link>
      </header>

      <DemandFiltersForm
        filters={filters}
        clients={clients}
        assignees={assignees}
        onChange={updateFilters}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && demands.length === 0 ? (
        <EmptyState title="Nenhuma demanda encontrada." />
      ) : null}
      {!loading && !error && demands.length > 0 ? (
        <DemandTable demands={demands} />
      ) : null}
    </main>
  );
}
