# Vendza

Vendza é um Commerce OS para lojistas — canal direto de vendas, painel operacional, CRM nativo e automação por eventos, construídos para o comércio local brasileiro.

O repositório está organizado em dois blocos:

- `app/` — workspace do produto (monorepo). Todo o desenvolvimento acontece aqui.
- `empresa/` — estratégia comercial, pricing, onboarding, materiais de vendas e operação da empresa.

---

## Como começar

1. Entre em `app/`.
2. Leia `app/docs/` — a documentação técnica e estratégica está toda lá, em ordem numerada.
3. Siga o quickstart em `app/README.md` para subir o ambiente local.

---

## Workflow de branches

`main` é o branch de produção. Qualquer push em `main` dispara deploy automático no Railway e na Vercel.

**Regra obrigatória: nunca commitar ou fazer push direto em `main`.**

Todo desenvolvimento segue este fluxo:

```
git checkout -b feat/nome-da-mudanca
# implementa, testa, faz commit
git push origin feat/nome-da-mudanca
# abre PR no GitHub
# merge em main feito exclusivamente pelo fundador
```

A Vercel gera uma preview URL automática para cada branch, o que permite revisar a mudança antes do merge.

---

## Ambientes de produção

| Servico     | URL                                              | Plataforma |
|-------------|--------------------------------------------------|------------|
| API         | https://vendza-production.up.railway.app         | Railway    |
| web-partner | https://web-partner-three.vercel.app             | Vercel     |
