import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { Estoque } from '../src/models/Estoque.js'
import { Cliente } from '../src/models/Cliente.js'
import { Vendedor } from '../src/models/Vendedor.js'
import { Produto } from '../src/models/Produto.js'
import { CupomDesconto } from '../src/models/CupomDesconto.js'
import { Marketplace } from '../src/services/Marketplace.js'
import { relatorioBasico, repassePorVendedor, totalTributosEComissoes } from '../src/services/relatorios.js'

// Pedido de exemplo do enunciado:
// cliente do Nordeste, 1 Mouse (eletrônicos, R$ 120,00, TechBahia) e
// 1 Livro de JavaScript (livros, R$ 80,00, Livraria Sol), com os cupons BEMVINDO10 e PDA15.
const CPF = '52998224725'

const cliente = new Cliente(1, 'Maria Oliveira', 'maria@example.com', CPF, 'Nordeste')
const techBahia = new Vendedor(1, 'TechBahia', '11222333000181', 'contato@techbahia.com')
const livrariaSol = new Vendedor(2, 'Livraria Sol', '45723174000110', 'contato@livrariasol.com')
const mouse = new Produto(1, 'Mouse', 120, 'eletronicos', techBahia.id)
const livro = new Produto(2, 'Livro de JavaScript', 80, 'livros', livrariaSol.id)

const bemvindo10 = new CupomDesconto('BEMVINDO10', 'percentual', 10, '2027-12-31', 100, true)
const pda15 = new CupomDesconto('PDA15', 'fixo', 15, '2027-12-31', 100, true)
const freteZero = new CupomDesconto('FRETEZERO', 'frete', 0, '2027-12-31', 0, true)

const novoEstoque = () => {
  const estoque = new Estoque()
  estoque.definirQuantidade(mouse.id, 5)
  estoque.definirQuantidade(livro.id, 5)
  return estoque
}

const itensDoExemplo = () => [
  { produto: mouse, quantidade: 1 },
  { produto: livro, quantidade: 1 },
]

const pedidoDoExemplo = () => {
  const pedido = new Pedido(cliente, itensDoExemplo())
  pedido.aplicarCupom(bemvindo10)
  pedido.aplicarCupom(pda15)
  return pedido
}

test('valores do pedido: subtotal R$ 200, desconto R$ 35, frete R$ 28 e TOTAL R$ 193', () => {
  const pedido = pedidoDoExemplo()

  assert.equal(pedido.subtotal, 200)
  assert.equal(pedido.desconto, 35) // 10% de 200 = 20, depois R$ 15 fixo
  assert.equal(pedido.frete, 28) // R$ 25 (Nordeste) + 2 x R$ 1,50
  assert.equal(pedido.total, 193)
})

test('o desconto fica dentro do teto de 30% do subtotal (R$ 60)', () => {
  const pedido = pedidoDoExemplo()

  assert.ok(pedido.desconto <= pedido.subtotal * 0.3)
})

test('a ordem em que os cupons entram não muda o resultado', () => {
  const pedido = new Pedido(cliente, itensDoExemplo())
  pedido.aplicarCupom(pda15)
  pedido.aplicarCupom(bemvindo10)

  assert.equal(pedido.desconto, 35)
  assert.equal(pedido.total, 193)
})

test('tributos aproximados R$ 14,40 (12% x 120 + 0% x 80) e não somam no total', () => {
  const pedido = pedidoDoExemplo()

  assert.equal(pedido.tributos, 14.4)
  assert.equal(pedido.total, 193)
})

test('comissão total do marketplace R$ 21,60 (8% x 120 + 15% x 80)', () => {
  assert.equal(pedidoDoExemplo().comissao, 21.6)
})

test('repasse depois de confirmar: TechBahia R$ 110,40 e Livraria Sol R$ 68,00', () => {
  const pedido = pedidoDoExemplo()
  pedido.confirmar(novoEstoque())

  const { repasses } = pedido

  assert.deepEqual(repasses[techBahia.id], { bruto: 120, comissao: 9.6, repasse: 110.4 })
  assert.deepEqual(repasses[livrariaSol.id], { bruto: 80, comissao: 12, repasse: 68 })
})

test('cupom e frete não diminuem o repasse e pedido aberto não gera repasse', () => {
  // mesmo pedido, sem cupons e em outra região (frete diferente): o repasse é igual
  const semCupons = new Pedido(new Cliente(2, 'João', 'joao@example.com', CPF, 'Sul'), itensDoExemplo())
  semCupons.confirmar(novoEstoque())

  const comCupons = pedidoDoExemplo()
  comCupons.confirmar(novoEstoque())

  assert.deepEqual(semCupons.repasses, comCupons.repasses)
  assert.deepEqual(pedidoDoExemplo().repasses, {})
})

test('trocando o PDA15 pelo cupom de frete: desconto R$ 20, frete R$ 0 e total R$ 180', () => {
  const pedido = new Pedido(cliente, itensDoExemplo())
  pedido.aplicarCupom(bemvindo10)
  pedido.aplicarCupom(freteZero)

  assert.equal(pedido.desconto, 20)
  assert.equal(pedido.frete, 0)
  assert.equal(pedido.total, 180)
})

test('confirmar baixa 1 Mouse e 1 Livro do estoque', () => {
  const estoque = novoEstoque()
  pedidoDoExemplo().confirmar(estoque)

  assert.equal(estoque.consultar(mouse.id).dados.quantidade, 4)
  assert.equal(estoque.consultar(livro.id).dados.quantidade, 4)
})

test('pelo Marketplace: o mesmo pedido dá R$ 193,00 e o resumo não mostra o CPF', () => {
  const marketplace = new Marketplace({
    clientes: [cliente],
    produtos: [mouse, livro],
    cupons: [bemvindo10, pda15],
    estoque: novoEstoque(),
  })

  const { dados: { id } } = marketplace.criarPedido(CPF)
  marketplace.adicionarItemPedido(id, mouse.id, 1)
  marketplace.adicionarItemPedido(id, livro.id, 1)
  marketplace.aplicarCupomPedido(id, 'BEMVINDO10')
  marketplace.aplicarCupomPedido(id, 'PDA15')

  const resumo = marketplace.resumoPedido(id)

  assert.equal(resumo.ok, true)
  assert.equal(resumo.dados.subtotal, 200)
  assert.equal(resumo.dados.desconto, 35)
  assert.equal(resumo.dados.frete, 28)
  assert.equal(resumo.dados.total, 193)
  assert.equal(resumo.dados.tributos, 14.4)
  assert.equal(JSON.stringify(resumo).includes(CPF), false)

  assert.equal(marketplace.confirmarPedido(id).ok, true)
})

test('relatórios do pedido confirmado: faturamento R$ 193, repasses e comissão R$ 21,60', () => {
  const pedido = pedidoDoExemplo()
  pedido.confirmar(novoEstoque())

  assert.deepEqual(relatorioBasico([pedido]), {
    faturamentoTotal: 193,
    quantidadePedidos: 1,
    ticketMedio: 193,
    totalDescontos: 35,
  })

  const repasse = repassePorVendedor([pedido], [techBahia, livrariaSol])
  const valores = Object.fromEntries(repasse.map((linha) => [linha.vendedor, linha.valorARepassar]))

  assert.deepEqual(valores, { TechBahia: 110.4, 'Livraria Sol': 68 })
  assert.deepEqual(totalTributosEComissoes([pedido]), { totalTributos: 14.4, totalComissoes: 21.6 })
})
