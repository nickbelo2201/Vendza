"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { createClient } from "../utils/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export function useNewOrders() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;

    async function conectar() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      socket = io(API_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
      });

      socket.on("order:created", () => setCount((c) => c + 1));
    }

    conectar();

    return () => {
      socket?.disconnect();
    };
  }, []);

  return { count, reset: () => setCount(0) };
}
