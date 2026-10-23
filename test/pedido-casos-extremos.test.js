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

test('CASOS EXTREMOS - pedido confirmado recusa mudança de itens e cupons', () => {
    const pedido = novoPedido()
    pedido.confirmar(estoqueComSaldo())

    assert.throws(() => pedido.adicionarItem(mouse, 1), /não pode ser alterado/)
    assert.throws(() => pedido.removerItem(mouse.id), /não pode ser alterado/)
    assert.throws(() => pedido.aplicarCupom(bemvindo10), /não pode ser alterado/)

    assert.equal(pedido.itens.length, 2)
    assert.equal(pedido.cupons.length, 0)
})

test('CASOS EXTREMOS - pedido cancelado recusa mudança de itens e cupons', () => {
    const pedido = novoPedido()
    pedido.cancelar()

    assert.throws(() => pedido.adicionarItem(mouse, 1), /não pode ser alterado/ )
    assert.throws(() => pedido.removerItem(mouse.id), /não pode ser alterado/ )
    assert.throws(() => pedido.aplicarCupom(bemvindo10), /não pode ser alterado/ )

    assert.equal(pedido.itens.length, 2)
    assert.equal(pedido.cupons.length, 0)
})

test('CASOS EXTREMOS - quantidade zero, negativa ou texto é recusado', () => {
    const pedido = novoPedido()

    assert.throws(() => pedido.adicionarItem(mouse, 0), /Quantidade inválida/ )
    assert.throws(() => pedido.adicionarItem(mouse, -3), /Quantidade inválida/ )
    assert.throws(() => pedido.adicionarItem(mouse, '15'), /Quantidade inválida/ )

    assert.equal(pedido.itens.length, 2)
})

test('CASOS EXTREMOS - subtotal arredondado: 3 * R$0,10 = R$0,30', () => {
    // Em java, 0.1 * 3 dá 0.30000000000000004
    const barato = { id: 9, nome: "bala", preco: 0.1, categoria: 'alimentos', vendedorId: 3 }
    const pedido = new Pedido(clienteNordeste, [{ produto: barato, quantidade: 3}])

    assert.equal(pedido.subtotal, 0.3)
})

test('CASOS EXTREMOS - subtotal abaixo do mínimo do cupom nega a confirmação', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(bemvindo10)
    pedido.removerItem(mouse.id)

    assert.throws(() => pedido.confirmar(estoqueComSaldo()), /exige pedido de no mínimo/)
})

test('CASOS EXTREMOS - Pedido vazio não cobra frete', () => {
    const pedido = new Pedido(clienteNordeste, [])

    assert.equal(pedido.frete, 0)
})

test('CASOS EXTREMOS - cupom vencido entre a aplicação e confirmação', () => {
    const cupom = new CupomDesconto('VAIVENCER', 'percentual', 10, '2027-12-31', 0, true)
    const pedido = novoPedido()

    pedido.aplicarCupom(cupom)
    cupom.validade = '2020-01-01' // deixando o cupom vencido

    assert.throws(() => pedido.confirmar(estoqueComSaldo()), /Cupom VAIVENCER está vencido/ )
})
