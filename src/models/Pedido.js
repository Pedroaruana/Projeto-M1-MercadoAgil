// Orquestra as regras do pedido: itens, cupons, frete, tributos, total, comissão e status.
// Status e estoque só mudam por métodos (confirmar, cancelar).
// Ordem dos descontos: primeiro percentuais, depois fixos, por último frete. Teto de 30% do subtotal.
// Só aceita mudanças de itens e cupons enquanto o status for 'aberto'.
import {
  FRETE_POR_REGIAO,
  FRETE_POR_UNIDADE,
  FRETE_GRATIS_A_PARTIR_DE,
  STATUS_PEDIDO,
} from '../config/regras.js'
import { arredondar } from '../utils/dinheiro.js'

export class Pedido {
  #cliente
  #itens
  #cupons
  #status = STATUS_PEDIDO.ABERTO

  // itens: [{ produto: { id, nome, preco, categoria, vendedorId }, quantidade }]
  constructor(cliente, itens = [], cupons = []) {
    this.#cliente = cliente
    this.#itens = [...itens]
    this.#cupons = [...cupons]
  }

  get cliente() {
    return this.#cliente
  }

  get itens() {
    return [...this.#itens]
  }

  get cupons() {
    return [...this.#cupons]
  }

  get status() {
    return this.#status
  }

  // Soma de preço x quantidade de cada item, antes dos descontos
  get subtotal() {
    return arredondar(
      this.#itens.reduce((soma, { produto, quantidade }) => soma + produto.preco * quantidade, 0),
    )
  }

  // Total de unidades no pedido (soma das quantidades, não o número de linhas)
  get totalUnidades() {
    return this.#itens.reduce((soma, { quantidade }) => soma + quantidade, 0)
  }

  // Desconto total dos cupons. Por enquanto 0: percentual, fixo e teto de 30% entram na issue de descontos.
  get desconto() {
    return 0
  }

  // Frete = taxa da região + R$ 1,50 por unidade. Um só por pedido, mesmo com vendedores diferentes.
  // Grátis quando o valor já com descontos chega a R$ 300,00 ou quando há cupom do tipo frete.
  get frete() {
    const { regiao } = this.#cliente
    const taxaRegiao = FRETE_POR_REGIAO[regiao]

    if (taxaRegiao === undefined) {
      throw new Error(`Região de entrega inválida: ${regiao}`)
    }

    const temCupomFrete = this.#cupons.some(({ tipo }) => tipo === 'frete')
    const valorComDescontos = this.subtotal - this.desconto

    if (temCupomFrete || valorComDescontos >= FRETE_GRATIS_A_PARTIR_DE) {
      return 0
    }

    return arredondar(taxaRegiao + FRETE_POR_UNIDADE * this.totalUnidades)
  }

  // Total = subtotal - descontos + frete. Nunca fica negativo.
  get total() {
    return arredondar(Math.max(0, this.subtotal - this.desconto + this.frete))
  }

  // Método para verificar o status do pedido
  #garantirAberto() {
    if (this.#status !== STATUS_PEDIDO.ABERTO) {
      throw new Error(`Pedido não pode ser alterado com status ${this.#status}`)
    }
  }

  // Adiciona um produto. Se já existir no pedido, soma a quantidade.
  adicionarItem(produto, quantidade) {
    this.#garantirAberto()

    // Verifica se um produto existe e verifica se o produto tem um ID, o ID é usado para saber se o item já está no pedido
    if (!produto || produto.id === undefined) {
      throw new Error(`Produto inválido`)
    }

    // Verifica se a quantidade é um número inteiro e se é maior que 0
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error(`Quantidade inválida: ${quantidade}. Quantidade deve ser maior que zero.`)
    }


  }
}
