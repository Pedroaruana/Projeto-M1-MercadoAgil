import { formatarReais } from '../utils/dinheiro.js'

export const exibirRelatorioBasico = (relatorio) => {
  // Formata a exibição sem alterar os dados usados nos cálculos.
  console.table({
    'Faturamento total': formatarReais(relatorio.faturamentoTotal),
    'Quantidade de pedidos': relatorio.quantidadePedidos,
    'Ticket médio': formatarReais(relatorio.ticketMedio),
    'Total de descontos': formatarReais(relatorio.totalDescontos)
  })
}
//export permite usar a função em outro arquivo depois.
//relatorio recebe o objeto com os quatro resultados já calculados.
