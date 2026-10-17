import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const cadeira = { id: 3, nome: 'Cadeira de escritório', preco: 450, categoria: 'casa', vendedorId: 3 }

const clienteNordeste = { nome: 'Maria', regiao: 'Nordeste' }
const clienteSudeste = { nome: 'João', regiao: 'Sudeste' }

test('exemplo do enunciado: subtotal 200 e frete 28 (R$ 25 + 2 x R$ 1,50)', () => {
  const pedido = new Pedido(clienteNordeste, [
    { produto: mouse, quantidade: 1 },
    { produto: livro, quantidade: 1 },
  ])

  assert.equal(pedido.subtotal, 200)
  assert.equal(pedido.totalUnidades, 2)
  assert.equal(pedido.frete, 28)
  // sem cupons o total é subtotal + frete (os descontos entram em outra issue)
  assert.equal(pedido.total, 228)
})

test('frete cobra por unidade, não por linha', () => {
  const pedido = new Pedido(clienteSudeste, [{ produto: livro, quantidade: 3 }])

  assert.equal(pedido.totalUnidades, 3)
  assert.equal(pedido.frete, 24.5) // R$ 20 + 3 x R$ 1,50
})

test('frete grátis quando o valor chega a R$ 300', () => {
  const pedido = new Pedido(clienteSudeste, [{ produto: cadeira, quantidade: 1 }])

  assert.equal(pedido.frete, 0)
  assert.equal(pedido.total, 450)
})

test('frete grátis com cupom do tipo frete', () => {
  const pedido = new Pedido(clienteNordeste, [{ produto: mouse, quantidade: 1 }], [{ codigo: 'FRETEZERO', tipo: 'frete' }])

  assert.equal(pedido.frete, 0)
  assert.equal(pedido.total, 120)
})

test('região inválida gera erro claro', () => {
  const pedido = new Pedido({ nome: 'Ana', regiao: 'Marte' }, [{ produto: mouse, quantidade: 1 }])

  assert.throws(() => pedido.frete, /Região de entrega inválida: Marte/)
})

test('valores com 2 casas decimais, sem erro de ponto flutuante', () => {
  const caro = { id: 4, nome: 'Teste', preco: 0.1, categoria: 'casa', vendedorId: 1 }
  const pedido = new Pedido(clienteSudeste, [{ produto: caro, quantidade: 3 }])

  assert.equal(pedido.subtotal, 0.3)
})

test('começa com status aberto', () => {
  assert.equal(new Pedido(clienteNordeste).status, 'aberto')
})
