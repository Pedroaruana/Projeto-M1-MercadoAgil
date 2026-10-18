import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { CupomDesconto } from '../src/models/CupomDesconto.js'

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const cliente = { nome: 'Maria', regiao: 'Nordeste' }

// pedido do exemplo do enunciado: subtotal R$ 200,00
const novoPedido = () =>
  new Pedido(cliente, [
    { produto: mouse, quantidade: 1 },
    { produto: livro, quantidade: 1 },
  ])

const bemvindo10 = new CupomDesconto('BEMVINDO10', 'percentual', 10, '2027-12-31', 100, true)
const pda15 = new CupomDesconto('PDA15', 'fixo', 15, '2027-12-31', 100, true)
const freteZero = new CupomDesconto('FRETEZERO', 'frete', 0, '2027-12-31', 0, true)
const unico = new CupomDesconto('UNICO20', 'fixo', 20, '2027-12-31', 0, false)

test('exemplo do enunciado: BEMVINDO10 e PDA15 entram juntos', () => {
  const pedido = novoPedido()

  pedido.aplicarCupom(bemvindo10)
  const cupons = pedido.aplicarCupom(pda15)

  assert.deepEqual(cupons.map(({ codigo }) => codigo), ['BEMVINDO10', 'PDA15'])
})

test('cupom do tipo frete zera o frete depois de aplicado', () => {
  const pedido = novoPedido()
  assert.equal(pedido.frete, 28)

  pedido.aplicarCupom(freteZero)

  assert.equal(pedido.frete, 0)
})

test('recusa cupom vencido', () => {
  const vencido = new CupomDesconto('VELHO', 'fixo', 10, '2020-01-01', 0, true)

  assert.throws(() => novoPedido().aplicarCupom(vencido), /VELHO está vencido/)
})

test('recusa cupom quando o subtotal não atinge o valor mínimo', () => {
  const exigente = new CupomDesconto('GRANDE', 'fixo', 50, '2027-12-31', 500, true)

  assert.throws(() => novoPedido().aplicarCupom(exigente), /exige pedido de no mínimo/)
})

test('recusa o mesmo cupom duas vezes', () => {
  const pedido = novoPedido()
  pedido.aplicarCupom(bemvindo10)

  assert.throws(() => pedido.aplicarCupom(bemvindo10), /já foi aplicado/)
})

test('recusa o terceiro cupom (máximo 2 por pedido)', () => {
  const pedido = novoPedido()
  pedido.aplicarCupom(bemvindo10)
  pedido.aplicarCupom(pda15)

  assert.throws(() => pedido.aplicarCupom(freteZero), /Limite de 2 cupons/)
})

test('cupom não cumulativo só entra sozinho: recusado como segundo', () => {
  const pedido = novoPedido()
  pedido.aplicarCupom(bemvindo10)

  assert.throws(() => pedido.aplicarCupom(unico), /não pode ser combinado/)
})

test('cupom não cumulativo só entra sozinho: bloqueia os próximos', () => {
  const pedido = novoPedido()
  pedido.aplicarCupom(unico)

  assert.throws(() => pedido.aplicarCupom(bemvindo10), /não pode ser combinado/)
})

test('cupom não cumulativo funciona sozinho', () => {
  const pedido = novoPedido()

  assert.equal(pedido.aplicarCupom(unico).length, 1)
})

test('cupom recusado não entra no pedido', () => {
  const pedido = novoPedido()
  const vencido = new CupomDesconto('VELHO', 'fixo', 10, '2020-01-01', 0, true)

  assert.throws(() => pedido.aplicarCupom(vencido))

  assert.equal(pedido.cupons.length, 0)
})

test('recusa cupom vazio ou que não é um cupom', () => {
  assert.throws(() => novoPedido().aplicarCupom(null), /Cupom inválido/)
  assert.throws(() => novoPedido().aplicarCupom({ codigo: 'X' }), /Cupom inválido/)
})

test('pedido confirmado ou cancelado não aceita cupom', () => {
  const confirmado = novoPedido()
  confirmado.confirmar()
  assert.throws(() => confirmado.aplicarCupom(bemvindo10), /status confirmado/)

  const cancelado = novoPedido()
  cancelado.cancelar()
  assert.throws(() => cancelado.aplicarCupom(bemvindo10), /status cancelado/)
})
