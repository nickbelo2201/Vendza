# PRD V1

## Nome do produto

`INF Adega App`

## Objetivo

Lancar a primeira versao oficial do aplicativo de adega com operacao real, cobrindo o core de venda direta, gestao de pedidos, catalogo, estoque, CRM basico e configuracao da loja.

## Problema

Hoje as adegas ficam presas entre duas opcoes ruins:

- marketplace forte em conversao, mas fraco em ownership
- SaaS amplo em operacao, mas pesado e pouco acionavel em CRM

O lojista vende, mas nao controla bem:

- quem compra
- com que frequencia compra
- qual cliente esfriou
- qual campanha gera recompra
- qual regra operacional esta gerando cancelamento

## Objetivos de negocio

- operar a adega piloto em canal proprio
- reduzir dependencia de terceiros
- criar base de clientes proprietaria
- preparar a esteira de expansao para novas adegas

## Perfis de usuario

### Consumidor

- quer comprar rapido
- quer saber se a loja atende o endereco
- quer confiar em tempo de entrega e pagamento

### Dono da adega

- quer ver pedidos, faturamento e clientes
- quer ter autonomia comercial
- quer operar no celular e no notebook

### Operador / atendente

- quer receber, atualizar e concluir pedidos sem friccao
- quer abrir pedido assistido
- quer localizar cliente e pedido em segundos

## Escopo obrigatorio do V1

### Cliente e descoberta

- gate de maioridade
- selecao de endereco
- elegibilidade por area de entrega
- home com categorias, destaques e ofertas
- busca simples
- pagina de produto
- carrinho
- checkout
- tracking do pedido
- historico e repeticao de pedido

### Operacao da adega

- board de pedidos em tempo real
- detalhe completo do pedido
- mudanca de status
- pedidos agendados
- pedido assistido
- busca por cliente, telefone e pedido
- notificacao sonora

### Catalogo e estoque

- CRUD de produtos
- categorias
- disponibilidade
- estoque por item
- destaque comercial
- preco promocional
- combos e kits

### Loja e entrega

- branding basico
- horarios por dia e turno
- retirada
- area por bairro e raio
- taxa de entrega
- pedido minimo
- frete gratis por valor
- meios de pagamento ativos

### CRM basico

- perfil do cliente
- historico de compras
- total gasto
- ultima compra
- flag de inatividade
- notas internas
- tags simples

### Dashboard e relatorios basicos

- pedidos do dia
- faturamento
- ticket medio
- novos x recorrentes
- top produtos

## Fora do V1

- programa de fidelidade completo
- automacao oficial de WhatsApp
- multi-loja operacional
- app de entregador
- poligono complexo com roteirizacao
- IA generativa

## Requisitos nao funcionais

- mobile-first no lado cliente
- painel responsivo no parceiro
- carregamento inicial rapido
- arquitetura auditavel
- isolamento por tenant pronto desde o modelo de dados
- logs e trilha de eventos desde o inicio

## Criterios de sucesso

- a adega consegue operar pedidos reais sem apoio tecnico continuo
- o dono consegue ver clientes inativos no painel
- o cliente final conclui compra do catalogo ao checkout sem sair do fluxo
- o sistema suporta operacao de madrugada sem improviso

## Gates de release

- pedido ponta a ponta funcionando
- estoque refletindo indisponibilidade
- area de entrega validando checkout
- CRM registrando memoria de compra
- dashboard lendo dados reais
