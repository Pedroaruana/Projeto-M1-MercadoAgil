import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Marketplace } from '../src/services/Marketplace.js'
import { Estoque } from '../src/models/Estoque.js'
import { Cliente } from '../src/models/Cliente.js'
import { Produto } from '../src/models/Produto.js'
import { CupomDesconto } from '../src/models/CupomDesconto.js'

const CPF = '52998224725'

// Marketplace com os dados do pedido de exemplo do enunciado
const novoMarketplace = (quantidades = { mouse: 5, livro: 5 }) => {
  const estoque = new Estoque()
  estoque.definirQuantidade(1, quantidades.mouse)
  estoque.definirQuantidade(2, quantidades.livro)

  return new Marketplace({
    clientes: [new Cliente(1, 'Maria Oliveira', 'maria@example.com', CPF, 'Nordeste')],
    produtos: [
      new Produto(1, 'Mouse', 120, 'eletronicos', 1),
      new Produto(2, 'Livro de JavaScript', 80, 'livros', 2),
    ],
    cupons: [
      new CupomDesconto('BEMVINDO10', 'percentual', 10, '2027-12-31', 100, true),
      new CupomDesconto('PDA15', 'fixo', 15, '2027-12-31', 100, true),
      new CupomDesconto('VELHO', 'fixo', 5, '2020-01-01', 0, true),
    ],
    estoque,
  })
}

// cria o pedido do exemplo: 1 Mouse e 1 Livro de JavaScript
const pedidoDoExemplo = (marketplace) => {
  const { dados } = marketplace.criarPedido(CPF)
  marketplace.adicionarItemPedido(dados.id, 1, 1)
  marketplace.adicionarItemPedido(dados.id, 2, 1)
  return dados.id
}

test('exemplo do enunciado de ponta a ponta: total R$ 193,00', () => {
  const marketplace = novoMarketplace()
  const id = pedidoDoExemplo(marketplace)

  assert.equal(marketplace.aplicarCupomPedido(id, 'BEMVINDO10').ok, true)
  assert.equal(marketplace.aplicarCupomPedido(id, 'PDA15').ok, true)

  const { ok, dados } = marketplace.resumoPedido(id)

  assert.equal(ok, true)
  assert.equal(dados.subtotal, 200)
  assert.equal(dados.desconto, 35)
  assert.equal(dados.frete, 28)
  assert.equal(dados.total, 193)
  assert.equal(dados.tributos, 14.4)
  assert.deepEqual(dados.cupons, ['BEMVINDO10', 'PDA15'])
  assert.equal(dados.itens.length, 2)
})

test('criarPedido aceita o CPF com pontuação e devolve o id', () => {
  const resposta = novoMarketplace().criarPedido('529.982.247-25')

  assert.deepEqual(resposta, { ok: true, dados: { id: 1 } })
})

test('criarPedido recusa CPF que não existe ou vazio', () => {
  const marketplace = novoMarketplace()

  assert.deepEqual(marketplace.criarPedido('11144477735').ok, false)
  assert.match(marketplace.criarPedido('11144477735').erros[0], /Cliente não encontrado/)
  assert.match(marketplace.criarPedido('').erros[0], /Informe o CPF/)
})

test('o CPF do cliente nunca aparece nas respostas', () => {
  const marketplace = novoMarketplace()
  const id = pedidoDoExemplo(marketplace)

  const resumo = JSON.stringify(marketplace.resumoPedido(id))
  const lista = JSON.stringify(marketplace.listarPedidos())

  assert.equal(resumo.includes(CPF), false)
  assert.equal(lista.includes(CPF), false)
})

test('adicionar item: produto inexistente, quantidade inválida e pedido inexistente viram erro', () => {
  const marketplace = novoMarketplace()
  const { dados } = marketplace.criarPedido(CPF)

  assert.match(marketplace.adicionarItemPedido(dados.id, 99, 1).erros[0], /Produto "99" não encontrado/)
  assert.match(marketplace.adicionarItemPedido(dados.id, 1, 0).erros[0], /Quantidade inválida/)
  assert.match(marketplace.adicionarItemPedido(dados.id, 1, 'abc').erros[0], /Quantidade inválida/)
  assert.match(marketplace.adicionarItemPedido(77, 1, 1).erros[0], /Pedido #77 não encontrado/)
})

test('remover item funciona e item que não está no pedido vira erro', () => {
  const marketplace = novoMarketplace()
  const id = pedidoDoExemplo(marketplace)

  assert.equal(marketplace.removerItemPedido(id, 1).ok, true)
  assert.equal(marketplace.resumoPedido(id).dados.subtotal, 80)
  assert.match(marketplace.removerItemPedido(id, 1).erros[0], /Item não encontrado/)
})

test('cupom: inexistente, vencido e abaixo do mínimo viram erro com a mensagem do motivo', () => {
  const marketplace = novoMarketplace()
  const id = pedidoDoExemplo(marketplace)

  assert.match(marketplace.aplicarCupomPedido(id, 'NAOEXISTE').erros[0], /não encontrado/)
  assert.match(marketplace.aplicarCupomPedido(id, 'VELHO').erros[0], /está vencido/)

  marketplace.removerItemPedido(id, 1) // subtotal cai para R$ 80, abaixo do mínimo de R$ 100
  assert.match(marketplace.aplicarCupomPedido(id, 'BEMVINDO10').erros[0], /exige pedido de no mínimo/)
})

test('o código do cupom aceita minúsculas e espaços', () => {
  const marketplace = novoMarketplace()
  const id = pedidoDoExemplo(marketplace)

  assert.equal(marketplace.aplicarCupomPedido(id, ' bemvindo10 ').ok, true)
})

test('confirmar dá baixa no estoque e cancelar devolve', () => {
  const marketplace = novoMarketplace({ mouse: 5, livro: 5 })
  const id = pedidoDoExemplo(marketplace)

  assert.deepEqual(marketplace.confirmarPedido(id), { ok: true, dados: { id, status: 'confirmado' } })
  assert.equal(marketplace.resumoPedido(id).dados.status, 'confirmado')

  assert.deepEqual(marketplace.cancelarPedido(id), { ok: true, dados: { id, status: 'cancelado' } })

  // o estoque voltou: dá para confirmar outro pedido com tudo
  const outro = pedidoDoExemplo(marketplace)
  assert.equal(marketplace.confirmarPedido(outro).ok, true)
})

test('tudo ou nada: sem estoque, a resposta lista TODOS os itens em falta e nada é confirmado', () => {
  const marketplace = novoMarketplace({ mouse: 0, livro: 0 })
  const id = pedidoDoExemplo(marketplace)

  const resposta = marketplace.confirmarPedido(id)

  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'Estoque insuficiente: Mouse (pedido 1, disponível 0)',
    'Estoque insuficiente: Livro de JavaScript (pedido 1, disponível 0)',
  ])
  assert.equal(marketplace.resumoPedido(id).dados.status, 'aberto')
})

test('casos de erro do pedido viram resposta, sem derrubar o programa', () => {
  const marketplace = novoMarketplace()
  const { dados } = marketplace.criarPedido(CPF)

  assert.match(marketplace.confirmarPedido(dados.id).erros[0], /Pedido vazio/)
  assert.equal(marketplace.cancelarPedido(dados.id).ok, true)
  assert.match(marketplace.cancelarPedido(dados.id).erros[0], /já está cancelado/)
  assert.match(marketplace.adicionarItemPedido(dados.id, 1, 1).erros[0], /não pode ser alterado/)
  assert.match(marketplace.confirmarPedido(99).erros[0], /Pedido #99 não encontrado/)
})

test('listarPedidos mostra número, cliente, status e total', () => {
  const marketplace = novoMarketplace()
  assert.deepEqual(marketplace.listarPedidos(), { ok: true, dados: [] })

  const id = pedidoDoExemplo(marketplace)

  assert.deepEqual(marketplace.listarPedidos().dados, [
    { id, cliente: 'Maria Oliveira', status: 'aberto', total: 228 },
  ])
})

test('os números dos pedidos seguem a ordem e não se repetem', () => {
  const marketplace = novoMarketplace()

  assert.equal(marketplace.criarPedido(CPF).dados.id, 1)
  assert.equal(marketplace.criarPedido(CPF).dados.id, 2)
})
