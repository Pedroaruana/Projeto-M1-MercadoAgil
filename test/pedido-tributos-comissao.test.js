import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { Estoque } from "../src/models/Estoque.js";

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const camisa = { id: 3, nome: 'Camisa florida', preco: 100, categoria: 'vestuario', vendedorID: 3 }
const cliente = { nome: 'Maria', regiao: 'Nordeste' }

const estoqueComSaldo = () => {
    const estoque = new Estoque()
    estoque.definirQuantidade(mouse.id, 10)
    estoque.definirQuantidade(livro.id, 10)
    return estoque
}

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

test('repasses do exemplo: um por vendedor', () => {
    const pedido = novoPedido()
    pedido.confirmar(estoqueComSaldo())

    assert.deepEqual(pedido.repasses, {
        1: { bruto: 120, comissao: 9.6, repasse: 110.4 },
        2: { bruto: 80, comissao: 12, repasse: 68 },
    })
})

test('pedido aberto não gera repasse', () => {
    assert.deepEqual(novoPedido().repasses, {})
})