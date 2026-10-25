import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Marketplace } from '../src/services/Marketplace.js'
import { carregarSeed } from '../src/data/seed.js'

const CPF = '52998224725'

// Marketplace com os dados de exemplo (Maria, Nordeste, CPF acima)
const novoMarketplace = () => {
  const marketplace = new Marketplace()
  carregarSeed(marketplace)
  return marketplace
}

// cria um pedido da Maria com 1 Livro de JavaScript (R$ 80,00 + frete R$ 26,50)
const criarPedidoDaMaria = (marketplace) => {
  const { dados } = marketplace.criarPedido(CPF)
  marketplace.adicionarItemPedido(dados.id, 2, 1)
  return dados.id
}

test('cliente sem pedidos devolve lista vazia e total gasto zero', () => {
  const resposta = novoMarketplace().historicoCliente(CPF)

  assert.deepEqual(resposta, {
    ok: true,
    dados: { cliente: 'Maria Oliveira', pedidos: [], totalGasto: 0 },
  })
})

test('lista os pedidos do cliente com status e total', () => {
  const marketplace = novoMarketplace()
  const id = criarPedidoDaMaria(marketplace)

  const { dados } = marketplace.historicoCliente(CPF)

  assert.deepEqual(dados.pedidos, [{ id, status: 'aberto', total: 106.5 }])
})

test('o total gasto soma só os pedidos confirmados', () => {
  const marketplace = novoMarketplace()
  const confirmado = criarPedidoDaMaria(marketplace)
  const cancelado = criarPedidoDaMaria(marketplace)
  criarPedidoDaMaria(marketplace) // continua aberto

  marketplace.confirmarPedido(confirmado)
  marketplace.cancelarPedido(cancelado)

  const { dados } = marketplace.historicoCliente(CPF)

  assert.equal(dados.pedidos.length, 3)
  assert.equal(dados.totalGasto, 106.5)
})

test('não mistura pedidos de outros clientes', () => {
  const marketplace = novoMarketplace()
  criarPedidoDaMaria(marketplace)
  marketplace.criarPedido('11144477735') // João, sem itens

  assert.equal(marketplace.historicoCliente(CPF).dados.pedidos.length, 1)
  assert.equal(marketplace.historicoCliente('111.444.777-35').dados.pedidos.length, 1)
})

test('aceita o CPF com pontuação e nunca devolve o CPF', () => {
  const marketplace = novoMarketplace()
  criarPedidoDaMaria(marketplace)

  const resposta = marketplace.historicoCliente('529.982.247-25')

  assert.equal(resposta.ok, true)
  assert.equal(JSON.stringify(resposta).includes(CPF), false)
  assert.equal(JSON.stringify(resposta).includes('529.982.247-25'), false)
})

test('CPF vazio ou de cliente que não existe vira erro, sem quebrar', () => {
  const marketplace = novoMarketplace()

  assert.match(marketplace.historicoCliente('').erros[0], /Informe o CPF/)
  assert.match(marketplace.historicoCliente('00000000000').erros[0], /Cliente não encontrado/)
})
