
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Marketplace } from '../src/services/Marketplace.js'
import { carregarSeed } from '../src/data/seed.js'

test('carregarSeed cadastra todos os dados de exemplo', () => {
  const marketplace = new Marketplace()

  const resposta = carregarSeed(marketplace)

  assert.equal(resposta.ok, true)
  assert.deepEqual(resposta.dados, {
    clientes: 3,
    vendedores: 3,
    produtos: 8,
    cupons: 3,
  })

  assert.equal(marketplace.listarClientes().dados.length, 3)
  assert.equal(marketplace.listarVendedores().dados.length, 3)
  assert.equal(marketplace.listarProdutos().dados.length, 8)
  assert.equal(marketplace.listarCupons().dados.length, 3)
})

test('carregarSeed permite criar o pedido de exemplo por R$ 193,00', () => {
  const marketplace = new Marketplace()
  const carga = carregarSeed(marketplace)

  assert.equal(carga.ok, true)

  const respostaPedido = marketplace.criarPedido('52998224725')
  assert.equal(respostaPedido.ok, true)

  const id = respostaPedido.dados.id

  assert.equal(marketplace.adicionarItemPedido(id, 1, 1).ok, true)
  assert.equal(marketplace.adicionarItemPedido(id, 2, 1).ok, true)
  assert.equal(marketplace.aplicarCupomPedido(id, 'BEMVINDO10').ok, true)
  assert.equal(marketplace.aplicarCupomPedido(id, 'PDA15').ok, true)

  const resumo = marketplace.resumoPedido(id)

  assert.equal(resumo.ok, true)
  assert.equal(resumo.dados.subtotal, 200)
  assert.equal(resumo.dados.desconto, 35)
  assert.equal(resumo.dados.frete, 28)
  assert.equal(resumo.dados.total, 193)
})
