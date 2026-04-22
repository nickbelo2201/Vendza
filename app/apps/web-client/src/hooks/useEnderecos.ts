"use client";

import { useState, useEffect, useCallback } from "react";
import { encryptData, decryptData, looksEncrypted } from "../lib/crypto";

export type Endereco = {
  id: string;
  label: string; // "Casa", "Trabalho", "Outro"
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento?: string;
  criadoEm?: string; // ISO date — usado para ordenação e substituição do mais antigo
};

export type PerfilCliente = {
  nome: string;
  telefone: string;
  email: string;
};

const CHAVE_ENDERECOS = "vendza-enderecos";
const CHAVE_PERFIL = "vendza-perfil";
const MAX_ENDERECOS = 3;

/**
 * Lê dados do localStorage com suporte a criptografia
 * Compatível com dados antigos (JSON puro) — descriptografa se necessário
 */
async function lerDoStorage<T>(chave: string, padrao: T): Promise<T> {
  if (typeof window === "undefined") return padrao;
  try {
    const raw = localStorage.getItem(chave);
    if (!raw) return padrao;

    // Se parece criptografado, descriptografa
    if (looksEncrypted(raw)) {
      try {
        return (await decryptData<T>(raw)) ?? padrao;
      } catch (error) {
        console.error(`Erro ao descriptografar ${chave}, usando fallback:`, error);
        return padrao;
      }
    }

    // Caso contrário, trata como JSON puro (compatibilidade com dados antigos)
    return (JSON.parse(raw) as T) ?? padrao;
  } catch {
    return padrao;
  }
}

/**
 * Salva dados no localStorage com criptografia
 */
async function salvarNoStorage<T>(chave: string, valor: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const encrypted = await encryptData(valor);
    localStorage.setItem(chave, encrypted);
  } catch (error) {
    console.error(`Erro ao criptografar e salvar ${chave}:`, error);
    // Fallback: salvar como JSON puro se criptografia falhar
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // localStorage cheio ou desabilitado — silenciar
    }
  }
}

export function useEnderecos() {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Carrega endereços ao montar o componente
  useEffect(() => {
    let isMounted = true;
    lerDoStorage<Endereco[]>(CHAVE_ENDERECOS, []).then((dados) => {
      if (isMounted) {
        setEnderecos(dados);
        setCarregando(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Salva endereços quando há mudança
  useEffect(() => {
    if (!carregando) {
      salvarNoStorage(CHAVE_ENDERECOS, enderecos);
    }
  }, [enderecos, carregando]);

  const salvar = useCallback((endereco: Omit<Endereco, "id" | "criadoEm">) => {
    setEnderecos((prev) => {
      const novo: Endereco = { ...endereco, id: crypto.randomUUID(), criadoEm: new Date().toISOString() };
      if (prev.length < MAX_ENDERECOS) {
        // Mais recente primeiro
        return [novo, ...prev];
      }
      // Limite atingido — substituir o mais antigo (último da lista)
      const ordenados = [...prev].sort((a, b) =>
        (a.criadoEm ?? "") < (b.criadoEm ?? "") ? -1 : 1
      );
      ordenados[0] = novo; // substitui o mais antigo
      // Mantém mais recente primeiro
      return ordenados.sort((a, b) =>
        (a.criadoEm ?? "") > (b.criadoEm ?? "") ? -1 : 1
      );
    });
  }, []);

  const remover = useCallback((id: string) => {
    setEnderecos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { enderecos, salvar, remover, max: MAX_ENDERECOS };
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<PerfilCliente>({ nome: "", telefone: "", email: "" });
  const [carregando, setCarregando] = useState(true);

  // Carrega perfil ao montar o componente
  useEffect(() => {
    let isMounted = true;
    lerDoStorage<PerfilCliente>(CHAVE_PERFIL, { nome: "", telefone: "", email: "" }).then((dados) => {
      if (isMounted) {
        setPerfil(dados);
        setCarregando(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const salvarPerfil = useCallback((dados: PerfilCliente) => {
    setPerfil(dados);
    salvarNoStorage(CHAVE_PERFIL, dados);
  }, []);

  return { perfil, salvarPerfil, carregando };
}
