import { formatarReais } from '../utils/dinheiro.js'

export const exibirRelatorioBasico = (relatorio) => {
    // Aceita os nomes de campos já previstos pela tela.
    const indicadores = {
        'Faturamento total': formatarReais(
            relatorio.faturamentoTotal ?? relatorio.faturamento ?? relatorio.total
        ),
        'Quantidade de pedidos':
            relatorio.quantidadePedidos ?? relatorio.quantidade ?? relatorio.pedidos,
        'Ticket médio': formatarReais(
            relatorio.ticketMedio ?? relatorio.ticket
        )
    }

    // Preserva os totais extras quando o serviço os fornece.
    const extras = [
        ['Total de descontos', 'totalDescontos'],
        ['Total de tributos', 'totalTributos'],
        ['Comissão do marketplace', 'totalComissao']
    ]

    extras.forEach(([rotulo, campo]) => {
        const valor = campo === 'totalComissao'
            ? relatorio.totalComissao ?? relatorio.totalComissoes
            : relatorio[campo]

        if (valor !== undefined) {
            indicadores[rotulo] = formatarReais(valor)
        }
    })
    console.table(indicadores)
}
//export permite usar a função em outro arquivo depois.
//relatorio recebe o objeto com os quatro resultados já calculados.
