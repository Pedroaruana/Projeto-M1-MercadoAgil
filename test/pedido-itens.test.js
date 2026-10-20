import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Pedido } from '../src/models/Pedido.js'
import { Estoque } from '../src/models/Estoque.js'

// estoque com bastante de cada produto, só para poder confirmar o pedido nos testes
const estoqueCheio = () => {
    const estoque = new Estoque()
    ;[1, 2, 3].forEach((id) => estoque.definirQuantidade(id, 100))
    return estoque
}

const mouse = { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorId: 1 }
const livro = { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorId: 2 }
const cadeira = { id: 3, nome: 'Cadeira de escritório', preco: 450, categoria: 'casa', vendedorId: 3 }

const clienteNordeste = { nome: 'Maria', regiao: 'Nordeste' }
const clienteSudeste = { nome: 'João', regiao: 'Sudeste' }

// --- adicionarItem ---

test('adiciona um item novo ao pedido', () => {
    const pedido = new Pedido(clienteSudeste)
    const item = pedido.adicionarItem(mouse, 2)

    assert.deepEqual(item, { produto: mouse, quantidade: 2 })
    assert.equal(pedido.itens.length, 1)
    assert.equal(pedido.totalUnidades, 2)
    assert.equal(pedido.subtotal, 240)
})

test('adicionar o mesmo produto duas vezes soma a quantidade', () => {
    const pedido = new Pedido(clienteSudeste)

    pedido.adicionarItem(mouse, 2)
    pedido.adicionarItem(mouse, 3)

    assert.equal(pedido.itens.length, 1)
    assert.equal(pedido.itens[0].quantidade, 5)
    assert.equal(pedido.subtotal, 600)
})

test('adiciona produtos diferentes em linhas separadas', () => {
    const pedido = new Pedido(clienteNordeste)

    pedido.adicionarItem(mouse, 1)
    pedido.adicionarItem(livro, 2)
    pedido.adicionarItem(cadeira, 1)

    assert.equal(pedido.itens.length, 3)
    assert.equal(pedido.totalUnidades, 4)
    assert.equal(pedido.subtotal, 120 + 160 + 450)
})

test('rejeita quantidade que não é inteiro maior que zero', () => {
    const pedido = new Pedido(clienteSudeste)

    assert.throws(() => pedido.adicionarItem(mouse, 0), /Quantidade inválida/)
    assert.throws(() => pedido.adicionarItem(livro, 1.5), /Quantidade inválida/)
    assert.throws(() => pedido.adicionarItem(cadeira, NaN), /Quantidade inválida/)

    assert.equal(pedido.itens.length, 0)
})

test('rejeita produto inválido', () => {
    const pedido = new Pedido(clienteNordeste)

    assert.throws(() => pedido.adicionarItem(undefined, 1), /Produto inválido/)
    assert.throws(() => pedido.adicionarItem(null, 1), /Produto inválido/)
    assert.throws(() => pedido.adicionarItem({ nome: 'Sem id', preco: 10}, 1), /Produto inválido/)
})

// --- removerItem ---

test('remove um item e devolver o que foi removido', () => {
    const pedido = new Pedido(clienteNordeste)
    pedido.adicionarItem(mouse, 1)
    pedido.adicionarItem(livro, 2)

    const removido = pedido.removerItem(mouse.id)

    assert.deepEqual(removido, { produto: mouse, quantidade: 1})
    assert.equal(pedido.itens.length, 1)
    assert.equal(pedido.itens[0].produto.id, livro.id)
    assert.equal(pedido.subtotal, 160)
})

test('remover item que não está no pedido dá erro com mensagem clara', () => {
    const pedido = new Pedido(clienteSudeste)
    pedido.adicionarItem(mouse, 1)

    assert.throws(() => pedido.removerItem(999), /Item não encontrado no pedido: 999/)
    assert.equal(pedido.itens.length, 1)
})

// --- integração com subtotal / frete / total ---

test('pedido de R$ 360 tem frete grátis e total igual ao subtotal', () => {
    const pedido = new Pedido(clienteNordeste)
    pedido.adicionarItem(mouse, 3) // 3 x 120 = 360

    assert.equal(pedido.subtotal, 360)
    assert.equal(pedido.frete, 0)
    assert.equal(pedido.total, 360)
})

// --- pedido confirmado ou cancelador não sofre alteração ---

test('pedido confirmado rejeita alteração', () => {
    const pedido = new Pedido(clienteNordeste)
    pedido.adicionarItem(mouse, 1)
    pedido.confirmar(estoqueCheio())

    assert.throws(() => pedido.adicionarItem(livro, 1), /não pode ser alterado/)
    assert.throws(() => pedido.removerItem(mouse.id), /não pode ser alterado/)

    // nada mudou
    assert.equal(pedido.itens.length, 1)
    assert.equal(pedido.itens[0].produto.id, mouse.id)
})

test('Pedido cancelado rejeita alteração', () => {
    const pedido = new Pedido(clienteSudeste)
    pedido.adicionarItem(mouse, 1)
    pedido.cancelar()

    assert.throws(() => pedido.adicionarItem(livro, 1), /não pode ser alterado/)
    assert.throws(() => pedido.removerItem(mouse.id), /não pode ser alterado/)

    assert.equal(pedido.itens.length, 1)
    assert.equal(pedido.itens[0].produto.id, mouse.id)
})