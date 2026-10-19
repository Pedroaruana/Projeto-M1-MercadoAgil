// src/cli/telas/pedidos.js
// Telas de Pedidos: criar, adicionar/remover item, aplicar cupom, resumo,
// confirmar, cancelar e listar. Todas as contas vêm do Marketplace.
import {
  executarMenu, mostrarResposta, tabela, titulo, paraLista, pegar, confirmar,
  lerId, lerNumero, reais,
} from '../ui.js';

const nomeDoCliente = (cliente) =>
  (typeof cliente === 'object' && cliente !== null ? pegar(cliente, 'nome') : cliente) ?? '-';

const nomeDoCupom = (cupom) => (typeof cupom === 'string' ? cupom : pegar(cupom, 'codigo') ?? '-');

const linhaValor = (rotulo, valor) => console.log(`${rotulo.padEnd(36)}${String(valor).padStart(14)}`);

// Mostra o resumo: subtotal, descontos, frete, total e tributos aproximados.
function mostrarResumo(pedido) {
  const itens = paraLista(pegar(pedido, 'itens'));
  const cupons = paraLista(pegar(pedido, 'cupons'));

  titulo(`Resumo do pedido #${pegar(pedido, 'id', 'numero') ?? '?'}`);
  console.log(`Status:  ${String(pegar(pedido, 'status') ?? '-').toUpperCase()}`);
  console.log(`Cliente: ${nomeDoCliente(pegar(pedido, 'cliente'))}`);

  console.log('\nItens:');
  if (itens.length === 0) {
    console.log('  (nenhum item ainda. Use "Adicionar item" no menu de pedidos)');
  } else {
    console.table(
      itens.map((item) => {
        const subtotal = pegar(item, 'subtotal');
        return {
          produto: pegar(item, 'nome') ?? pegar(item.produto, 'nome') ?? '-',
          quantidade: pegar(item, 'quantidade', 'qtd') ?? '-',
          preco: reais(pegar(item, 'preco', 'precoUnitario') ?? pegar(item.produto, 'preco')),
          subtotal: subtotal === undefined ? '-' : reais(subtotal),
        };
      }),
    );
  }

  console.log(`Cupons aplicados: ${cupons.length === 0 ? 'nenhum' : cupons.map(nomeDoCupom).join(', ')}\n`);

  linhaValor('Subtotal', reais(pegar(pedido, 'subtotal')));
  linhaValor('(-) Descontos', `- ${reais(pegar(pedido, 'descontos', 'desconto', 'descontoTotal') ?? 0)}`);
  linhaValor('(+) Frete', `+ ${reais(pegar(pedido, 'frete') ?? 0)}`);
  console.log(`${'─'.repeat(50)}`);
  linhaValor('TOTAL', reais(pegar(pedido, 'total')));
  console.log(`\nTributos aproximados (só informativo, não soma no total): ${reais(pegar(pedido, 'tributos', 'tributosAproximados') ?? 0)}`);
}

export async function telaPedidos({ servico, perguntar }) {
  // Guarda o último pedido usado para você não precisar digitar o número toda hora.
  let pedidoAtual = null;

  const pedirIdPedido = async () => {
    const dica = pedidoAtual !== null ? ` [Enter = #${pedidoAtual}]` : '';
       const entrada = (await perguntar(`Qual o NÚMERO do pedido (ex.: 1)${dica}: `)).trim();
    if (entrada === '' && pedidoAtual !== null) return pedidoAtual;
    if (entrada === '') {
      console.log('✖ Informe o número do pedido. Dica: use "Listar pedidos" para ver os números.');
      return null;
    }
    return lerId(entrada);
  };

  const comPedido = async (acao) => {
    const id = await pedirIdPedido();
    if (id !== null) await acao(id);
  };

  const criar = async () => {
    const cpf = (await perguntar('CPF do cliente que está comprando: ')).trim();
    if (cpf === '') {
      console.log('✖ Digite o CPF de um cliente cadastrado. Cadastre em "Clientes" se ainda não existir.');
      return;
    }
    const resposta = await servico.criarPedido(cpf);
    if (!mostrarResposta(resposta)) return;
    pedidoAtual = pegar(resposta.dados, 'id', 'numero') ?? pedidoAtual;
    console.log(`✔ Pedido #${pedidoAtual} criado. Agora use "Adicionar item".`);
  };

  const adicionarItem = () =>
    comPedido(async (id) => {
      const catalogo = await servico.listarProdutos();
      if (catalogo?.ok) {
        console.log('\nProdutos disponíveis:');
        tabela(
          paraLista(catalogo.dados).map(({ id: idProduto, nome, categoria, preco }) => ({ id: idProduto, nome, categoria, preco })),
          { preco: (valor) => reais(valor) },
        );
      }
      const idProduto = lerId(await perguntar('ID do produto: '));
      const quantidade = lerNumero(await perguntar('Quantidade: '));
      const resposta = await servico.adicionarItemPedido(id, idProduto, quantidade);
      if (mostrarResposta(resposta, `Item adicionado ao pedido #${id}. Use "Ver resumo" para conferir os valores.`)) {
        pedidoAtual = id;
      }
    });

  const removerItem = () =>
    comPedido(async (id) => {
      const idProduto = lerId(await perguntar('ID do produto a remover: '));
      const resposta = await servico.removerItemPedido(id, idProduto);
      if (mostrarResposta(resposta, `Item removido do pedido #${id}.`)) pedidoAtual = id;
    });

  const aplicarCupom = () =>
    comPedido(async (id) => {
      const codigo = (await perguntar('Código do cupom: ')).trim().toUpperCase();
      if (codigo === '') {
        console.log('✖ Digite o código do cupom (ex.: BEMVINDO10). Veja os cupons em "Cupons > Listar".');
        return;
      }
      const resposta = await servico.aplicarCupomPedido(id, codigo);
      if (mostrarResposta(resposta, `Cupom ${codigo} aplicado ao pedido #${id}. Veja o efeito em "Ver resumo".`)) {
        pedidoAtual = id;
      }
    });

  const verResumo = () =>
    comPedido(async (id) => {
      const resposta = await servico.resumoPedido(id);
      if (mostrarResposta(resposta)) {
        pedidoAtual = id;
        mostrarResumo(resposta.dados);
      }
    });

  const confirmarPedido = () =>
    comPedido(async (id) => {
      const resposta = await servico.confirmarPedido(id);
      if (mostrarResposta(resposta, `Pedido #${id} confirmado! O estoque foi atualizado.`)) pedidoAtual = id;
    });

  const cancelarPedido = () =>
    comPedido(async (id) => {
      if (!(await confirmar(perguntar, `Cancelar o pedido #${id}?`))) {
        console.log('Cancelamento desfeito. O pedido continua como estava.');
        return;
      }
      mostrarResposta(await servico.cancelarPedido(id), `Pedido #${id} cancelado.`);
    });

  const listarPedidos = async () => {
    const resposta = await servico.listarPedidos();
    if (!mostrarResposta(resposta)) return;
    const pedidos = paraLista(resposta.dados);
    if (pedidos.length === 0) {
      console.log('Nenhum pedido ainda. Use "Criar pedido" para começar.');
      return;
    }
    console.table(
      pedidos.map((pedido) => ({
        pedido: `#${pegar(pedido, 'id', 'numero') ?? '?'}`,
        cliente: nomeDoCliente(pegar(pedido, 'cliente')),
        status: pegar(pedido, 'status') ?? '-',
        total: reais(pegar(pedido, 'total')),
      })),
    );
  };

  return executarMenu({
    nome: 'Pedidos',
    perguntar,
    opcoes: [
      { rotulo: 'Criar pedido', acao: criar },
      { rotulo: 'Adicionar item', acao: adicionarItem },
      { rotulo: 'Remover item', acao: removerItem },
      { rotulo: 'Aplicar cupom', acao: aplicarCupom },
      { rotulo: 'Ver resumo', acao: verResumo },
      { rotulo: 'Confirmar pedido', acao: confirmarPedido },
      { rotulo: 'Cancelar pedido', acao: cancelarPedido },
      { rotulo: 'Listar pedidos', acao: listarPedidos },
    ],
  });
}