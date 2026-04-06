import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Server, type Socket } from "socket.io";

import { resolvePartnerContext } from "../modules/partner/context.js";

let ioInstance: Server | null = null;

export function getIO(): Server {
  if (!ioInstance) throw new Error("Socket.io não inicializado.");
  return ioInstance;
}

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

  // Middleware de autenticação — exige Bearer token para conexões Socket.io
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token || typeof token !== "string") {
        return next(new Error("Autenticação obrigatória. Envie token via auth.token ou header Authorization."));
      }

      const { data, error } = await app.supabase.auth.getUser(token);

      if (error || !data.user) {
        return next(new Error("Token inválido ou expirado."));
      }

      const partnerContext = await resolvePartnerContext(data.user.id);

      // Armazenar contexto no socket para uso nos handlers
      (socket as Socket & { partnerStoreId?: string }).partnerStoreId =
        partnerContext?.storeId ?? undefined;

      next();
    } catch {
      next(new Error("Falha na autenticação do socket."));
    }
  });

  io.on("connection", (socket: Socket & { partnerStoreId?: string }) => {
    app.log.info(`[socket.io] cliente conectado: ${socket.id}`);

    socket.on("join:store", (storeId: string) => {
      // Parceiros só podem entrar na sala da própria loja
      if (socket.partnerStoreId && socket.partnerStoreId !== storeId) {
        app.log.warn(
          `[socket.io] tentativa de join:store bloqueada — socket ${socket.id} tentou entrar em store:${storeId} mas pertence a store:${socket.partnerStoreId}`,
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
