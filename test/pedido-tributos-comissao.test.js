import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { CupomDesconto } from '../src/models/CupomDesconto.js'

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const camisa = { id: 3, nome: 'Camisa florida', preco: 100, categoria: 'vestuario', vendedorID: 3 }
const cliente = { nome: 'Maria', regiao: 'Nordeste' }

// pedido do exemplo do enunciado: subtotal R$ 200,00
const novoPedido = () =>
  new Pedido(cliente, [
    { produto: mouse, quantidade: 1 },
    { produto: livro, quantidade: 1 },
  ])

test('tributos do exemplo: R$14,40', () => {
    const pedido = novoPedido()
    assert.equal(pedido.tributos, 14.4)
})

test('comissão do exemplo: R$21,60', () => {
    const pedido = novoPedido()
    assert.equal(pedido.comissao, 21.6)
})