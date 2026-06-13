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

  it("marca como atrasada quando vencida e ainda aberta", () => {
    const result = isDemandOverdue({
      dueDate: "2020-01-01",
      status: "todo"
    });

    expect(result).toBe(true);
  });

  it("nao marca como atrasada quando concluida ou cancelada, mesmo vencida", () => {
    expect(isDemandOverdue({ dueDate: "2020-01-01", status: "done" })).toBe(
      false
    );
    expect(
      isDemandOverdue({ dueDate: "2020-01-01", status: "cancelled" })
    ).toBe(false);
  });

  it("nao marca como atrasada quando o prazo ainda nao chegou", () => {
    const result = isDemandOverdue(
      { dueDate: "2026-01-02", status: "todo" },
      new Date("2026-01-01T12:00:00.000Z")
    );

    expect(result).toBe(false);
  });
});
