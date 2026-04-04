# Exemplos de decomposição de tarefas

Exemplos práticos de decomposição de recursos em tarefas paralelizáveis ​​com propriedade clara.

## Exemplo 1: recurso de autenticação de usuário

### Descrição do recurso

Adicione autenticação de e-mail/senha com páginas de login, registro e perfil.

### Decomposição (fatias verticais)

**Stream 1: Fluxo de login** (implementador-1)

- Arquivos de propriedade: `src/pages/login.tsx`, `src/api/login.ts`, `tests/login.test.ts`
- Requisitos: formulário de login, endpoint de API, validação de entrada, tratamento de erros
- Interface: Importa `AuthResponse` de `src/types/auth.ts`

**Stream 2: Fluxo de registro** (implementador-2)

- Arquivos de propriedade: `src/pages/register.tsx`, `src/api/register.ts`, `tests/register.test.ts`
- Requisitos: formulário de registro, endpoint de API, validação de e-mail, força da senha
- Interface: Importa `AuthResponse` de `src/types/auth.ts`

**Fluxo 3: Infraestrutura Compartilhada** (implementador-3)

- Arquivos de propriedade: `src/types/auth.ts`, `src/middleware/auth.ts`, `src/utils/jwt.ts`
- Requisitos: definições de tipo, middleware JWT, utilitários de token
- Dependências: Nenhuma (outros fluxos dependem disso)

### Gráfico de Dependência

```
Stream 3 (types/middleware) â”€â”€â†’ Stream 1 (login)
                             â””â†’ Stream 2 (registration)
```

## Exemplo 2: Terminais da API REST

### Descrição do recurso

Adicione endpoints CRUD para um novo recurso "Projetos".

### Decomposição (por camada)

**Stream 1: Camada de dados** (implementador-1)

- Arquivos de propriedade: `src/models/project.ts`, `src/migrations/add-projects.ts`, `src/repositories/project-repo.ts`
- Requisitos: definição de esquema, migração, padrão de repositório
- Dependências: Nenhuma

**Fluxo 2: Lógica de Negócios** (implementador-2)

- Arquivos de propriedade: `src/services/project-service.ts`, `src/validators/project-validator.ts`
- Requisitos: operações CRUD, regras de validação, lógica de negócios
- Dependências: Bloqueado pelo Stream 1 (precisa de modelo/repositório)

**Stream 3: Camada API** (implementador-3)

- Arquivos de propriedade: `src/routes/projects.ts`, `src/controllers/project-controller.ts`
- Requisitos: endpoints REST, análise de solicitação, formatação de resposta
- Dependências: Bloqueadas pelo Stream 2 (precisa de camada de serviço)

## Modelo de tarefa

```markdown
## Task: {Stream Name}

### Objective

{1-2 sentence description of what to build}

### Owned Files

- {file1} â€” {purpose}
- {file2} â€” {purpose}

### Requirements

1. {Specific deliverable 1}
2. {Specific deliverable 2}
3. {Specific deliverable 3}

### Interface Contract

- Exports: {types/functions this stream provides}
- Imports: {types/functions this stream consumes from other streams}

### Acceptance Criteria

- [ ] {Verifiable criterion 1}
- [ ] {Verifiable criterion 2}
- [ ] {Verifiable criterion 3}

### Out of Scope

- {Explicitly excluded work}
```
