// Orquestra as regras do pedido: itens, cupons, frete, tributos, total, comissão e status.
// Status e estoque só mudam por métodos (confirmar, cancelar).
// Ordem dos descontos: primeiro percentuais, depois fixos, por último frete. Teto de 30% do subtotal.
// Só aceita mudanças de itens e cupons enquanto o status for 'aberto'.
export class Pedido {}
