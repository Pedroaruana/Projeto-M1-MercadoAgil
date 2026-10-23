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

const bemvindo10 = new CupomDesconto('BEMVINDO10', 'percentual', 10, '2027-12-31', 100, true)
const acumula10 = new CupomDesconto('ACUMULA10', 'percentual', 10, '2027-12-31', 100, true)
const pda15 = new CupomDesconto('PDA15', 'fixo', 15, '2027-12-31', 100, true)
const freteZero = new CupomDesconto('FRETEZERO', 'frete', 0, '2027-12-31', 0, true)
const unico = new CupomDesconto('UNICO20', 'fixo', 20, '2027-12-31', 0, false)

test('desconto do exemplo: BEMVINDO10 + PDA15 = R$35', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(bemvindo10)
    pedido.aplicarCupom(pda15)

    assert.equal(pedido.desconto, 35)
})

test('a ordem de aplicação dos cupons não muda o desconto', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(pda15)
    pedido.aplicarCupom(bemvindo10)

    assert.equal(pedido.desconto, 35)
})

test('desconto é limitado ao teto de 30% do subtotal', () => {
    const pedido = novoPedido()
    const metade = new CupomDesconto('METADE', 'percentual', 50, '2027-12-31', 0, true)
    pedido.aplicarCupom(metade) // R$100 de desconto bruto

    assert.equal(pedido.desconto, 60)
})

test('cupom de frete não gera desconto em dinheiro', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(freteZero)

    assert.equal(pedido.desconto, 0)
})

test('total considera o desconto', () => {
    const pedido = novoPedido()
    pedido.aplicarCupom(bemvindo10)
    pedido.aplicarCupom(pda15)

    assert.equal(pedido.total, pedido.subtotal - 35 + pedido.frete)
})

test('aceita 2 cupons percentuais', () => {
    const pedido = new Pedido(cliente, [{ produto: camisa, quantidade: 1}])
    pedido.aplicarCupom(bemvindo10)
    pedido.aplicarCupom(acumula10)

    assert.equal(pedido.desconto, 19)

})

test('total nunca fica negativo', () => {
    const pedido = new Pedido(cliente, [{ produto: mouse, quantidade: 1 }])
    pedido.aplicarCupom(unico)

    assert.ok(pedido.total >= 0)
})