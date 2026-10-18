
import test from 'node:test'
import assert from 'node:assert/strict'

import {
    faturamentoPorCategoria,
    repassePorVendedor,
    top3ProdutosMaisVendidos,
    totalTributosEComissoes,
} from '../src/services/relatorios.js'

import { STATUS_PEDIDO } from '../src/config/regras.js'

const vendedores = [
    { id: 1, nome: 'TechBahia' },
    { id: 2, nome: 'Livraria Sol' },
]

const mouse = {
    id: 1,
    nome: 'Mouse',
    preco: 120,
    categoria: 'eletronicos',
    vendedorId: 1,
}

const livro = {
    id: 2,
    nome: 'Livro de JavaScript',
    preco: 80,
    categoria: 'livros',
    vendedorId: 2,
}

const pedidoExemplo = {
    status: STATUS_PEDIDO.CONFIRMADO,
    itens: [
        { produto: mouse, quantidade: 1 },
        { produto: livro, quantidade: 1 },
    ],
}

test('faturamento por categoria calcula valores brutos', () => {
    assert.deepEqual(
        faturamentoPorCategoria([pedidoExemplo]),
        { eletronicos: 120, livros: 80 },
    )
})

test('repasse calcula comissão e valor do vendedor', () => {
    assert.deepEqual(
        repassePorVendedor([pedidoExemplo], vendedores),
        [
            {
                vendedorId: 1,
                vendedor: 'TechBahia',
                valorBruto: 120,
                comissao: 9.6,
                valorARepassar: 110.4,
            },
            {
                vendedorId: 2,
                vendedor: 'Livraria Sol',
                valorBruto: 80,
                comissao: 12,
                valorARepassar: 68,
            },
        ],
    )
})

test('top 3 ordena produtos pela quantidade vendida', () => {
    const produtos = [
        { id: 3, nome: 'Teclado', preco: 250, categoria: 'eletronicos', vendedorId: 1 },
        { id: 4, nome: 'Cadeira', preco: 450, categoria: 'casa', vendedorId: 1 },
        { id: 5, nome: 'Luminária', preco: 110, categoria: 'casa', vendedorId: 1 },
        { id: 6, nome: 'Fone', preco: 90, categoria: 'eletronicos', vendedorId: 1 },
    ]

    const pedido = {
        status: STATUS_PEDIDO.CONFIRMADO,
        itens: [
            { produto: produtos[0], quantidade: 2 },
            { produto: produtos[1], quantidade: 1 },
            { produto: produtos[2], quantidade: 3 },
            { produto: produtos[3], quantidade: 4 },
        ],
    }

    assert.deepEqual(
        top3ProdutosMaisVendidos([pedido]).map(
            ({ nome, quantidadeVendida }) => ({ nome, quantidadeVendida }),
        ),
        [
            { nome: 'Fone', quantidadeVendida: 4 },
            { nome: 'Luminária', quantidadeVendida: 3 },
            { nome: 'Teclado', quantidadeVendida: 2 },
        ],
    )
})

test('tributos e comissões são calculados corretamente', () => {
    assert.deepEqual(
        totalTributosEComissoes([pedidoExemplo]),
        { totalTributos: 14.4, totalComissoes: 21.6 },
    )
})

test('pedidos abertos e cancelados não entram nos relatórios', () => {
    const pedidoAberto = {
        status: STATUS_PEDIDO.ABERTO,
        itens: [{ produto: mouse, quantidade: 10 }],
    }

    const pedidoCancelado = {
        status: STATUS_PEDIDO.CANCELADO,
        itens: [{ produto: mouse, quantidade: 5 }],
    }

    const pedidos = [pedidoExemplo, pedidoAberto, pedidoCancelado]

    assert.deepEqual(
        faturamentoPorCategoria(pedidos),
        { eletronicos: 120, livros: 80 },
    )

    assert.deepEqual(
        totalTributosEComissoes(pedidos),
        { totalTributos: 14.4, totalComissoes: 21.6 },
    )
})

