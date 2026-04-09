"use client";

import { useState, useEffect, useCallback } from "react";

export type Endereco = {
  id: string;
  label: string; // "Casa", "Trabalho", "Outro"
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  complemento?: string;
};

export type PerfilCliente = {
  nome: string;
  telefone: string;
  email: string;
};

const CHAVE_ENDERECOS = "vendza-enderecos";
const CHAVE_PERFIL = "vendza-perfil";
const MAX_ENDERECOS = 3;

function lerDoStorage<T>(chave: string, padrao: T): T {
  if (typeof window === "undefined") return padrao;
  try {
    const raw = localStorage.getItem(chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}

function salvarNoStorage<T>(chave: string, valor: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // localStorage cheio ou desabilitado — silenciar
  }
}

export function useEnderecos() {
  const [enderecos, setEnderecos] = useState<Endereco[]>(() =>
    lerDoStorage<Endereco[]>(CHAVE_ENDERECOS, [])
  );

  useEffect(() => {
    salvarNoStorage(CHAVE_ENDERECOS, enderecos);
  }, [enderecos]);

  const salvar = useCallback((endereco: Omit<Endereco, "id">) => {
    setEnderecos((prev) => {
      if (prev.length >= MAX_ENDERECOS) return prev;
      const novo: Endereco = { ...endereco, id: crypto.randomUUID() };
      return [...prev, novo];
    });
  }, []);

  const remover = useCallback((id: string) => {
    setEnderecos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { enderecos, salvar, remover, max: MAX_ENDERECOS };
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<PerfilCliente>(() =>
    lerDoStorage<PerfilCliente>(CHAVE_PERFIL, { nome: "", telefone: "", email: "" })
  );

  const salvarPerfil = useCallback((dados: PerfilCliente) => {
    setPerfil(dados);
    salvarNoStorage(CHAVE_PERFIL, dados);
  }, []);

  return { perfil, salvarPerfil };
}
