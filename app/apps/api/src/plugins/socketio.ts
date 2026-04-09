import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Server, type Socket } from "socket.io";

import { resolvePartnerContext } from "../modules/partner/context.js";

let ioInstance: Server | null = null;

export function getIO(): Server {
  if (!ioInstance) throw new Error("Socket.io não inicializado.");
  return ioInstance;
}

type AuthenticatedSocket = Socket & { partnerStoreId?: string };

const socketioPlugin: FastifyPluginAsync = async (app) => {
  const io = new Server(app.server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.NEXT_PUBLIC_CLIENT_URL ?? "",
        process.env.NEXT_PUBLIC_PARTNER_URL ?? "",
      ].filter(Boolean),
      credentials: true,
    },
  });

  // Middleware de autenticação — token é opcional.
  // Conexões sem token são permitidas (ex: web-client rastreando pedido por publicId),
  // mas ficam sem partnerStoreId e não podem entrar em salas de loja.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token || typeof token !== "string") {
        // Conexão pública: permitida, sem acesso a salas de loja
        (socket as AuthenticatedSocket).partnerStoreId = undefined;
        return next();
      }

      const { data, error } = await app.supabase.auth.getUser(token);

      if (error || !data.user) {
        // Token inválido: ainda permite conexão, mas sem permissão de loja
        (socket as AuthenticatedSocket).partnerStoreId = undefined;
        return next();
      }

      const partnerContext = await resolvePartnerContext(data.user.id);

      (socket as AuthenticatedSocket).partnerStoreId =
        partnerContext?.storeId ?? undefined;

      next();
    } catch {
      // Falha inesperada: permite conexão sem permissões de loja
      (socket as AuthenticatedSocket).partnerStoreId = undefined;
      next();
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    app.log.info(`[socket.io] cliente conectado: ${socket.id}`);

    // Auto-join na sala da loja se o socket está autenticado como parceiro
    if (socket.partnerStoreId) {
      void socket.join(`store:${socket.partnerStoreId}`);
      app.log.info(`[socket.io] socket ${socket.id} auto-joined store:${socket.partnerStoreId}`);
    }

    socket.on("join:store", (storeId: string) => {
      // Apenas parceiros autenticados podem entrar em salas de loja,
      // e somente na sala da própria loja.
      if (!socket.partnerStoreId) {
        app.log.warn(
          `[socket.io] join:store bloqueado — socket ${socket.id} não autenticado`,
        );
        return;
      }
      if (socket.partnerStoreId !== storeId) {
        app.log.warn(
          `[socket.io] join:store bloqueado — socket ${socket.id} tentou entrar em store:${storeId} mas pertence a store:${socket.partnerStoreId}`,
        );
        return;
      }
      void socket.join(`store:${storeId}`);
    });

    socket.on("join:order", (publicId: string) => {
      // Clientes podem acompanhar pedidos pelo publicId (dado público na URL de tracking)
      if (typeof publicId === "string" && publicId.length > 0 && publicId.length < 100) {
        void socket.join(`order:${publicId}`);
      }
    });

    socket.on("disconnect", () => {
      app.log.info(`[socket.io] cliente desconectado: ${socket.id}`);
    });
  });

  ioInstance = io;

  app.addHook("onClose", async () => {
    await io.close();
  });
};

export const socketPlugin = fp(socketioPlugin, { name: "socketio" });
