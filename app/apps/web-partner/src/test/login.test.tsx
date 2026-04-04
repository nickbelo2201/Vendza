import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../app/(auth)/login/page";

// Mock do Supabase client
vi.mock("../utils/supabase/client", () => ({
  createClient: vi.fn(),
}));

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";


describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os campos de email e senha", () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword: mockSignIn },
    } as unknown as ReturnType<typeof createClient>);

    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("mostra erro quando credenciais são inválidas", async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword: mockSignIn },
    } as unknown as ReturnType<typeof createClient>);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "teste@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "senhaerrada" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/email ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  it("redireciona para / após login bem-sucedido", async () => {
    const mockReplace = vi.fn();
    const mockRefresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      refresh: mockRefresh,
    } as unknown as ReturnType<typeof useRouter>);

    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createClient).mockReturnValue({
      auth: { signInWithPassword: mockSignIn },
    } as unknown as ReturnType<typeof createClient>);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "parceiro@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
