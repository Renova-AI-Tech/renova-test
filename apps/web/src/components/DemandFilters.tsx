import {
  demandPriorities,
  demandStatuses,
  type Assignee,
  type Client,
  type DemandFilters as DemandFiltersValue,
} from "@painel-demandas/shared";

type DemandFiltersProps = {
  filters: DemandFiltersValue;
  clients: Client[];
  assignees: Assignee[];
  onChange: (filters: DemandFiltersValue) => void;
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

export function DemandFilters({
  filters,
  clients,
  assignees,
  onChange,
}: DemandFiltersProps) {
  function update(key: keyof DemandFiltersValue, value: string) {
    const next = {
      ...filters,
      [key]: value || undefined,
    };

    onChange(next);
  }

  return (
    <form className="filters" onSubmit={(event) => event.preventDefault()}>
      <label>
        Busca
        <input
          value={filters.search ?? ""}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Titulo ou descricao"
        />
      </label>

      <label>
        Status
        <select
          value={filters.status ?? ""}
          onChange={(event) => update("status", event.target.value)}
        >
          <option value="">Todos</option>
          {demandStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Prioridade
        <select
          value={filters.priority ?? ""}
          onChange={(event) => update("priority", event.target.value)}
        >
          <option value="">Todas</option>
          {demandPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Cliente
        <select
          value={filters.clientId ?? ""}
          onChange={(event) => update("clientId", event.target.value)}
        >
          <option value="">Todos</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Responsavel
        <select
          value={filters.assigneeId ?? ""}
          onChange={(event) => update("assigneeId", event.target.value)}
        >
          <option value="">Todos</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Atraso
        <select
          value={filters.overdue ?? ""}
          onChange={(event) => update("overdue", event.target.value)}
        >
          <option value="">Todos</option>
          <option value="true">Atrasadas</option>
          <option value="false">No prazo</option>
        </select>
      </label>
    </form>
  );
}
