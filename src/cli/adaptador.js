// src/cli/adaptador.js
// Liga o menu ao Marketplace. Se o nome de um método for diferente no Marketplace
// real, mude SÓ o lado direito da tabela abaixo. Nenhuma outra tela precisa mudar.

const NOMES = {
  // clientes
  cadastrarCliente: 'cadastrarCliente',
  listarClientes: 'listarClientes',
  buscarCliente: 'buscarCliente',
  excluirCliente: 'excluirCliente',
  // vendedores
  cadastrarVendedor: 'cadastrarVendedor',
  listarVendedores: 'listarVendedores',
  buscarVendedor: 'buscarVendedor',
  excluirVendedor: 'excluirVendedor',
  // produtos
  cadastrarProduto: 'cadastrarProduto',
  listarProdutos: 'listarProdutos',
  buscarProduto: 'buscarProduto',
  excluirProduto: 'excluirProduto',
  // cupons
  cadastrarCupom: 'cadastrarCupom',
  listarCupons: 'listarCupons',
  buscarCupom: 'buscarCupom',
  excluirCupom: 'excluirCupom',
  // pedidos
  criarPedido: 'criarPedido',
  adicionarItemPedido: 'adicionarItemPedido',
  removerItemPedido: 'removerItemPedido',
  aplicarCupomPedido: 'aplicarCupomPedido',
  resumoPedido: 'resumoPedido',
  confirmarPedido: 'confirmarPedido',
  cancelarPedido: 'cancelarPedido',
  listarPedidos: 'listarPedidos',
  historicoCliente: 'historicoCliente',
  // relatórios
  relatorioFaturamento: 'relatorioFaturamento',
  relatorioPorCategoria: 'relatorioPorCategoria',
  relatorioRepasse: 'relatorioRepasse',
  relatorioTop3: 'relatorioTop3',
  produtosEstoqueBaixo: 'produtosEstoqueBaixo',
};

export function criarServico(marketplace) {
  const chamar = async (chave, ...argumentos) => {
    const nome = NOMES[chave];
    const metodo = marketplace?.[nome];

    // Método ainda não existe (outro grupo não terminou): avisa em vez de quebrar.
    if (typeof metodo !== 'function') {
      return {
        ok: false,
        erros: [`O Marketplace ainda não tem o método "${nome}". Rode "git pull origin main" ou avise o grupo responsável.`],
      };
    }

    try {
      return await metodo.apply(marketplace, argumentos);
    } catch (erro) {
      return { ok: false, erros: [`Erro inesperado em "${nome}": ${erro.message}. Avise o grupo responsável.`] };
    }
  };

  // Monta { cadastrarCliente: (...args) => chamar('cadastrarCliente', ...args), ... }
  return Object.fromEntries(
    Object.keys(NOMES).map((chave) => [chave, (...argumentos) => chamar(chave, ...argumentos)]),
  );
}