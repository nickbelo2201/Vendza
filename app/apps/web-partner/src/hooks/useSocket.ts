"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export function useSocket(storeId: string | null, onOrderCreated: (data: unknown) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:store", storeId);
    });

    socket.on("order:created", onOrderCreated);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId, onOrderCreated]);

  return socketRef;
}
