---
name: parallel-feature-development
description: Coordinate parallel feature development with file ownership strategies, conflict avoidance rules, and integration patterns for multi-agent implementation. Use this skill when decomposing features for parallel development, establishing file ownership boundaries, or managing integration between parallel work streams.
version: 1.0.2
---

# Desenvolvimento de recursos paralelos

Estratégias para decompor recursos em fluxos de trabalho paralelos, estabelecendo limites de propriedade de arquivos, evitando conflitos e integrando resultados de vários agentes implementadores.

## Quando usar esta habilidade

- Decompondo um recurso para implementação paralela
- Estabelecendo limites de propriedade de arquivos entre agentes
- Projetando contratos de interface entre fluxos de trabalho paralelos
- Escolhendo estratégias de integração (fatia vertical vs camada horizontal)
- Gerenciando fluxos de trabalho de ramificação e mesclagem para desenvolvimento paralelo

## Estratégias de propriedade de arquivos

### Por diretório

Atribua a cada implementador a propriedade de diretórios específicos:

```
implementer-1: src/components/auth/
implementer-2: src/api/auth/
implementer-3: tests/auth/
```

**Ideal para**: bases de código bem organizadas com limites de diretório claros.

### Por Módulo

Atribuir propriedade de módulos lógicos (que podem abranger diretórios):

```
implementer-1: Authentication module (login, register, logout)
implementer-2: Authorization module (roles, permissions, guards)
```

**Ideal para**: arquiteturas orientadas a recursos, design orientado a domínio.

### Por camada

Atribuir propriedade de camadas arquitetônicas:

```
implementer-1: UI layer (components, styles, layouts)
implementer-2: Business logic layer (services, validators)
implementer-3: Data layer (models, repositories, migrations)
```

**Melhor para**: arquiteturas tradicionais MVC/em camadas.

## Regras para evitar conflitos

### A Regra Cardeal

**Um proprietário por arquivo.** Nenhum arquivo deve ser atribuído a vários implementadores.

### Quando os arquivos devem ser compartilhados

Se um arquivo realmente precisar de alterações de vários implementadores:

1. **Designe um único proprietário** — Um implementador possui o arquivo
2. **Outros implementadores solicitam alterações** — Envie mensagens ao proprietário com solicitações de alterações específicas
3. **O proprietário aplica as alterações sequencialmente** — Evita conflitos de mesclagem
4. **Alternativa: Extrair interfaces** — Crie um arquivo de interface separado que o não proprietário possa importar sem modificar

### Contratos de interface

Quando os implementadores precisam coordenar os limites:

```typescript
// src/types/auth-contract.ts (owned by team-lead, read-only for implementers)
export interface AuthResponse {
  token: string;
  user: UserProfile;
  expiresAt: number;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
}
```

Ambos os implementadores importam do arquivo do contrato, mas nenhum deles o modifica.

## Padrões de Integração

### Fatia Vertical

Cada implementador cria uma fatia completa de recursos (UI + API + testes):

```
implementer-1: Login feature (login form + login API + login tests)
implementer-2: Register feature (register form + register API + register tests)
```

**Prós**: Cada fatia pode ser testada de forma independente, sendo necessária integração mínima.
**Contras**: Pode duplicar utilitários compartilhados, o que é mais difícil com recursos fortemente acoplados.

### Camada horizontal

Cada implementador constrói uma camada em todos os recursos:

```
implementer-1: All UI components (login form, register form, profile page)
implementer-2: All API endpoints (login, register, profile)
implementer-3: All tests (unit, integration, e2e)
```

**Prós**: Padrões consistentes em cada camada, especialização natural.
**Contras**: Mais pontos de integração, a camada 3 depende das camadas 1 e 2.

### Híbrido

Misture vertical e horizontal com base no acoplamento:

```
implementer-1: Login feature (vertical slice â€” UI + API + tests)
implementer-2: Shared auth infrastructure (horizontal â€” middleware, JWT utils, types)
```

**Ideal para**: a maioria dos recursos do mundo real com alguma infraestrutura compartilhada.

## Gestão de Filial

### Estratégia de Filial Única

Todos os implementadores trabalham no mesmo ramo de recursos:

- Configuração simples, sem sobrecarga de mesclagem
- Requer propriedade estrita de arquivos para evitar conflitos
- Ideal para: equipes pequenas (2-3), limites bem definidos

### Estratégia Multi-Filial

Cada implementador trabalha em uma sub-ramificação:

```
feature/auth
  â”œâ”€â”€ feature/auth-login      (implementer-1)
  â”œâ”€â”€ feature/auth-register    (implementer-2)
  â””â”€â”€ feature/auth-tests       (implementer-3)
```

- Mais isolamento, pontos de mesclagem explícitos
- Maior sobrecarga, conflitos de mesclagem ainda são possíveis em arquivos compartilhados
- Melhor para: equipes maiores (4+), recursos complexos
