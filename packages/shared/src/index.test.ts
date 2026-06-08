import { describe, expect, it } from "vitest";
import { createDemandSchema, isDemandOverdue } from "./index";

describe("shared demand contracts", () => {
  it("accepts a minimal valid create demand payload", () => {
    const result = createDemandSchema.safeParse({
      title: "Ajustar integracao",
      description: "Corrigir divergencia no envio de dados do cliente.",
      clientId: "client-1",
      projectId: "project-1",
      priority: "high",
      dueDate: "2026-07-01"
    });

    expect(result.success).toBe(true);
  });

  it("ships with the known overdue bug for the candidate to fix", () => {
    const result = isDemandOverdue({
      dueDate: "2020-01-01",
      status: "done"
    });

    expect(result).toBe(true);
  });
});
