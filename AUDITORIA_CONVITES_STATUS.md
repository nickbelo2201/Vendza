# Status Consolidado — Auditoria de Segurança de Convites (SOF-69)

**Data:** 21 de Abril de 2026  
**Relatório de:** Auditoria de Segurança de Convites de Usuário  
**Repositório:** Vendza (INF_Adega)  
**Status Geral:** ✅ IMPLEMENTADO COM RESSALVAS

---

## Resumo Executivo

O sistema de convite de usuários foi implementado com funcionalidades de convite por email via Supabase Auth e aceitação de convites. A implementação foi auditada em profundidade no relatório `security_report.md` (2026-04-21) e revelou **3 achados críticos** e **6 achados médios** que requerem mitigação.

**Estado atual:** 
- **Funcionalidade:** ✅ Operacional (commits 716da0d, 9b79549, aad2cfb)
- **Segurança:** ⚠️ Existem vulnerabilidades identificadas
- **Prioridade:** 🔴 P1 — Corrigir ANTES de produção

---

## Arquivos de Auditoria

| Arquivo | Conteúdo |
|---------|----------|
| `app/docs/file_temporary/security_report.md` | Auditoria completa com 3 achados críticos + 6 médios |
| `Relatory.md` | Relatório geral de validação (92/100 confiança) |
| `testes-implement.md` | Inventário técnico das rotas e implementações |

---

## Achados Críticos (PRECISA CORRIGIR ANTES DE PRODUCAO)

### 🔴 C-01: Token de convite exposto em query string (ALTO)

**Arquivo:** `apps/api/src/modules/onboarding/routes.ts` (linha 131-132)  
**Severidade:** ALTO  
**Status:** ❌ NÃO CORRIGIDO

**Descrição:**  
O endpoint `POST /onboarding/aceitar-convite` recebe o token via query string (`?token=...`). Tokens em query strings são:
- Registrados em logs do servidor
- Armazenados no histórico do navegador
- Retransmitidos em referrer headers
- Visíveis em proxies intermediários

**Código atual (vulnerável):**
```typescript
app.post<{ Querystring: AceitarConviteQuery }>(
  "/onboarding/aceitar-convite",
  {
    schema: {
      querystring: AceitarConviteQuerySchema,  // ← Token em query string
      response: { 200: envelopeSchema(Type.Any()) },
    },
  },
  async (request, reply) => {
    const { token } = request.query;  // ← Extraído de query
    const resultado = await aceitarConviteUsuario(token, app.supabaseAdmin, app.log);
    // ...
  }
);
```

**Correção necessária:**  
Mover o token para o body da requisição POST:
```typescript
const AceitarConviteBodySchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});

app.post<{ Body: AceitarConviteBodySchema }>(
  "/onboarding/aceitar-convite",
  {
    schema: {
      body: AceitarConviteBodySchema,  // ← Token no body
      response: { 200: envelopeSchema(Type.Any()) },
    },
  },
  async (request, reply) => {
    const { token } = request.body;  // ← Extraído do body
    const resultado = await aceitarConviteUsuario(token, app.supabaseAdmin, app.log);
    // ...
  }
);
```

**Impacto:** Vazamento de token em logs, histórico de navegador e referrer headers.  
**Prazo:** Imediato (ANTES de enviar para produção).

---

### 🔴 C-02: StoreUser criado MESMO quando Supabase falha (ALTO)

**Arquivo:** `apps/api/src/modules/partner/configuracoes-service.ts` (linhas 246-299)  
**Severidade:** ALTO  
**Status:** ⚠️ PARCIALMENTE CORRIGIDO

**Descrição:**  
Quando o Supabase retorna erro ao enviar o convite (ex: rate limit, timeout), o sistema **continua criando o StoreUser** com `authUserId: null`. Isso resulta em:
- Registros órfãos (StoreUser sem authUserId)
- Usuários criados que nunca receberam email
- Confusão sobre qual usuário foi realmente invitado
- Gestão manual necessária para limpeza

**Código atual:**
```typescript
// Supabase falha aqui
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
  redirectTo: `${process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3001"}/onboarding/aceitar-convite`,
});

if (error) {
  supbaseInviteError = error.message;  // ← Log do erro
  appLog.warn({ email: emailNormalizado, error: error.message }, "Erro ao enviar convite");
  // ⚠️ MAS CONTINUA CRIANDO STOREUSER ABAIXO
}

// ⚠️ Isso é executado MESMO se Supabase falhou acima
const storeUser = await prisma.storeUser.upsert({
  create: {
    storeId: context.storeId,
    email: emailNormalizado,
    isActive: true,
    authUserId: null,  // ← Órfão
  },
  // ...
});
```

**Correção necessária:**  
Falhar a requisição se Supabase não conseguir enviar o email:
```typescript
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
  redirectTo: `${process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3001"}/onboarding/aceitar-convite`,
});

if (error) {
  appLog.error({ email: emailNormalizado, error: error.message }, "Falha ao enviar convite");
  throw new Error(`Falha ao enviar convite: ${error.message}`);  // ← Falhar aqui
}

// Só criar StoreUser se Supabase retornar sucesso
const storeUser = await prisma.storeUser.upsert({
  create: {
    storeId: context.storeId,
    email: emailNormalizado,
    isActive: true,
    authUserId: data.user?.id || null,  // ← Usar ID do Supabase se disponível
  },
  // ...
});
```

**Impacto:** Registros órfãos de usuários que nunca receberam convite.  
**Prazo:** Próximo sprint (ANTES de produção).

---

### 🔴 C-03: Busca de StoreUser no aceitar-convite sem filtro de storeId (ALTO)

**Arquivo:** `apps/api/src/modules/partner/configuracoes-service.ts` (linhas 348-349)  
**Severidade:** ALTO (Isolamento de tenant)  
**Status:** ❌ NÃO CORRIGIDO

**Descrição:**  
Quando o usuário aceita um convite, o código busca o StoreUser apenas pelo email, **sem filtrar por storeId**:

```typescript
// Linhas 348-349
const storeUser = await prisma.storeUser.findFirst({
  where: { email: userEmail },  // ← SEM storeId
  select: { id: true, storeId: true, email: true },
});
```

**Cenário de ataque:**  
Se o mesmo email foi convidado por **múltiplas lojas** (ex: alice@example.com convidada pela loja A e loja B):
1. Alice aceita o convite da loja B (com token da loja B)
2. `findFirst` retorna o primeiro registro (indefinido qual — pode ser da loja A)
3. Alice ativa a conta da loja A acidentalmente

Viola o princípio de isolamento de tenant.

**Correção necessária:**  
Passar storeId via metadados do Supabase e filtrar na busca:

```typescript
// Ao convidar:
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
  redirectTo: `${process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3001"}/onboarding/aceitar-convite`,
  data: { storeId: context.storeId },  // ← Adicionar metadados com storeId
});

// Ao aceitar:
const authUserId = data.user.id;
const userEmail = data.user.email;
const storeId = data.user.user_metadata?.storeId;  // ← Extrair storeId dos metadados

if (!storeId) {
  throw new Error("StoreId não encontrado no token do convite");
}

const storeUser = await prisma.storeUser.findFirst({
  where: { 
    email: userEmail,
    storeId,  // ← Adicionar filtro de storeId
  },
  select: { id: true, storeId: true, email: true },
});
```

**Impacto:** Cross-tenant data leakage — usuário ativa conta de loja errada.  
**Prazo:** Imediato (ANTES de produção — violação de isolamento de tenant).

---

## Achados Médios

### 🟠 M-01: Sem controle de role para convidar (MÉDIO)

**Arquivo:** `apps/api/src/modules/partner/routes.ts` (linhas 941-959)  
**Status:** ❌ NÃO CORRIGIDO

**Descrição:**  
Qualquer usuário autenticado (`owner`, `manager`, ou `operator`) pode convidar novos usuários. Um operador poderia convidar usuários com role `manager`, escalando privilégios indiretamente.

**Correção sugerida:**  
Apenas `owner` e `manager` podem convidar. Manager não pode convidar owner.

```typescript
// Adicionar validação na rota
if (!['owner', 'manager'].includes(request.partnerContext.role)) {
  return reply.status(403).send({
    data: null,
    error: { code: 'FORBIDDEN', message: 'Apenas proprietários e gerentes podem convidar usuários' }
  });
}

// Manager não pode convidar owner
if (request.partnerContext.role === 'manager' && input.role === 'owner') {
  return reply.status(403).send({
    data: null,
    error: { code: 'FORBIDDEN', message: 'Gerentes não podem convidar proprietários' }
  });
}
```

**Prazo:** Próximo sprint (média prioridade).

---

### 🟠 M-02: Sem controle de role para revogar (MÉDIO)

**Arquivo:** `apps/api/src/modules/partner/configuracoes-service.ts` (linhas 391-412)  
**Status:** ❌ NÃO CORRIGIDO

**Descrição:**  
A função `revogarUsuario` apenas impede auto-revogação, mas não verifica hierarquia de roles. Um `operator` poderia revogar um `manager` ou `owner`.

**Correção necessária:**  
Implementar hierarquia: owner > manager > operator. Não permitir revogar igual ou superior.

```typescript
const ROLE_HIERARCHY = { owner: 3, manager: 2, operator: 1 };

if (ROLE_HIERARCHY[callerRole] <= ROLE_HIERARCHY[targetRole]) {
  throw new Error(`Não pode revogar usuário com role igual ou superior`);
}
```

**Prazo:** Próximo sprint (média prioridade).

---

### 🟠 M-03: Sem rate limiting específico para endpoints sensíveis (MÉDIO)

**Arquivo:** `apps/api/src/app.ts` (linhas 38-51)  
**Status:** ❌ NÃO CORRIGIDO

**Descrição:**  
Rate limiting global de 200 req/min é excessivamente permissivo para:
- `/partner/configuracoes/usuarios/convidar` — spam de convites por email
- `/onboarding/aceitar-convite` — brute force de tokens

**Correção sugerida:**
- `/partner/configuracoes/usuarios/convidar`: max 10/min por storeId
- `/onboarding/aceitar-convite`: max 5/min por IP

**Prazo:** Próximo sprint (média prioridade).

---

### 🟠 M-04: Frontend chama rota inexistente (MÉDIO)

**Arquivo:** `apps/web-partner/src/app/(auth)/aceitar-convite/page.tsx` (linha 107)  
**Status:** ⚠️ VERIFICAR

**Descrição:**  
Frontend pode estar chamando rota incorreta para `/partner/aceitar-convite` em vez da rota real `POST /v1/onboarding/aceitar-convite`.

**Prazo:** Próximo sprint (média prioridade).

---

### 🟡 M-05: Inconsistência de role entre schema e service (BAIXO-MÉDIO)

**Status:** ⚠️ VERIFICAR

**Descrição:**  
Schema TypeBox da rota aceita apenas `manager` e `operator`, mas o service aceita também `owner`. Falta documentação clara.

---

### 🟡 M-06: Resposta expõe mensagem interna do Supabase (BAIXO)

**Arquivo:** `apps/api/src/modules/partner/configuracoes-service.ts` (linha 314)  
**Status:** ⚠️ VERIFICAR

**Descrição:**  
Campo `emailSendError` na resposta pode conter informações internas do Supabase. Sanitizar para mensagem genérica.

```typescript
// Atual (expõe erro)
...(supbaseInviteError ? { emailSendError: supbaseInviteError } : {}),

// Sugerido (genérico)
...(supbaseInviteError ? { emailSendError: 'Erro ao enviar email de convite. Tente novamente.' } : {}),
```

---

## Achados Positivos ✅

| # | Controle | Status |
|---|----------|--------|
| P-01 | storeId vem de partnerContext, NUNCA do body | ✅ OK |
| P-02 | Validação de email via TypeBox format:"email" | ✅ OK |
| P-03 | Unique constraint `@@unique([storeId, email])` no banco | ✅ OK |
| P-04 | Verificação de duplicata no service antes do upsert | ✅ OK |
| P-05 | Normalização de email com toLowerCase().trim() | ✅ OK |
| P-06 | Token delegado ao Supabase (inviteUserByEmail + verifyOtp) | ✅ OK |
| P-07 | Endpoint aceitar-convite é público (correto para o fluxo) | ✅ OK |
| P-08 | Logs de auditoria básicos com truncamento de token | ✅ OK |
| P-09 | CORS com allowlist de origins | ✅ OK |
| P-10 | Helmet habilitado para security headers | ✅ OK |

---

## Checklist de Correção

| Prioridade | Controle | Status | Valor |
|-----------|----------|--------|-------|
| **P1** | C-01: Token em body (não query) | ❌ | CRÍTICO — Logs/referrer |
| **P1** | C-02: Falhar se Supabase falha | ❌ | CRÍTICO — Órfãos |
| **P1** | C-03: Filtro de storeId ao aceitar | ❌ | CRÍTICO — Cross-tenant |
| **P1** | M-04: Frontend rota correta | ⚠️ | CRÍTICO — Funcionalidade |
| **P2** | M-01: Controle de role convidar | ❌ | MÉDIO — Escalação |
| **P2** | M-02: Controle de role revogar | ❌ | MÉDIO — Escalação |
| **P2** | M-03: Rate limiting específico | ❌ | MÉDIO — Spam/brute force |
| **P3** | M-06: Sanitizar erro Supabase | ⚠️ | BAIXO — Info disclosure |

---

## Recomendações Adicionais (V3+)

1. **Campos de rastreabilidade:** Adicionar `invitedBy`, `invitedAt`, `acceptedAt` no model StoreUser
2. **Limite de usuários por loja:** Implementar max 50 usuários ativos por loja
3. **Expiração de convites:** StoreUsers com authUserId null e createdAt > 7 dias devem ser desativados automaticamente
4. **Reenvio de convite:** Endpoint para reenviar convite em vez de novo convite

---

## Próximos Passos

### Imediato (ANTES de enviar para produção)

1. **Mover token para body POST** (C-01)
   - Arquivo: `apps/api/src/modules/onboarding/routes.ts`
   - Rota: `POST /onboarding/aceitar-convite`
   
2. **Falhar convite se Supabase falha** (C-02)
   - Arquivo: `apps/api/src/modules/partner/configuracoes-service.ts`
   - Função: `convidarUsuario`
   
3. **Adicionar storeId aos metadados do convite** (C-03)
   - Arquivo: `apps/api/src/modules/partner/configuracoes-service.ts`
   - Função: `convidarUsuario` + `aceitarConviteUsuario`
   
4. **Validar frontend** (M-04)
   - Arquivo: `apps/web-partner/src/app/(auth)/aceitar-convite/page.tsx`
   - Verificar se o fetch está usando rota correta com POST

### Próximo Sprint

5. Implementar controle de role para convidar (M-01)
6. Implementar controle de role para revogar (M-02)
7. Rate limiting específico para endpoints sensíveis (M-03)
8. Sanitizar mensagens de erro do Supabase (M-06)

---

## Análise OWASP Top 10

| Categoria | Status | Notas |
|-----------|--------|-------|
| A01 — Broken Access Control | ⚠️ PARCIAL | storeId isolation OK no convidar; falta no aceitar (C-03). Falta controle de role (M-01, M-02). |
| A02 — Cryptographic Failures | ✅ OK | Token delegado ao Supabase. |
| A03 — Injection | ✅ OK | Email validado via TypeBox. Prisma usa queries parametrizadas. |
| A04 — Insecure Design | ⚠️ PARCIAL | StoreUser criado mesmo com falha do Supabase (C-02). |
| A05 — Security Misconfiguration | ✅ OK | Helmet, CORS, rate limiting global presentes. |
| A07 — Identification & Auth Failures | ✅ OK | Token validado via Supabase verifyOtp. |
| A09 — Security Logging & Monitoring | ⚠️ PARCIAL | Logs presentes, mas falta invitedBy/invitedAt. |

---

## Conclusão

O sistema de convites foi implementado com funcionalidades principais operacionais, mas apresenta **3 vulnerabilidades críticas** relacionadas a:
1. Vazamento de token em query strings (C-01)
2. Criação de usuários órfãos quando Supabase falha (C-02)
3. Falta de isolamento de tenant ao aceitar convite (C-03)

Estas vulnerabilidades **DEVEM ser corrigidas ANTES de enviar para produção**. As correções são relativamente simples e podem ser implementadas em 1-2 sprints de desenvolvimento.

**Recomendação:** Agendar sprint de segurança para corrigir P1s antes de produção.

---

**Documento gerado:** 21 de Abril de 2026  
**Auditor:** Nicholas Orchestrator (Security Audit)  
**Revisão:** Status consolidado de todas as recomendações de auditoria
