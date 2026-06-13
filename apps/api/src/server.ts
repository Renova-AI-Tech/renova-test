import cors from "@fastify/cors";
import Fastify, { type FastifyReply } from "fastify";
import type { AppDatabase } from "./db";
import { openDatabase } from "./db";
import {
  addComment,
  changeDemandStatus,
  createDemand,
  getDemandById,
  listAssignees,
  listClients,
  listDemands,
  listEvents,
  listProjects,
  updateDemand
} from "./repository";

type BuildServerOptions = {
  db?: AppDatabase;
};

function sendRepositoryResult<T>(
  reply: FastifyReply,
  result:
    | { ok: true; data: T }
    | { ok: false; statusCode: number; message: string; issues?: unknown }
) {
  if (!result.ok) {
    return reply.code(result.statusCode).send({
      message: result.message,
      issues: result.issues
    });
  }

  return reply.send(result.data);
}

export async function buildServer(options: BuildServerOptions = {}) {
  const db = options.db ?? openDatabase();
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "HEAD", "POST", "PATCH"]
  });

  app.addHook("onClose", async () => {
    db.close();
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "painel-demandas-api"
  }));

  app.get("/clients", async () => listClients(db));
  app.get("/projects", async () => listProjects(db));
  app.get("/assignees", async () => listAssignees(db));
  app.get("/demands", async (request) => listDemands(db, request.query));

  app.get<{ Params: { id: string } }>("/demands/:id", async (request, reply) => {
    const demand = getDemandById(db, request.params.id);

    if (!demand) {
      return reply.code(404).send({ message: "Demanda nao encontrada." });
    }

    return demand;
  });

  app.post("/demands", async (request, reply) => {
    return sendRepositoryResult(reply, createDemand(db, request.body));
  });

  app.patch<{ Params: { id: string } }>("/demands/:id", async (request, reply) => {
    return sendRepositoryResult(reply, updateDemand(db, request.params.id, request.body));
  });

  app.patch<{ Params: { id: string } }>("/demands/:id/status", async (request, reply) => {
    return sendRepositoryResult(reply, changeDemandStatus(db, request.params.id, request.body));
  });

  app.get<{ Params: { id: string } }>("/demands/:id/events", async (request) => {
    return listEvents(db, request.params.id);
  });

  app.post<{ Params: { id: string } }>("/demands/:id/comments", async (request, reply) => {
    return sendRepositoryResult(reply, addComment(db, request.params.id, request.body as { body: string }));
  });

  return app;
}
