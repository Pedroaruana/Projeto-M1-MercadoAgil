// src/cli/telas/relatorios.js
// Relatórios financeiros. O Marketplace já devolve só pedidos CONFIRMADOS;
// aqui só mostramos os números.
import { executarMenu, mostrarResposta, titulo, pegar, reais } from '../ui.js';
import { exibirRelatorioBasico } from '../exibirRelatorioBasico.js';
// Campos que são quantidade/identificação (não são dinheiro).
const NAO_MONETARIOS = [
  'id',
  'posicao',
  'quantidade',
  'qtd',
  'unidades',
  'vendidos',
  'pedidos',
  'vendedorId',
  'produtoId',
  'quantidadeVendida',
];

const comoMoeda = (linha) =>
  Object.fromEntries(
    Object.entries(linha).map(([chave, valor]) => [
      chave,
      typeof valor === 'number' && !NAO_MONETARIOS.includes(chave) ? reais(valor) : valor,
    ]),
  );

// Aceita { eletronicos: 120 } ou [{ categoria, faturamento }] e devolve sempre uma lista.
const paraLinhas = (dados, nomeChave) => {
  if (Array.isArray(dados)) return dados;
  return Object.entries(dados ?? {}).map(([chave, valor]) =>
    typeof valor === 'object' && valor !== null
      ? { [nomeChave]: chave, ...valor }
      : { [nomeChave]: chave, valor },
  );
};

function tabelaMoeda(linhas) {
  if (linhas.length === 0) {
    console.log('Ainda não há dados. Confirme algum pedido primeiro.');
    return;
  }
  console.table(linhas.map(comoMoeda));
}

export function telaRelatorios({ servico, perguntar }) {
  const faturamento = async () => {
    const resposta = await servico.relatorioFaturamento();
    if (!mostrarResposta(resposta)) return;
    const dados = resposta.dados;
    const quantidade = pegar(dados, 'quantidadePedidos', 'quantidade', 'pedidos') ?? 0;

    titulo('Faturamento (somente pedidos confirmados)');
    if (quantidade === 0) {
      console.log('Ainda não há pedidos confirmados. Confirme um pedido para ver o relatório.');
      return;
    }
    exibirRelatorioBasico(dados);
  };

  const porCategoria = async () => {
    const resposta = await servico.relatorioPorCategoria();
    if (!mostrarResposta(resposta)) return;
    titulo('Faturamento por categoria (valor dos itens, antes dos descontos)');
    tabelaMoeda(paraLinhas(resposta.dados, 'categoria'));
  };

  const repasse = async () => {
    const resposta = await servico.relatorioRepasse();
    if (!mostrarResposta(resposta)) return;
    titulo('Repasse por vendedor');
    tabelaMoeda(paraLinhas(resposta.dados, 'vendedor'));
  };

  const top3 = async () => {
    const resposta = await servico.relatorioTop3();
    if (!mostrarResposta(resposta)) return;
    titulo('Top 3 produtos mais vendidos');
    const linhas = paraLinhas(resposta.dados, 'produto')
      .slice(0, 3)
      .map((item, indice) => ({ posicao: `${indice + 1}º`, ...item }));
    tabelaMoeda(linhas);
  };

  const todos = async () => {
    await faturamento();
    await porCategoria();
    await repasse();
    await top3();
  };

  return executarMenu({
    nome: 'Relatórios',
    perguntar,
    opcoes: [
      { rotulo: 'Faturamento, pedidos e ticket médio', acao: faturamento },
      { rotulo: 'Faturamento por categoria', acao: porCategoria },
      { rotulo: 'Repasse por vendedor', acao: repasse },
      { rotulo: 'Top 3 produtos mais vendidos', acao: top3 },
      { rotulo: 'Ver todos', acao: todos },
    ],
  });
}