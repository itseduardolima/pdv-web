# Visão Geral do Produto

## O que é

Sistema PDV (Ponto de Venda) web, multi-tenant e white-label, voltado inicialmente
para pequenos mercados/mercadinhos que hoje não têm nenhum sistema informatizado
(vendem no caderno ou de cabeça, sem emissão de nota, sem controle de estoque real).

O protótipo visual (Claude Design / Artifact) já validado com o cliente cobre estas
telas, em 3 breakpoints (Desktop 1600×900, Tablet 1180×820, Celular 412×915):

- Login (seleção de operador + PIN)
- Abertura de Caixa
- Vender (PDV / checkout)
- Venda Confirmada
- Produtos (lista + CRUD)
- Fechamento de Caixa (com Histórico de Vendas do dia)
- Dashboard
- Operadores (lista + CRUD, com upload de foto)

Este repositório é a implementação real (funcional) desse protótipo.

## Por que web

- Um único código atende desktop (escritório/gerência), tablet (caixa físico) e
  celular (acompanhamento remoto pela dona do mercado).
- Não exige instalação nem loja de app — só um link.
- Roda em qualquer hardware que a loja já tenha (o mercado-alvo não tem PC ainda;
  qualquer tablet Android barato ou notebook resolve).
- PWA cobre o ponto fraco do web puro (dependência de internet no caixa): cache
  local + fila de sincronização quando a conexão cai. Ver [01-arquitetura](./01-arquitetura.md).

## Por que multi-tenant / white-label desde o início

O objetivo de negócio não é vender para UM mercado, é revender o mesmo sistema
para vários mercados pequenos trocando apenas nome, logo e cores — sem fork de
código. Ver [07-multitenant-whitelabel](./07-multitenant-whitelabel.md) e
[06-design-system-temas](./06-design-system-temas.md).

## Fora de escopo (v1)

- Emissão de nota fiscal (NFC-e/SAT) — o mercado-alvo hoje não emite nota; é um
  possível módulo futuro, não bloqueia o lançamento.
- Integração com balança/pesagem eletrônica.
- Multi-loja/multi-filial para o mesmo tenant (v1 assume 1 loja por tenant).
- Controle fiscal/contábil avançado (isso é PDV operacional, não ERP).

## Glossário

| Termo | Significado |
|---|---|
| Tenant | Um mercado cliente do sistema (dados isolados, tema próprio) |
| Operador | Funcionário que usa o caixa (login por PIN) |
| Administrador | Papel com permissão de CRUD de operadores, produtos, revogar/criar PIN |
| Caixa | Sessão de operação de um período (abertura → vendas → fechamento) |
| Fechamento | Encerramento da sessão de caixa, com totais por forma de pagamento |
