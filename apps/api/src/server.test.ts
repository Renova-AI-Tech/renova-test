import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { seedDatabase } from "./seed-data";
import { buildServer } from "./server";

async function buildSeededTestServer() {
  const db = openDatabase(":memory:");
  seedDatabase(db);
  return buildServer({ db });
}

describe("api routes", () => {
  it("responds to health checks", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "painel-demandas-api"
    });
  });

  it("lists seeded demands with relation data", async () => {
    const app = await buildSeededTestServer();

    const response = await app.inject({
      method: "GET",
      url: "/demands"
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "demand-001",
          client: expect.objectContaining({ name: "Aurora Alimentos" }),
          project: expect.objectContaining({ name: "CRM Comercial" })
        })
      ])
    );
  });
});
