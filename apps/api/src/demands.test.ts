import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { seedDatabase } from "./seed-data";
import { buildServer } from "./server";

async function buildSeededTestServer() {
  const db = openDatabase(":memory:");
  seedDatabase(db);
  return buildServer({ db });
}

describe("demand creation", () => {
  it("rejects an invalid create payload", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "POST",
      url: "/demands",
      payload: {
        title: "abc",
        description: "curta",
        priority: "high"
      }
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().issues).toBeDefined();
  });
});

describe("demand status transitions", () => {
  it("blocks reopening a finished demand", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "PATCH",
      url: "/demands/demand-006/status",
      payload: { status: "todo" }
    });

    await app.close();

    expect(response.statusCode).toBe(409);
  });

  it("blocks moving to in_progress without an assignee", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "PATCH",
      url: "/demands/demand-003/status",
      payload: { status: "in_progress" }
    });

    await app.close();

    expect(response.statusCode).toBe(400);
  });

  it("does not change status through the generic update endpoint", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "PATCH",
      url: "/demands/demand-007",
      payload: { status: "in_progress", title: "Titulo atualizado" }
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("cancelled");
    expect(response.json().title).toBe("Titulo atualizado");
  });

  it("blocks clearing the assignee of an in_progress demand", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "PATCH",
      url: "/demands/demand-004",
      payload: { assigneeId: null }
    });

    await app.close();

    expect(response.statusCode).toBe(400);
  });
});
