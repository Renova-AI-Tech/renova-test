import type {
  Assignee,
  Client,
  DemandDetail,
  DemandFilters,
  DemandWithRelations,
  Project
} from "@painel-demandas/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3333";

type RequestOptions = {
  query?: Record<string, string | undefined>;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH";
};

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(`${API_URL}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Erro HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  clients: () => request<Client[]>("/clients"),
  projects: () => request<Project[]>("/projects"),
  assignees: () => request<Assignee[]>("/assignees"),
  demands: (filters: DemandFilters) => request<DemandWithRelations[]>("/demands", { query: filters }),
  demand: (id: string) => request<DemandDetail>(`/demands/${id}`),
  createDemand: (body: unknown) => request<DemandDetail>("/demands", { method: "POST", body }),
  updateDemand: (id: string, body: unknown) => request<DemandDetail>(`/demands/${id}`, { method: "PATCH", body }),
  addComment: (id: string, body: string) =>
    request(`/demands/${id}/comments`, {
      method: "POST",
      body: { body }
    })
};
