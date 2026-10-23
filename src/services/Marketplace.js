// Classe principal do serviço. O menu só conversa com ela.
// Todo método público devolve sucesso(dados) ou falha(...erros) de utils/resposta.js.
// Cadastros (clientes, vendedores, produtos, cupons), pedidos e relatórios passam por aqui.
import { Estoque } from '../models/Estoque.js'
import { Pedido } from '../models/Pedido.js'
import { arredondar } from '../utils/dinheiro.js'
import { sucesso, falha } from '../utils/resposta.js'
import { Cliente } from '../models/Cliente.js'
import { Vendedor } from '../models/Vendedor.js'
import { Produto } from '../models/Produto.js'
import { CupomDesconto } from '../models/CupomDesconto.js'
import {
  relatorioBasico,
  faturamentoPorCategoria,
  repassePorVendedor,
  top3ProdutosMaisVendidos,
} from './relatorios.js'
import { validarCliente } from '../schemas/clienteSchema.js'
import { validarVendedor } from '../schemas/vendedorSchema.js'
import { validarProduto } from '../schemas/produtoSchema.js'
import { validarCupom } from '../schemas/cupomSchema.js'

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
  #proximoIdCliente = 1
  #proximoIdVendedor = 1
  #proximoIdProduto = 1


  // Dados iniciais opcionais. Os cadastros (issue de CRUD) também usam essas listas.
 constructor({
    clientes = [],
    vendedores = [],
    produtos = [],
    cupons = [],
    estoque = new Estoque()
  } = {}) {
    this.#clientes = [...clientes]
    this.#vendedores = [...vendedores]
    this.#produtos = [...produtos]
    this.#cupons = [...cupons]
    this.#estoque = estoque

    this.#proximoIdCliente = this.#calcularProximoId(clientes)
    this.#proximoIdVendedor = this.#calcularProximoId(vendedores)
    this.#proximoIdProduto = this.#calcularProximoId(produtos)
  }
  #calcularProximoId(lista) {
    return lista.reduce(
      (maior, item) => Math.max(maior, Number(item.id) || 0),
      0
    ) + 1
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
   #clienteSeguro(cliente) {
    const { cpf, ...dadosSeguros } = cliente
    return { ...dadosSeguros }
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

  cadastrarCliente(dados) {
    const validacao = validarCliente(dados)

    if (!validacao.ok) {
      return validacao
    }

    return this.#executar(() => {
      const { nome, email, cpf, regiao } = validacao.dados

      const existente = this.#clientes.find(
        (cliente) => soDigitos(cliente.cpf) === soDigitos(cpf)
      )

      if (existente) {
        throw new Error('Já existe um cliente cadastrado com este CPF.')
      }

      const cliente = new Cliente(
        this.#proximoIdCliente,
        nome,
        email,
        cpf,
        regiao
      )

      this.#clientes = [...this.#clientes, cliente]
      this.#proximoIdCliente += 1

      return this.#clienteSeguro(cliente)
    })
  }

  listarClientes() {
    return this.#executar(() =>
      this.#clientes.map((cliente) => this.#clienteSeguro(cliente))
    )
  }

  excluirCliente(cpf) {
    return this.#executar(() => {
      const indice = this.#clientes.findIndex(
        (cliente) => soDigitos(cliente.cpf) === soDigitos(cpf)
      )

      if (indice === -1) {
        throw new Error('Cliente não encontrado.')
      }

      const cliente = this.#clientes[indice]

      this.#clientes = this.#clientes.filter(
        (_, posicao) => posicao !== indice
      )

      return this.#clienteSeguro(cliente)
    })
  }
  cadastrarVendedor(dados) {
    const entrada = {
      ...dados,
      nome: dados?.nome ?? dados?.nomeLoja
    }

    const validacao = validarVendedor(entrada)

    if (!validacao.ok) {
      return validacao
    }

    return this.#executar(() => {
      const { nome, cnpj, email } = validacao.dados

      const existente = this.#vendedores.find(
        (vendedor) => soDigitos(vendedor.cnpj) === soDigitos(cnpj)
      )

      if (existente) {
        throw new Error('Já existe um vendedor cadastrado com este CNPJ.')
      }

      const vendedor = new Vendedor(
        this.#proximoIdVendedor,
        nome,
        cnpj,
        email
      )

      this.#vendedores = [...this.#vendedores, vendedor]
      this.#proximoIdVendedor += 1

      return { ...vendedor }
    })
  }

  listarVendedores() {
    return this.#executar(() =>
      this.#vendedores.map((vendedor) => ({ ...vendedor }))
    )
  }

  excluirVendedor(cnpj) {
    return this.#executar(() => {
      const indice = this.#vendedores.findIndex(
        (vendedor) => soDigitos(vendedor.cnpj) === soDigitos(cnpj)
      )

      if (indice === -1) {
        throw new Error('Vendedor não encontrado.')
      }

      const vendedor = this.#vendedores[indice]

      this.#vendedores = this.#vendedores.filter(
        (_, posicao) => posicao !== indice
      )

      return { ...vendedor }
    })
  }
  cadastrarProduto(dados) {
    const vendedor = this.#vendedores.find((item) => {
      if (dados?.vendedorId !== undefined) {
        return mesmoId(item.id, dados.vendedorId)
      }

      return (
        typeof dados?.vendedorCnpj === 'string' &&
        soDigitos(item.cnpj) === soDigitos(dados.vendedorCnpj)
      )
    })

    if (!vendedor) {
      return falha(
        'Vendedor não encontrado. Cadastre o vendedor antes do produto.'
      )
    }

    const entrada = {
      ...dados,
      vendedorId: vendedor.id
    }

    const validacao = validarProduto(entrada)

    if (!validacao.ok) {
      return validacao
    }

    const quantidade = dados?.quantidade ?? 0

    if (!Number.isInteger(quantidade) || quantidade < 0) {
      return falha(
        'A quantidade deve ser um número inteiro igual ou maior que zero.'
      )
    }

    return this.#executar(() => {
      const { nome, preco, categoria, vendedorId } = validacao.dados
      const id = this.#proximoIdProduto

      const produto = new Produto(
        id,
        nome,
        preco,
        categoria,
        vendedorId
      )

      const resultadoEstoque = this.#estoque.definirQuantidade(
        id,
        quantidade
      )

      if (!resultadoEstoque.ok) {
        throw { erros: resultadoEstoque.erros }
      }

      this.#produtos = [...this.#produtos, produto]
      this.#proximoIdProduto += 1

      return { ...produto, quantidade }
    })
  }

  listarProdutos() {
    return this.#executar(() =>
      this.#produtos.map((produto) => ({
        ...produto,
        quantidade: this.#estoque.consultar(produto.id).dados.quantidade
      }))
    )
  }

  excluirProduto(id) {
    return this.#executar(() => {
      const indice = this.#produtos.findIndex(
        (produto) => mesmoId(produto.id, id)
      )

      if (indice === -1) {
        throw new Error('Produto não encontrado.')
      }

      const produto = this.#produtos[indice]

      this.#produtos = this.#produtos.filter(
        (_, posicao) => posicao !== indice
      )

      return { ...produto }
    })
  }

  cadastrarCupom(dados) {
    const entrada = {
      ...dados,
      codigo: typeof dados?.codigo === 'string'
        ? dados.codigo.trim().toUpperCase()
        : dados?.codigo
    }

    const validacao = validarCupom(entrada)

    if (!validacao.ok) {
      return validacao
    }

    return this.#executar(() => {
      const {
        codigo,
        tipo,
        valor,
        validade,
        valorMinimo,
        cumulativo
      } = validacao.dados

      const existente = this.#cupons.find(
        (cupom) => cupom.codigo.toUpperCase() === codigo
      )

      if (existente) {
        throw new Error('Já existe um cupom cadastrado com este código.')
      }

      const cupom = new CupomDesconto(
        codigo,
        tipo,
        valor,
        validade,
        valorMinimo,
        cumulativo
      )

      this.#cupons = [...this.#cupons, cupom]

      return { ...cupom, validade: new Date(cupom.validade) }
    })
  }

  listarCupons() {
    return this.#executar(() =>
      this.#cupons.map((cupom) => ({
        ...cupom,
        validade: new Date(cupom.validade)
      }))
    )
  }

  excluirCupom(codigo) {
    return this.#executar(() => {
      const procurado = String(codigo ?? '').trim().toUpperCase()

      const indice = this.#cupons.findIndex(
        (cupom) => cupom.codigo.toUpperCase() === procurado
      )

      if (indice === -1) {
        throw new Error('Cupom não encontrado.')
      }

      const cupom = this.#cupons[indice]

      this.#cupons = this.#cupons.filter(
        (_, posicao) => posicao !== indice
      )

      return { ...cupom, validade: new Date(cupom.validade) }
    })
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

  relatorioFaturamento() {
    return this.#executar(() => {
      const pedidos = this.#pedidos.map(({ pedido }) => pedido)
      return relatorioBasico(pedidos)
    })
  }

  relatorioPorCategoria() {
    return this.#executar(() => {
      const pedidos = this.#pedidos.map(({ pedido }) => pedido)
      return faturamentoPorCategoria(pedidos)
    })
  }

  relatorioRepasse() {
    return this.#executar(() => {
      const pedidos = this.#pedidos.map(({ pedido }) => pedido)
      return repassePorVendedor(pedidos, this.#vendedores)
    })
  }

  relatorioTop3() {
    return this.#executar(() => {
      const pedidos = this.#pedidos.map(({ pedido }) => pedido)
      return top3ProdutosMaisVendidos(pedidos)
    })
  }
}
