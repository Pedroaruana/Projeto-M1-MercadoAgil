import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { CupomDesconto } from '../src/models/CupomDesconto.js'
import { Estoque } from "../src/models/Estoque.js";

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const clienteNordeste = { nome: 'Maria', regiao: 'Nordeste' }

const novoPedido = () => 
    new Pedido(clienteNordeste, [
        { produto: mouse, quantidade: 1},
        { produto: livro, quantidade: 1},
    ])

const estoqueComSaldo = () => {
    const estoque = new Estoque()
    estoque.definirQuantidade(mouse.id, 10)
    estoque.definirQuantidade(livro.id, 10)
    return estoque
}

const bemvindo10 = new CupomDesconto('BEMVINDO10', 'percentual', 10, '2027-12-31', 100, true)
const pda15 = new CupomDesconto('PDA15', 'fixo', 15, '2027-12-31', 100, true)

test('CASOS EXTREMOS - pedido vazio não pode ser confirmado', () => {
    const pedido = new Pedido(clienteNordeste)

    assert.throws(() => pedido.confirmar(estoqueComSaldo()), /Pedido vazio não pode ser confirmado/)
    assert.equal(pedido.status, 'aberto')
})

test('CASOS EXTREMOS - Cupom repetido é recusado', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(bemvindo10)

    assert.throws(() => pedido.aplicarCupom(bemvindo10), /já foi aplicado/)
    assert.equal(pedido.cupons.length, 1)
})

test('CASOS EXTREMOS - cancelar pedido já cancelado dá erro claro', () => {
    const pedido = novoPedido()
    pedido.cancelar()

    assert.equal(pedido.status, 'cancelado')
    assert.throws(() => pedido.cancelar(), /Pedido já está cancelado/)
})

test('CASOS EXTREMOS - pedido confirmado recusa mudança de item', () => {
    const pedido = novoPedido()
    pedido.confirmar(estoqueComSaldo())

    assert.throws(() => pedido.adicionarItem(mouse, 1), /não pode ser alterado/)
    assert.throws(() => pedido.removerItem(mouse.id), /não pode ser alterado/)
    assert.throws(() => pedido.aplicarCupom(bemvindo10), /não pode ser alterado/)

    assert.equal(pedido.itens.length, 2)
    assert.equal(pedido.cupons.length, 0)
})