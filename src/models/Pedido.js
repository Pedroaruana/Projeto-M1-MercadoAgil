// Orquestra as regras do pedido: itens, cupons, frete, tributos, total, comissão e status.
// Status e estoque só mudam por métodos (confirmar, cancelar).
// Ordem dos descontos: primeiro percentuais, depois fixos, por último frete. Teto de 30% do subtotal.
// Só aceita mudanças de itens e cupons enquanto o status for 'aberto'.
import {
  FRETE_POR_REGIAO,
  FRETE_POR_UNIDADE,
  FRETE_GRATIS_A_PARTIR_DE,
  MAX_CUPONS_POR_PEDIDO,
  ORDEM_CUPONS,
  STATUS_PEDIDO,
  TETO_DESCONTO,
} from '../config/regras.js'
import { arredondar, formatarReais } from '../utils/dinheiro.js'

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

  // Desconto total dos cupons. 
  // conversas com a equipe PERMITIU A APLICAÇÃO DE 2 CUPONS PERCENTUAIS SUCESSIVAS
  get desconto() {
    const subtotal = this.subtotal
    const ordenados = [...this.#cupons].sort(
      (a, b) => ORDEM_CUPONS.indexOf(a.tipo) - ORDEM_CUPONS.indexOf(b.tipo),
    )

    let restante = subtotal
    let soma = 0

    for (const cupom of ordenados) {
      let valor = 0

      // verifica o tipo do cupom e aplica o desconto baseado no restante do subtotal atual
      // permite aplicar 2 cupons percentuais de forma sucessiva 
      if (cupom.tipo === 'percentual') {
        valor = (restante * cupom.valor) / 100
      } else if (cupom.tipo === 'fixo') {
        valor = cupom.valor
      }

      //evita que o cupom retire do pedido mais do que resta pagar, evitando que o valor fique negativo
      valor = Math.min(valor, restante)
      soma += valor // guarda a soma dos descontos
      restante -= valor // guarda o valor restante que o cliente vai pagar
    }

    // Retorna o menor valor passado, se a soma dos descontos for maior que o teto, retorn o teto
    return arredondar(Math.min(soma, subtotal * TETO_DESCONTO))
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

  // Provisório!! a issue #6 troca por confirmar de verdade (confere e baixa estoque)
  confirmar() {
    this.#status = STATUS_PEDIDO.CONFIRMADO
  }

  cancelar() {
    this.#status = STATUS_PEDIDO.CANCELADO
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

    // Faz uma procura pelo item no pedido para verificar se já existe
    const existente = this.#itens.find((item) => item.produto.id === produto.id)

    // Em caso de item já existente, cria uma váriavel atualizado para somar a quantidade dos itens já existentes com o recém adicionado
    // Mapeia a lista de itens para atualizar o novo item
    if (existente) {
      const atualizado = { ...existente, quantidade: existente.quantidade + quantidade}
      this.#itens = this.#itens.map((item) => (item === existente ? atualizado : item))
      return { ...atualizado }
    }

    // Em caso de um novo produto, adiciona a lista de itens
    const novo = { produto, quantidade }
    this.#itens = [ ...this.#itens, novo]
    return { ...novo } 
  }

  // Remover o item inteiro pelo id do produto. Devolve o item removido. 
  removerItem(produtoId) {
    this.#garantirAberto()

    // Faz uma procura pelo indice do item informado
    const indice = this.#itens.findIndex((item) => item.produto.id === produtoId)

    // Caso o item não exista na lista, indice fica -1 e retorna uma mensagem de erro
    if (indice === -1) {
      throw new Error(`Item não encontrado no pedido: ${produtoId}`)
    }

    // Váriavel removido guarda o item que queremos tirar da lista pois iremos retorna ele para o usuario
    // Filter percorre a lista e mantém os itens quem forem true
    const removido = this.#itens[indice]
    this.#itens = this.#itens.filter((_, i) => i !== indice)
    return { ...removido }

  }

  // Aplica um cupom no pedido, se passar em todas as regras. Devolve a lista de cupons do pedido.
  // O desconto em si (ordem e teto de 30%) é calculado em outra issue.
  aplicarCupom(cupom) {
    this.#garantirAberto()

    if (!cupom || typeof cupom.estaValido !== 'function') {
      throw new Error('Cupom inválido')
    }

    // Cupom vencido é recusado, mesmo que estivesse válido quando foi cadastrado
    if (!cupom.estaValido()) {
      throw new Error(`Cupom ${cupom.codigo} está vencido`)
    }

    // O subtotal (antes dos descontos) precisa atingir o valor mínimo do cupom
    if (this.subtotal < cupom.valorMinimo) {
      throw new Error(
        `Cupom ${cupom.codigo} exige pedido de no mínimo ${formatarReais(cupom.valorMinimo)} (subtotal atual: ${formatarReais(this.subtotal)})`,
      )
    }

    // O mesmo cupom não pode entrar duas vezes
    if (this.#cupons.some(({ codigo }) => codigo === cupom.codigo)) {
      throw new Error(`Cupom ${cupom.codigo} já foi aplicado neste pedido`)
    }

    // No máximo 2 cupons por pedido
    if (this.#cupons.length >= MAX_CUPONS_POR_PEDIDO) {
      throw new Error(`Limite de ${MAX_CUPONS_POR_PEDIDO} cupons por pedido atingido`)
    }

    // Cupom não cumulativo só pode ser usado sozinho (nem como segundo, nem como primeiro)
    const jaTemNaoCumulativo = this.#cupons.some(({ cumulativo }) => !cumulativo)

    if (this.#cupons.length > 0 && (!cupom.cumulativo || jaTemNaoCumulativo)) {
      throw new Error(`Cupom ${cupom.codigo} não pode ser combinado com outro cupom`)
    }

    this.#cupons = [...this.#cupons, cupom]
    return this.cupons
  }



}

