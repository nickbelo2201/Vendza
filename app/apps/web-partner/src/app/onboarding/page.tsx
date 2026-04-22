import { redirect } from "next/navigation";

import { ApiError, fetchAPI } from "../../lib/api";

import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  try {
    await fetchAPI("/partner/configuracoes/loja");
    // Se chegou aqui, o usuário já tem loja — redireciona para o dashboard
    redirect("/");
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 403) {
      // Erro inesperado ou 404 — deixa o wizard lidar
    }
  }

  return <OnboardingWizard />;
}
