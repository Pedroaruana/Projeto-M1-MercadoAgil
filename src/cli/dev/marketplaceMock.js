// src/cli/dev/marketplaceMock.js
// Marketplace FALSO só para testar as telas enquanto o real não chega.
// As contas aqui são simplificadas de propósito. As de verdade são do grupo Azul.
const ok = (dados) => ({ ok: true, dados });
const erro = (...erros) => ({ ok: false, erros });
const semCpf = ({ cpf, ...resto }) => resto; // LGPD: tira o CPF antes de devolver

export function criarMarketplaceMock() {
  const banco = {
    clientes: [{ nome: 'Ana Souza', email: 'ana@email.com', cpf: '11144477735', regiao: 'Nordeste' }],
    vendedores: [
      { nomeLoja: 'TechBahia', cnpj: '11222333000181', email: 'tech@bahia.com' },
      { nomeLoja: 'Livraria Sol', cnpj: '22333444000172', email: 'sol@livraria.com' },
    ],
    produtos: [
      { id: 1, nome: 'Mouse', preco: 120, categoria: 'eletronicos', vendedorCnpj: '11222333000181', quantidade: 10 },
      { id: 2, nome: 'Livro de JavaScript', preco: 80, categoria: 'livros', vendedorCnpj: '22333444000172', quantidade: 10 },
    ],
    cupons: [
      { codigo: 'BEMVINDO10', tipo: 'percentual', valor: 10, validade: '2027-12-31', valorMinimo: 0, cumulativo: true },
      { codigo: 'PDA15', tipo: 'fixo', valor: 15, validade: '2027-12-31', valorMinimo: 0, cumulativo: true },
      { codigo: 'FRETEZERO', tipo: 'frete', valor: 0, validade: '2027-12-31', valorMinimo: 0, cumulativo: true },
    ],
    pedidos: [],
  };

  const cadastrar = (tabela, obrigatorios, dados, extra = {}) => {
    const faltando = obrigatorios.filter((campo) => dados[campo] === undefined || dados[campo] === '');
    if (faltando.length > 0) return erro(...faltando.map((campo) => `O campo "${campo}" é obrigatório.`));
    banco[tabela] = [...banco[tabela], { ...extra, ...dados }];
    return ok(semCpf({ ...extra, ...dados }));
  };

  const buscar = (tabela, campos, termo) => {
    const achados = banco[tabela].filter((item) =>
      campos.some((campo) => String(item[campo]).toLowerCase().includes(String(termo).toLowerCase())),
    );
    return achados.length === 0 ? erro(`Nada encontrado para "${termo}".`) : ok(achados.map(semCpf));
  };

  const excluir = (tabela, campo, valor) => {
    const existe = banco[tabela].find((item) => String(item[campo]) === String(valor));
    if (!existe) return erro(`Não encontrei "${valor}". Use "Listar" para conferir.`);
    banco[tabela] = banco[tabela].filter((item) => String(item[campo]) !== String(valor));
    return ok({ removido: valor });
  };

  const atualizarPedido = (id, funcao) => {
    banco.pedidos = banco.pedidos.map((pedido) => (pedido.id === id ? funcao(pedido) : pedido));
  };

  const calcularResumo = (pedido) => {
    const itens = pedido.itens.map(({ produtoId, quantidade }) => {
      const produto = banco.produtos.find((p) => p.id === produtoId);
      return { nome: produto.nome, quantidade, preco: produto.preco, subtotal: produto.preco * quantidade, categoria: produto.categoria };
    });
    const subtotal = itens.reduce((soma, item) => soma + item.subtotal, 0);
    const unidades = itens.reduce((soma, item) => soma + item.quantidade, 0);
    const descontos = (pedido.cupons.includes('BEMVINDO10') ? subtotal * 0.1 : 0) + (pedido.cupons.includes('PDA15') ? 15 : 0);
    const frete = pedido.cupons.includes('FRETEZERO') ? 0 : 25 + 1.5 * unidades;
    const tributos = itens.reduce((soma, item) => soma + (item.categoria === 'eletronicos' ? item.subtotal * 0.12 : 0), 0);
    return { id: pedido.id, status: pedido.status, cliente: pedido.cliente, itens, cupons: pedido.cupons, subtotal, descontos, frete, total: subtotal - descontos + frete, tributos };
  };

  const comPedidoAberto = (id, funcao) => {
    const pedido = banco.pedidos.find((p) => p.id === id);
    if (!pedido) return erro(`Pedido #${id} não existe. Use "Listar pedidos".`);
    if (pedido.status !== 'aberto') return erro(`O pedido #${id} está ${pedido.status} e não aceita mudanças.`);
    return funcao(pedido);
  };

  return {
    // clientes
    cadastrarCliente: (dados) => cadastrar('clientes', ['nome', 'email', 'cpf', 'regiao'], dados),
    listarClientes: () => ok(banco.clientes.map(semCpf)),
    buscarCliente: (termo) => buscar('clientes', ['cpf', 'nome'], termo),
    excluirCliente: (cpf) => excluir('clientes', 'cpf', cpf),
    // vendedores
    cadastrarVendedor: (dados) => cadastrar('vendedores', ['nomeLoja', 'cnpj', 'email'], dados),
    listarVendedores: () => ok(banco.vendedores),
    buscarVendedor: (termo) => buscar('vendedores', ['cnpj', 'nomeLoja'], termo),
    excluirVendedor: (cnpj) => excluir('vendedores', 'cnpj', cnpj),
    // produtos
    cadastrarProduto: (dados) =>
      typeof dados.preco !== 'number'
        ? erro('O preço precisa ser um número (ex.: 120,50).')
        : cadastrar('produtos', ['nome', 'categoria', 'vendedorCnpj'], dados, { id: Math.max(0, ...banco.produtos.map((p) => p.id)) + 1 }),
    listarProdutos: () => ok(banco.produtos),
    buscarProduto: (termo) => buscar('produtos', ['id', 'nome'], termo),
    excluirProduto: (id) => excluir('produtos', 'id', id),
    // cupons
    cadastrarCupom: (dados) => cadastrar('cupons', ['codigo', 'tipo', 'validade'], dados),
    listarCupons: () => ok(banco.cupons),
    buscarCupom: (termo) => buscar('cupons', ['codigo'], termo),
    excluirCupom: (codigo) => excluir('cupons', 'codigo', codigo),
    // pedidos
    criarPedido: (cpf) => {
      const cliente = banco.clientes.find((c) => c.cpf.replace(/\D/g, '') === String(cpf).replace(/\D/g, ''));
      if (!cliente) return erro('Cliente não encontrado. Cadastre o cliente antes de criar o pedido.');
      const pedido = { id: banco.pedidos.length + 1, cliente: { nome: cliente.nome }, itens: [], cupons: [], status: 'aberto' };
      banco.pedidos = [...banco.pedidos, pedido];
      return ok({ id: pedido.id });
    },
    adicionarItemPedido: (id, idProduto, quantidade) =>
      comPedidoAberto(id, () => {
        if (!banco.produtos.some((p) => p.id === idProduto)) return erro(`Produto "${idProduto}" não existe.`);
        if (typeof quantidade !== 'number' || quantidade <= 0) return erro('A quantidade precisa ser um número maior que zero.');
        atualizarPedido(id, (p) => ({ ...p, itens: [...p.itens, { produtoId: idProduto, quantidade }] }));
        return ok({ id });
      }),
    removerItemPedido: (id, idProduto) =>
      comPedidoAberto(id, (pedido) => {
        if (!pedido.itens.some((i) => i.produtoId === idProduto)) return erro('Esse produto não está no pedido.');
        atualizarPedido(id, (p) => ({ ...p, itens: p.itens.filter((i) => i.produtoId !== idProduto) }));
        return ok({ id });
      }),
    aplicarCupomPedido: (id, codigo) =>
      comPedidoAberto(id, (pedido) => {
        if (!banco.cupons.some((c) => c.codigo === codigo)) return erro(`Cupom "${codigo}" não existe.`);
        if (pedido.cupons.includes(codigo)) return erro('Esse cupom já foi aplicado neste pedido.');
        if (pedido.cupons.length >= 2) return erro('Máximo de 2 cupons por pedido.');
        atualizarPedido(id, (p) => ({ ...p, cupons: [...p.cupons, codigo] }));
        return ok({ id });
      }),
    resumoPedido: (id) => {
      const pedido = banco.pedidos.find((p) => p.id === id);
      return pedido ? ok(calcularResumo(pedido)) : erro(`Pedido #${id} não existe.`);
    },
    confirmarPedido: (id) =>
      comPedidoAberto(id, (pedido) => {
        if (pedido.itens.length === 0) return erro('O pedido está vazio. Adicione itens antes de confirmar.');
        atualizarPedido(id, (p) => ({ ...p, status: 'confirmado' }));
        return ok({ id });
      }),
    cancelarPedido: (id) => {
      const pedido = banco.pedidos.find((p) => p.id === id);
      if (!pedido) return erro(`Pedido #${id} não existe.`);
      if (pedido.status === 'cancelado') return erro(`O pedido #${id} já está cancelado.`);
      atualizarPedido(id, (p) => ({ ...p, status: 'cancelado' }));
      return ok({ id });
    },
    listarPedidos: () => ok(banco.pedidos.map((p) => ({ id: p.id, cliente: p.cliente, status: p.status, total: calcularResumo(p).total }))),
    // relatórios (valores fixos do exemplo do descritivo)
    relatorioFaturamento: () => ok({ quantidadePedidos: 1, faturamentoTotal: 193, ticketMedio: 193, totalDescontos: 35, totalTributos: 14.4, totalComissao: 21.6 }),
    relatorioPorCategoria: () => ok({ eletronicos: 120, livros: 80 }),
    relatorioRepasse: () => ok([
      { vendedor: 'TechBahia', bruto: 120, comissao: 9.6, repasse: 110.4 },
      { vendedor: 'Livraria Sol', bruto: 80, comissao: 12, repasse: 68 },
    ]),
    relatorioTop3: () => ok([{ nome: 'Mouse', quantidade: 1 }, { nome: 'Livro de JavaScript', quantidade: 1 }]),
  };
}