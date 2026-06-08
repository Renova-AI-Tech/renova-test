import type { DemandWithRelations } from "@painel-demandas/shared";
import { Link, useLocation } from "react-router-dom";
import { DemandPriorityBadge } from "./DemandPriorityBadge";
import { DemandStatusBadge } from "./DemandStatusBadge";

type DemandTableProps = {
  demands: DemandWithRelations[];
};

export function DemandTable({ demands }: DemandTableProps) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div className="table-shell">
      <table className="demand-table">
        <thead>
          <tr>
            <th>Demanda</th>
            <th>Cliente</th>
            <th>Projeto</th>
            <th>Responsavel</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          {demands.map((demand) => (
            <tr key={demand.id}>
              <td>
                <Link className="table-link" to={`/demands/${demand.id}`} state={{ returnTo }}>
                  {demand.title}
                </Link>
                <div className="muted">{demand.description}</div>
              </td>
              <td>{demand.client?.name ?? "-"}</td>
              <td>{demand.project?.name ?? "-"}</td>
              <td>{demand.assignee?.name ?? "Sem responsavel"}</td>
              <td>
                <DemandStatusBadge status={demand.status} />
              </td>
              <td>
                <DemandPriorityBadge priority={demand.priority} />
              </td>
              <td>
                <span className={demand.isOverdue ? "date date--overdue" : "date"}>{demand.dueDate}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
