# Arquitetura de Produto

## Estrutura macro

O produto oficial tem quatro camadas:

1. `Canal de venda`
2. `Cockpit de operacao`
3. `Motor de dados e eventos`
4. `CRM e automacao`

## Modulos principais

### 1. Discovery e vitrine

Responsavel por:

- endereco
- elegibilidade
- home
- categorias
- busca
- merchandising

### 2. Checkout e tracking

Responsavel por:

- carrinho
- validacao de regras
- pagamento
- timeline do pedido
- acompanhamento do cliente

### 3. Operacao de pedidos

Responsavel por:

- board em tempo real
- detalhe do pedido
- state machine
- pedido assistido
- agendamento
- alertas

### 4. Catalogo e estoque

Responsavel por:

- cadastro de SKUs
- disponibilidade
- kits e combos
- merchandising
- ruptura
- prioridade comercial

### 5. Loja e entrega

Responsavel por:

- branding
- horarios
- entrega
- pedido minimo
- taxa
- frete gratis
- retirada

### 6. CRM e growth

Responsavel por:

- memoria do cliente
- ultimas compras
- ticket
- inatividade
- tags
- depois, segmentos e campanhas

### 7. Analytics e governanca

Responsavel por:

- dashboard
- relatorios
- usuarios
- papeis
- trilha de eventos

## Interacao entre modulos

- `checkout` depende de `catalogo`, `estoque`, `loja` e `entrega`
- `operacao` depende de `pedido`, `cliente` e `timeline`
- `CRM` depende de `pedido` e `cliente`
- `analytics` depende de eventos append-only

## Regras estruturais

- um pedido nao pode viver so no frontend
- o status do pedido precisa ser uma maquina de estados
- toda acao importante precisa gerar evento
- CRM nao pode depender de planilha externa
- WhatsApp e uma surface do produto, nao um bypass

## State machine recomendada

- `pending`
- `confirmed`
- `preparing`
- `ready_for_delivery`
- `out_for_delivery`
- `delivered`
- `cancelled`

## Decisao oficial

O produto vai nascer com `board realtime + CRM basico + pedido assistido`.

Esse trio e o ponto em que superamos ao mesmo tempo a simplicidade do Ze para o lojista e a cobertura operacional da Neemo.
