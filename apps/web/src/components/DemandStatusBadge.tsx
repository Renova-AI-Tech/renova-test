import type { DemandStatus } from "@painel-demandas/shared";

const labels: Record<DemandStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluida",
  cancelled: "Cancelada"
};

export function DemandStatusBadge({ status }: { status: DemandStatus }) {
  return <span className={`badge badge--status badge--${status}`}>{labels[status]}</span>;
}
