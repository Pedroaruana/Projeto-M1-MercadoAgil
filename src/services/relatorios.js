import { STATUS_PEDIDO } from '../config/regras.js'
import { arredondar } from '../utils/dinheiro.js'

export const relatorioBasico = (pedidos) => {
    // Separa somente os pedidos confirmados.
    const pedidosConfirmados = pedidos.filter(
        (pedido) => pedido.status === STATUS_PEDIDO.CONFIRMADO
    );

    // Conta quantos pedidos confirmados existem.
    const quantidadePedidos = pedidosConfirmados.length

    // Extrai os totais e soma os valores pagos.
    const faturamentoTotal = arredondar(
        pedidosConfirmados
            .map((pedido) => pedido.total)
            .reduce((soma, total) => arredondar(soma + total), 0)
    );

    // Calcula a média por pedido; sem confirmados, retorna zero.
    const ticketMedio = quantidadePedidos > 0
        ? arredondar(faturamentoTotal / quantidadePedidos)
        : 0

    //quantidadePedidos > 0: verifica se existe pedido confirmado.
    //?: se existir, divide o faturamento pela quantidade.
    // : 0: caso contrário, guarda zero e evita dividir por zero.

    // Soma os descontos somente dos pedidos confirmados.
    const totalDescontos = arredondar(
        pedidosConfirmados
            .map((pedido) => pedido.desconto)
            .reduce((soma, desconto) => arredondar(soma + desconto), 0)
    );

    return {
        faturamentoTotal,
        quantidadePedidos,
        ticketMedio,
        totalDescontos
    };
};
//pedidos recebe a lista completa.
//filter cria uma nova lista com os pedidos que passam na condição.
//pedido.status === STATUS_PEDIDO.CONFIRMADO verifica se cada pedido está confirmado.
//return devolve um objeto com os indicadores calculados dos pedidos confirmados.
