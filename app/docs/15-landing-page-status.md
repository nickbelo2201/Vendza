# Landing Page — Status e Próximos Passos

## Status atual

`page-preview.html` — entregue, aprovada, finalizada.

Arquivo: `app/apps/web-partner/src/app/login/page-preview.html`

## O que foi construído

### Design
- Identidade visual Vendza: verde `#1A7A5E`, âmbar `#E8902A`, fundo claro com dot-grid mesh gradient estilo Stripe/Linear
- Tipografia: Plus Jakarta Sans (headings, 800) + Inter (corpo) + JetBrains Mono (dados/código)
- Tokens CSS completos: `--g`, `--gn`, `--amb`, `--night`, `--s1` até `--s8`, shadows, radius
- Headline em camadas: `.hl-back` (opacidade 10%), `.hl-back2` (18%), `.hl-front` com verde/âmbar/cinza claro (`var(--s4)`)
- Dashboard card com tilt 3D flutuante, animação `tiltFloat`
- Mascote Venzo flutuante com speech bubble e glow ring
- 3 notification cards flutuantes com animações independentes

### Seções
1. **Navbar** — fixa, blur, logo SVG, nav links com smooth scroll, badge "IA disponível", botão Entrar
2. **Hero** — headline 3 linhas, subtítulo, 2 CTAs, stats strip com counter animado, dashboard card + Venzo no lado direito
3. **Features / Bento 2.0** — grid assimétrico 3 colunas, card IA dark 2×2, 4 cards regulares com spotlight hover, CTA block escuro
4. **Como funciona** — 3 passos com linha conectora, ícones SVG, hover com gradient border
5. **Para quem é** — 4 segmentos (adega, restaurante, distribuidora, comércio local) com cards dor/solução
6. **Pricing** — plano R$350/mês + IA sob medida (sob consulta), tabela comparativa vs. Zé Delivery/iFood
7. **FAQ** — 6 perguntas, accordion com transição `max-height`
8. **Modal de login** — email + senha, toggle olho, lembrar 30 dias, esqueceu a senha, social proof com avatares

### Interações implementadas
- Smooth scroll via helper `scrollTo()` (compensa navbar 64px com `scroll-margin-top:72px`)
- Cursor-follow radial fill nos CTAs principais (`.btn-h-p`, `.btn-cp`)
- Spotlight radial nos bento cards via `mousemove`
- AI typewriter com 6 mensagens, ciclo delete/type
- Counter animado nas stats (IntersectionObserver)
- Bento cards entrance stagger (IntersectionObserver)
- Headline stagger entrance (duplo rAF)
- FAQ accordion (fecha os outros ao abrir)
- Modal: abrir/fechar via qualquer CTA, Escape, clique fora do card
- Login submit: validação de campos vazios com highlight vermelho, estado loading com spinner, redirect para `/`

### Botões — mapa completo
| Botão | Ação |
|---|---|
| Logo | `href="#"` (placeholder) |
| Produto / Segmentos / Preços / Dúvidas | smooth scroll para seção |
| Ver demo | smooth scroll para `#features` |
| Entrar (navbar) | abre modal |
| Começar agora — grátis (hero) | abre modal |
| Ver como funciona (hero) | smooth scroll para `#como-funciona` |
| Criar minha conta (features CTA) | abre modal |
| Falar com a equipe (features CTA) | abre modal |
| Começar 14 dias grátis (pricing) | abre modal |
| Falar com a equipe (pricing) | abre modal |
| FAQ items | toggle accordion |
| Fechar modal (✕ / Escape / fundo) | fecha modal |
| Olho senha | toggle type password/text |
| Entrar no painel (submit) | valida + loading + redirect `/` |
| Esqueceu a senha / Fale com nosso time | `href="#"` (placeholder) |

## Próximo passo de design

**Continuar o web-partner completo com o design da landing page como base.**

O design system está definido em `page-preview.html`. Toda implementação do painel parceiro (`app/apps/web-partner/`) deve seguir os mesmos tokens, tipografia e linguagem visual.

### Telas a implementar (web-partner)

Referência de ordem sugerida:

1. **Login page** (`/login`) — já tem estrutura HTML no modal, transformar em página real com auth Supabase
2. **Dashboard / Home** (`/`) — métricas do dia, faturamento, pedidos em aberto, top produtos
3. **Board de pedidos** (`/pedidos`) — kanban em tempo real (Novo → Preparo → Saiu → Entregue)
4. **Detalhe do pedido** — drawer lateral com itens, pagamento, endereço, timeline de status
5. **Catálogo** (`/catalogo`) — CRUD de produtos, preço, estoque, destaque, combos
6. **Clientes / CRM** (`/clientes`) — lista, perfil, histórico de compras, tags, notas
7. **Configurações** (`/configuracoes`) — branding, horários, área de entrega, meios de pagamento

### Regras de design para o painel

- Mesmos tokens CSS (`--g`, `--amb`, `--night`, `--s1..s8`)
- Plus Jakarta Sans para títulos de página e botões primários
- Inter para corpo e labels
- JetBrains Mono para valores monetários e contadores
- Board é a home real do operador — métricas resumidas no topo
- Pedido detalhado em drawer, não em página separada
- Alertas operacionais legíveis, sem dramatismo
- Mobile-first nas telas de operação (operador usa celular no balcão)
