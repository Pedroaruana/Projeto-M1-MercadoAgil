
import {
    STATUS_PEDIDO,
    COMISSOES,
    ALIQUOTAS_TRIBUTOS,
} from '../config/regras.js'

import { arredondar } from '../utils/dinheiro.js'

const filtrarPedidosConfirmados = (pedidos) =>
    pedidos.filter(
        (pedido) => pedido.status === STATUS_PEDIDO.CONFIRMADO
    )

// Relatório básico já existente.
export const relatorioBasico = (pedidos) => {
    const confirmados = filtrarPedidosConfirmados(pedidos)

    const faturamentoTotal = arredondar(
        confirmados.reduce((soma, pedido) => soma + pedido.total, 0)
    )

    const quantidadePedidos = confirmados.length

    const ticketMedio = quantidadePedidos > 0
        ? arredondar(faturamentoTotal / quantidadePedidos)
        : 0

    const totalDescontos = arredondar(
        confirmados.reduce(
            (soma, pedido) => soma + (pedido.desconto ?? 0),
            0
        )
    )

    return {
        faturamentoTotal,
        quantidadePedidos,
        ticketMedio,
        totalDescontos,
    }
}

// 1. Faturamento bruto por categoria, antes dos descontos.
export const faturamentoPorCategoria = (pedidos) => {
    const totais = filtrarPedidosConfirmados(pedidos).reduce(
        (categorias, pedido) => {
            pedido.itens.forEach(({ produto, quantidade }) => {
                const categoria = produto.categoria
                const valor = produto.preco * quantidade

                categorias[categoria] =
                    (categorias[categoria] ?? 0) + valor
            })

            return categorias
        },
        {}
    )

    return Object.fromEntries(
        Object.entries(totais).map(([categoria, valor]) => [
            categoria,
            arredondar(valor),
        ])
    )
}

// 2. Repasse e comissão por vendedor.
export const repassePorVendedor = (pedidos, vendedores = []) => {
    const nomes = new Map(
        vendedores.map(({ id, nome }) => [id, nome])
    )

    const totais = filtrarPedidosConfirmados(pedidos).reduce(
        (resultado, pedido) => {
            pedido.itens.forEach(({ produto, quantidade }) => {
                const { vendedorId, categoria, preco } = produto
                const bruto = preco * quantidade
                const comissao = bruto * (COMISSOES[categoria] ?? 0)

                if (!resultado[vendedorId]) {
                    resultado[vendedorId] = {
                        vendedorId,
                        vendedor: nomes.get(vendedorId)
                            ?? `Vendedor ${vendedorId}`,
                        valorBruto: 0,
                        comissao: 0,
                    }
                }

                resultado[vendedorId].valorBruto += bruto
                resultado[vendedorId].comissao += comissao
            })

            return resultado
        },
        {}
    )

    return Object.values(totais).map((vendedor) => {
        const valorBruto = arredondar(vendedor.valorBruto)
        const comissao = arredondar(vendedor.comissao)

        return {
            ...vendedor,
            valorBruto,
            comissao,
            valorARepassar: arredondar(valorBruto - comissao),
        }
    })
}

// 3. Três produtos com maior quantidade vendida.
export const top3ProdutosMaisVendidos = (pedidos) => {
    const totais = filtrarPedidosConfirmados(pedidos).reduce(
        (resultado, pedido) => {
            pedido.itens.forEach(({ produto, quantidade }) => {
                if (!resultado[produto.id]) {
                    resultado[produto.id] = {
                        produtoId: produto.id,
                        nome: produto.nome,
                        quantidadeVendida: 0,
                    }
                }

                resultado[produto.id].quantidadeVendida += quantidade
            })

            return resultado
        },
        {}
    )

    return Object.values(totais)
        .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
        .slice(0, 3)
}

// 4. Total de tributos e comissões sobre os itens brutos.
export const totalTributosEComissoes = (pedidos) => {
    const totais = filtrarPedidosConfirmados(pedidos).reduce(
        (resultado, pedido) => {
            pedido.itens.forEach(({ produto, quantidade }) => {
                const valor = produto.preco * quantidade

                resultado.tributos +=
                    valor * (ALIQUOTAS_TRIBUTOS[produto.categoria] ?? 0)

                resultado.comissoes +=
                    valor * (COMISSOES[produto.categoria] ?? 0)
            })

            return resultado
        },
        { tributos: 0, comissoes: 0 }
    )

    return {
        totalTributos: arredondar(totais.tributos),
        totalComissoes: arredondar(totais.comissoes),
    }
}
