import type { DemandPriority } from "@painel-demandas/shared";

const labels: Record<DemandPriority, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente"
};

export function DemandPriorityBadge({ priority }: { priority: DemandPriority }) {
  return <span className={`badge badge--priority badge--${priority}`}>{labels[priority]}</span>;
}
