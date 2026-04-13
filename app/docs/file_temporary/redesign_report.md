# Redesign Report — Vendza Web Partner

> Gerado em: 2026-04-13
> Total de tarefas encontradas: **4**
> Status geral: `pendente`

---

## Ordem de Execução (por prioridade + dependências)

| Ordem | ID | Título | Prioridade | Depende de |
|---|---|---|---|---|
| 1 | SOF-24 | Redesign: Visão geral (card) | Alta | — |
| 2 | SOF-19 | Redesign: Tela configurações | Média | — |
| 3 | SOF-29 | Zonas de entrega com mapa interativo | Média | SOF-19 |
| 4 | SOF-30 | Polimento visual na tela de configurações | Média | SOF-19 + SOF-29 |

---

## Redesign #1 — SOF-24

- **Título:** Redesign: Visão geral (card)
- **Link:** https://linear.app/venza-project/issue/SOF-24/redesign-visao-geralcard
- **Prioridade:** Alta
- **Descrição:** Os cards do kanban de "Pedidos em Andamento" na tela de Visão Geral devem ser clicáveis. Ao clicar, abre um drawer lateral (side panel à direita) com o resumo completo do pedido — status, código, dados do cliente, itens, resumo financeiro, endereço de entrega, timeline de eventos e ações rápidas (Avançar Status, Imprimir, Cancelar). O botão "Avançar Status" deve mover o card no kanban em tempo real.
- **Escopo do redesign:**
  - Adicionar hover state nos cards do kanban (borda sutil ou leve elevação)
  - Overlay escurecendo o fundo ao abrir o drawer
  - Novo componente drawer lateral com layout de resumo completo do pedido
  - Botões de ação no footer do drawer
  - Lógica de "Avançar Status" conectada ao kanban em tempo real
- **Arquivos afetados:**
  - `app/apps/web-partner/src/components/KanbanBoard.tsx` — adicionar clicabilidade nos cards e handler de seleção de pedido
  - `app/apps/web-partner/src/app/(dashboard)/page.tsx` — passar dados/contexto para o kanban se necessário
  - Novo arquivo: `app/apps/web-partner/src/components/PedidoDrawer.tsx` — drawer lateral com resumo
- **Dependências:** Nenhuma. KanbanBoard já tem lógica de status update (PATCH). PedidoDetalhe.tsx na tela de pedidos já tem um drawer similar que pode servir de referência.
- **Status:** `pendente`
- **Plano de implementação:**
  1. Ler o KanbanBoard.tsx atual para entender estrutura exata dos cards e lógica de drag-drop
  2. Ler o PedidoDetalhe.tsx da tela de pedidos como referência de drawer
  3. Criar `PedidoDrawer.tsx` — drawer lateral 480px com:
     - Overlay com click-to-close
     - Seções: status badge, código+data, dados do cliente, lista de itens, resumo financeiro, endereço, timeline
     - Footer com botões: Avançar Status, Imprimir Pedido, Cancelar Pedido
  4. Modificar `KanbanBoard.tsx`:
     - Adicionar estado `selectedOrderId` e setter
     - Adicionar hover state visual nos `.kanban-item`
     - Ao clicar no card, fetch lazy do pedido completo (GET `/partner/orders/{id}`) e abre o drawer
     - Botão "Avançar Status" no drawer chama o mesmo PATCH que o drag-drop já usa
  5. Garantir que fechar drawer (Esc, click fora, botão X) limpa o estado corretamente

---

## Redesign #2 — SOF-19

- **Título:** Redesign: Tela configurações (Pós: Mapa)
- **Link:** https://linear.app/venza-project/issue/SOF-19/redesign-tela-configuracoes-pos-mapa
- **Prioridade:** Média
- **Descrição:** Redesenho completo da tela de Configurações. Eliminar o sistema de 4 abas e transformar em página única com scroll. Cada seção vira um card separado: (1) Informações da Loja — 2 colunas com campos + logo upload, (2) Horários de Funcionamento — grid dos 7 dias com suporte a 2 turnos por dia, (3) Dados Bancários — 2 colunas com badge de status, (4) Zonas de Entrega — mantida como está mas dentro de card (será expandida em SOF-29), (5) Usuários e Acessos — lista com avatares e menu de ações. Adicionar mini navegação lateral com anchor links e scroll suave.
- **Escopo do redesign:**
  - Eliminar tabs/abas de navegação
  - Layout de página única com scroll
  - Mini sidebar de anchor links (fixa, lado esquerdo)
  - 5 cards com layout 2 colunas onde aplicável
  - Upload de logo com preview circular na seção Loja
  - Badge de status (Conta válida/Pendente) no header do card de Dados Bancários
  - Suporte a 2 turnos por dia nos Horários
  - Avatares com iniciais na seção de Usuários
  - Menu de 3 pontos com ações por usuário
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/page.tsx` — remover lógica de abas, renderizar tudo sequencial
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/FormConfiguracoes.tsx` — layout 2 colunas + logo upload
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/HorariosForm.tsx` — suporte a 2 turnos por dia
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/DadosBancarios.tsx` — layout 2 colunas + badge de status
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/UsuariosConfig.tsx` — avatares com iniciais + menu 3 pontos
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/ZonasEntrega.tsx` — envolver em card com estilo uniforme
  - Novo CSS: `app/apps/web-partner/src/app/(dashboard)/configuracoes/configuracoes.css` (ou globals.css)
- **Dependências:** SOF-29 depende que este redesign seja feito primeiro (estrutura de cards da página)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Ler todos os arquivos atuais de configurações (page.tsx + 5 componentes + actions.ts)
  2. Modificar `page.tsx`: remover lógica de query param `?aba=`, carregar todos os dados em paralelo, renderizar os 5 cards em sequência com IDs de anchor (`#loja`, `#horarios`, etc.)
  3. Criar mini nav lateral: componente client `ConfigNavLateral.tsx` com lista de anchor links, highlight via IntersectionObserver
  4. Refatorar `FormConfiguracoes.tsx`: grid 2 colunas (col-esq: nome+slug+whatsapp+pedido-mín, col-dir: status+logo upload)
  5. Refatorar `HorariosForm.tsx`: manter grid 7 dias, adicionar suporte a 2 turnos (array de turnos por dia), botão "+ Adicionar turno"
  6. Refatorar `DadosBancarios.tsx`: grid 2 colunas (dados bancários + pix), badge no header do card
  7. Refatorar `UsuariosConfig.tsx`: avatar com iniciais, menu 3 pontos (Editar / Remover), layout de lista
  8. Envolver `ZonasEntrega.tsx` atual num card com estilo uniforme (stub para SOF-29)
  9. Garantir que todas as server actions existentes continuem funcionando

---

## Redesign #3 — SOF-29

- **Título:** Zonas de entrega com mapa interativo
- **Link:** https://linear.app/venza-project/issue/SOF-29/zonas-de-entrega-com-mapa-interativo
- **Prioridade:** Média
- **Descrição:** Substituir o componente atual de zonas de entrega (campos de texto para bairros) por um sistema visual com mapa Leaflet (OpenStreetMap). O lojista pode desenhar círculos ou polígonos no mapa para definir zonas de entrega. Cada zona tem nome, taxa de entrega, tempo estimado, pedido mínimo, status (ativa/inativa) e lista de bairros para referência. Layout: mapa à esquerda (60%) + painel de configuração das zonas à direita (40%). Zonas existentes sem área mapeada são exibidas com indicador visual para o lojista desenhar depois.
- **Escopo do redesign:**
  - Instalar Leaflet + react-leaflet + leaflet-draw
  - Substituir ZonasEntrega.tsx por novo componente MapaZonasEntrega.tsx
  - Mapa interativo com toolbar (Desenhar círculo / polígono / editar / excluir)
  - Painel lateral de configuração das zonas com scroll próprio
  - Marcador da loja sempre visível
  - Cores distintas por zona (~30% opacidade de preenchimento)
  - Migração gradual: zonas sem área mapeada ficam visíveis com flag
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/configuracoes/ZonasEntrega.tsx` — refatorar ou substituir completamente
  - `app/apps/web-partner/package.json` — adicionar leaflet, react-leaflet, @geoman-io/leaflet-geoman-free ou leaflet-draw
  - Novo arquivo: `app/apps/web-partner/src/app/(dashboard)/configuracoes/MapaZonasEntrega.tsx`
  - CSS específico para Leaflet (importar CSS do Leaflet no componente ou em globals)
- **Dependências:** SOF-19 deve estar completo (estrutura da página de configurações com cards)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Instalar dependências: `leaflet`, `react-leaflet`, `@types/leaflet`, `leaflet-draw` (ou `@geoman-io/leaflet-geoman-free`)
  2. Ler o ZonasEntrega.tsx atual para entender dados e actions usadas
  3. Criar `MapaZonasEntrega.tsx` como Client Component com dynamic import (`next/dynamic`, ssr: false) — obrigatório pois Leaflet não suporta SSR
  4. Implementar mapa base com OpenStreetMap, centralizado no endereço da loja
  5. Adicionar toolbar de desenho (círculo/polígono/editar/excluir)
  6. Ao desenhar zona: criar nova zona no estado local com área geográfica, abrir painel de configuração automático
  7. Ao clicar em zona existente: selecionar e mostrar configuração no painel
  8. Zonas sem área geográfica (migração): listar no painel com badge "Sem área definida"
  9. Botão "Salvar zonas" no footer chama `salvarZonasEntrega()` server action existente (adaptada para incluir dados geográficos)
  10. Adicionar campo de coordenadas geográficas ao schema de zona (ou usar campo existente `centerLat`/`centerLng`/`radiusKm`)

---

## Redesign #4 — SOF-30

- **Título:** Polimento visual na tela de configurações
- **Link:** https://linear.app/venza-project/issue/SOF-30/polimento-visual-na-tela-de-configuracoes
- **Prioridade:** Média
- **Descrição:** Responsividade completa e polish final da tela de configurações redesenhada. Desktop (>1200px): layout 2 colunas, mapa+painel lado a lado, nav lateral fixa. Tablet (768-1200px): cards em 1 coluna, mapa 100% largura + configuração abaixo, nav lateral vira dropdown fixo no topo. Mobile (<768px): tudo em 1 coluna, mapa 100% com min 300px, zonas como accordion, inputs min 44px de toque, botões de salvar sticky no bottom. Polish: transições 200-300ms, skeleton loading, toast de sucesso, validação inline com borda vermelha, modal de confirmação ao sair com alterações não salvas, máscaras automáticas para WhatsApp e CNPJ.
- **Escopo do redesign:**
  - Media queries responsivas para 3 breakpoints (desktop/tablet/mobile)
  - Nav lateral → dropdown no tablet/mobile
  - Accordion para zonas de entrega no mobile
  - Sticky footer com botões de salvar no mobile
  - Skeleton loading components
  - Toast de sucesso em todas as seções
  - Validação inline nos campos obrigatórios
  - Modal "alterações não salvas" com beforeunload
  - Máscaras de input (WhatsApp: +55 DDD + número, CNPJ: XX.XXX.XXX/XXXX-XX)
- **Arquivos afetados:**
  - Todos os componentes de configurações (FormConfiguracoes, HorariosForm, DadosBancarios, UsuariosConfig, MapaZonasEntrega)
  - CSS global / módulos de estilo da página de configurações
  - Possível novo utilitário: `app/packages/utils/src/masks.ts` — funções de máscara de input
- **Dependências:** SOF-19 e SOF-29 devem estar completos
- **Status:** `pendente`
- **Plano de implementação:**
  1. Adicionar media queries nos cards de configurações (2-col → 1-col no tablet/mobile)
  2. Transformar `ConfigNavLateral.tsx` em componente adaptativo (sidebar no desktop, dropdown no tablet/mobile)
  3. Criar Skeleton components para cada seção de card
  4. Implementar toast de sucesso reutilizável (ou usar biblioteca leve como sonner/react-hot-toast)
  5. Adicionar validação inline: campos obrigatórios verificados no `onBlur`, borda vermelha + mensagem de erro abaixo
  6. Implementar `useBeforeUnload` hook para detectar alterações não salvas e mostrar modal de confirmação
  7. Criar funções de máscara para WhatsApp e CNPJ (atualizam o input conforme o usuário digita via `onChange`)
  8. Accordion para seção de zonas no mobile (estado `expanded` por zona)
  9. Sticky footer no mobile para botões de salvar de cada seção

---

## Pacotes Novos a Instalar

| Pacote | Versão | Motivo | Issue |
|---|---|---|---|
| `leaflet` | latest | Mapa interativo | SOF-29 |
| `react-leaflet` | latest | Wrapper React para Leaflet | SOF-29 |
| `@types/leaflet` | latest | Tipos TypeScript para Leaflet | SOF-29 |
| `leaflet-draw` ou `@geoman-io/leaflet-geoman-free` | latest | Toolbar de desenho de zonas | SOF-29 |

---

## Log de Progresso

| ID | Status | Notas |
|---|---|---|
| SOF-24 | `resolvido` | Drawer lateral com resumo completo do pedido, ações rápidas e integração em tempo real com o kanban |
| SOF-19 | `resolvido` | Sistema de abas eliminado, página única com 5 cards, ConfigNavLateral, 2 colunas, turnos duplos, avatares, menu 3 pontos |
| SOF-29 | `resolvido` | Mapa Leaflet com leaflet-draw, desenho de círculos/polígonos, painel de configuração de zonas, migração gradual |
| SOF-30 | `resolvido` | Responsividade 3 breakpoints, toast de sucesso, validação inline, máscara WhatsApp, beforeunload |
