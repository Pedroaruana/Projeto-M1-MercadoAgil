import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { Estoque } from '../src/models/Estoque.js'

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const cliente = { nome: 'Maria', regiao: 'Nordeste' }

// estoque com 5 mouses e 5 livros
const novoEstoque = () => {
  const estoque = new Estoque()
  estoque.definirQuantidade(mouse.id, 5)
  estoque.definirQuantidade(livro.id, 5)
  return estoque
}

const novoPedido = () =>
  new Pedido(cliente, [
    { produto: mouse, quantidade: 2 },
    { produto: livro, quantidade: 3 },
  ])

const disponivel = (estoque, produto) => estoque.consultar(produto.id).dados.quantidade

test('confirmar com estoque suficiente muda o status e dá baixa', () => {
  const estoque = novoEstoque()
  const pedido = novoPedido()

  assert.equal(pedido.confirmar(estoque), 'confirmado')

  assert.equal(pedido.status, 'confirmado')
  assert.equal(disponivel(estoque, mouse), 3)
  assert.equal(disponivel(estoque, livro), 2)
})

test('tudo ou nada: faltando 2 itens, lista os 2 e não baixa nada', () => {
  const estoque = new Estoque()
  estoque.definirQuantidade(mouse.id, 1) // pedido quer 2
  estoque.definirQuantidade(livro.id, 1) // pedido quer 3
  const pedido = novoPedido()

  assert.throws(
    () => pedido.confirmar(estoque),
    (erro) => {
      assert.deepEqual(erro.erros, [
        'Estoque insuficiente: Mouse (pedido 2, disponível 1)',
        'Estoque insuficiente: Livro de JavaScript (pedido 3, disponível 1)',
      ])
      return true
    },
  )

  assert.equal(pedido.status, 'aberto')
  assert.equal(disponivel(estoque, mouse), 1)
  assert.equal(disponivel(estoque, livro), 1)
})

test('tudo ou nada: faltando só 1 item, o outro não sai do estoque', () => {
  const estoque = new Estoque()
  estoque.definirQuantidade(mouse.id, 10) // sobra
  estoque.definirQuantidade(livro.id, 1) // falta
  const pedido = novoPedido()

  assert.throws(() => pedido.confirmar(estoque), /Livro de JavaScript \(pedido 3, disponível 1\)/)

  assert.equal(disponivel(estoque, mouse), 10)
  assert.equal(pedido.status, 'aberto')
})

test('cancelar pedido confirmado devolve os itens ao estoque', () => {
  const estoque = novoEstoque()
  const pedido = novoPedido()
  pedido.confirmar(estoque)

  assert.equal(pedido.cancelar(estoque), 'cancelado')

  assert.equal(pedido.status, 'cancelado')
  assert.equal(disponivel(estoque, mouse), 5)
  assert.equal(disponivel(estoque, livro), 5)
})

test('cancelar pedido aberto só muda o status e não mexe no estoque', () => {
  const estoque = novoEstoque()
  const pedido = novoPedido()

  pedido.cancelar(estoque)

  assert.equal(pedido.status, 'cancelado')
  assert.equal(disponivel(estoque, mouse), 5)
  assert.equal(disponivel(estoque, livro), 5)
})

test('cancelar pedido aberto funciona sem passar o estoque', () => {
  const pedido = novoPedido()

  pedido.cancelar()

  assert.equal(pedido.status, 'cancelado')
})

test('cancelar pedido já cancelado dá erro claro e não devolve de novo', () => {
  const estoque = novoEstoque()
  const pedido = novoPedido()
  pedido.confirmar(estoque)
  pedido.cancelar(estoque)

  assert.throws(() => pedido.cancelar(estoque), /já está cancelado/)

  assert.equal(disponivel(estoque, mouse), 5)
})

test('cancelar pedido confirmado exige o estoque', () => {
  const pedido = novoPedido()
  pedido.confirmar(novoEstoque())

  assert.throws(() => pedido.cancelar(), /Informe o estoque/)

  assert.equal(pedido.status, 'confirmado')
})

test('confirmar duas vezes dá erro e não baixa o estoque de novo', () => {
  const estoque = novoEstoque()
  const pedido = novoPedido()
  pedido.confirmar(estoque)

  assert.throws(() => pedido.confirmar(estoque), /não pode ser confirmado com status confirmado/)

  assert.equal(disponivel(estoque, mouse), 3)
})

test('pedido cancelado não pode ser confirmado', () => {
  const pedido = novoPedido()
  pedido.cancelar()

  assert.throws(() => pedido.confirmar(novoEstoque()), /status cancelado/)
})

test('pedido vazio não pode ser confirmado', () => {
  const estoque = novoEstoque()

  assert.throws(() => new Pedido(cliente).confirmar(estoque), /Pedido vazio/)
})

test('o status só muda pelos métodos, não direto', () => {
  const pedido = novoPedido()

  assert.throws(() => {
    'use strict'
    pedido.status = 'confirmado'
  }, TypeError)

  assert.equal(pedido.status, 'aberto')
})
