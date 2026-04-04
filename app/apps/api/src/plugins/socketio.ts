import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Server, type Socket } from "socket.io";

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

  io.on("connection", (socket: Socket) => {
    app.log.info(`[socket.io] cliente conectado: ${socket.id}`);

    socket.on("join:store", (storeId: string) => {
      void socket.join(`store:${storeId}`);
    });

    socket.on("join:order", (publicId: string) => {
      void socket.join(`order:${publicId}`);
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
