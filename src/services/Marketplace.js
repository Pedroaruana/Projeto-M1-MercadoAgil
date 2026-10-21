// Classe principal do serviço. O menu só conversa com ela.
// Todo método público devolve sucesso(dados) ou falha(...erros) de utils/resposta.js.
// Cadastros (clientes, vendedores, produtos, cupons), pedidos e relatórios passam por aqui.
import { Estoque } from '../models/Estoque.js'
import { Pedido } from '../models/Pedido.js'
import { arredondar } from '../utils/dinheiro.js'
import { sucesso, falha } from '../utils/resposta.js'

const soDigitos = (texto) => String(texto ?? '').replace(/\D/g, '')
const mesmoId = (a, b) => String(a) === String(b)

export class Marketplace {
  #clientes = []
  #vendedores = []
  #produtos = []
  #cupons = []
  #pedidos = [] // [{ id, pedido }]
  #estoque
  #proximoIdPedido = 1

  // Dados iniciais opcionais. Os cadastros (issue de CRUD) também usam essas listas.
  constructor({ clientes = [], vendedores = [], produtos = [], cupons = [], estoque = new Estoque() } = {}) {
    this.#clientes = [...clientes]
    this.#vendedores = [...vendedores]
    this.#produtos = [...produtos]
    this.#cupons = [...cupons]
    this.#estoque = estoque
  }

  // Roda a ação e transforma o resultado ou o erro no formato { ok, dados } / { ok, erros }.
  // O programa nunca quebra: erro do Pedido ou do Estoque vira mensagem.
  #executar(acao) {
    try {
      return sucesso(acao())
    } catch (erro) {
      return falha(erro.erros ?? [erro.message])
    }
  }

  #pedidoPorId(id) {
    const registro = this.#pedidos.find((item) => mesmoId(item.id, id))

    if (!registro) {
      throw new Error(`Pedido #${id} não encontrado. Use "Listar pedidos" para ver os números.`)
    }

    return registro.pedido
  }

  #produtoPorId(produtoId) {
    return this.#produtos.find((produto) => mesmoId(produto.id, produtoId))
  }

  // Cria um pedido aberto para o cliente do CPF informado (com ou sem pontuação).
  criarPedido(cpf) {
    return this.#executar(() => {
      if (soDigitos(cpf) === '') {
        throw new Error('Informe o CPF do cliente.')
      }

      const cliente = this.#clientes.find((item) => soDigitos(item.cpf) === soDigitos(cpf))

      if (!cliente) {
        throw new Error('Cliente não encontrado. Cadastre o cliente antes de criar o pedido.')
      }

      const id = this.#proximoIdPedido
      this.#proximoIdPedido += 1
      this.#pedidos = [...this.#pedidos, { id, pedido: new Pedido(cliente) }]

      return { id }
    })
  }

  adicionarItemPedido(id, produtoId, quantidade) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)
      const produto = this.#produtoPorId(produtoId)

      if (!produto) {
        throw new Error(`Produto "${produtoId}" não encontrado.`)
      }

      const item = pedido.adicionarItem(produto, quantidade)

      return { id, produtoId: produto.id, nome: produto.nome, quantidade: item.quantidade }
    })
  }

  removerItemPedido(id, produtoId) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)
      const produto = this.#produtoPorId(produtoId)
      const removido = pedido.removerItem(produto?.id ?? produtoId)

      return { id, produtoId, quantidade: removido.quantidade }
    })
  }

  aplicarCupomPedido(id, codigo) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)
      const procurado = String(codigo ?? '').trim().toUpperCase()
      const cupom = this.#cupons.find((item) => String(item.codigo).toUpperCase() === procurado)

      if (!cupom) {
        throw new Error(`Cupom "${codigo}" não encontrado.`)
      }

      const cupons = pedido.aplicarCupom(cupom)

      return { id, cupons: cupons.map((item) => item.codigo) }
    })
  }

  // Resumo para a tela: valores, itens e tributos. O CPF do cliente nunca sai daqui.
  resumoPedido(id) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)

      return {
        id,
        status: pedido.status,
        cliente: pedido.cliente.nome,
        itens: pedido.itens.map(({ produto, quantidade }) => ({
          produtoId: produto.id,
          nome: produto.nome,
          quantidade,
          preco: produto.preco,
          subtotal: arredondar(produto.preco * quantidade),
        })),
        cupons: pedido.cupons.map((cupom) => cupom.codigo),
        subtotal: pedido.subtotal,
        desconto: pedido.desconto,
        frete: pedido.frete,
        total: pedido.total,
        tributos: pedido.tributos,
      }
    })
  }

  // Confirma o pedido: confere o estoque de todos os itens (tudo ou nada) e dá baixa.
  confirmarPedido(id) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)

      return { id, status: pedido.confirmar(this.#estoque) }
    })
  }

  // Cancela o pedido. Pedido confirmado devolve os itens ao estoque.
  cancelarPedido(id) {
    return this.#executar(() => {
      const pedido = this.#pedidoPorId(id)

      return { id, status: pedido.cancelar(this.#estoque) }
    })
  }

  listarPedidos() {
    return this.#executar(() =>
      this.#pedidos.map(({ id, pedido }) => ({
        id,
        cliente: pedido.cliente.nome,
        status: pedido.status,
        total: pedido.total,
      })),
    )
  }
}
