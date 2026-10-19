// src/cli/telas/cadastros.js
// Telas de Clientes, Vendedores, Produtos e Cupons (cadastrar, listar, buscar, excluir).
// Uma configuração por entidade + uma função genérica: sem código repetido.
import {
  executarMenu, mostrarResposta, tabela, paraLista, confirmar,
  lerNumero, lerId, lerSimNao, lerData, reais,
} from '../ui.js';

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const CATEGORIAS = ['eletronicos', 'livros', 'alimentos', 'vestuario', 'casa'];
const TIPOS_CUPOM = ['percentual', 'fixo', 'frete'];

const ENTIDADES = {
  clientes: {
    nome: 'Clientes',
    metodos: { cadastrar: 'cadastrarCliente', listar: 'listarClientes', buscar: 'buscarCliente', excluir: 'excluirCliente' },
    campos: [
      { chave: 'nome', pergunta: 'Nome completo' },
      { chave: 'email', pergunta: 'E-mail' },
      { chave: 'cpf', pergunta: 'CPF', dica: 'só números ou 000.000.000-00' },
      { chave: 'regiao', pergunta: 'Região de entrega', tipo: 'opcao', opcoes: REGIOES },
    ],
    perguntaBusca: 'Digite o CPF ou o nome do cliente',
    perguntaExclusao: 'Digite o CPF do cliente que será excluído',
    mensagemCadastro: 'Cliente cadastrado com sucesso!',
    mensagemExclusao: 'Cliente excluído com sucesso!',
    formatadores: {},
  },
  vendedores: {
    nome: 'Vendedores',
    metodos: { cadastrar: 'cadastrarVendedor', listar: 'listarVendedores', buscar: 'buscarVendedor', excluir: 'excluirVendedor' },
    campos: [
      { chave: 'nomeLoja', pergunta: 'Nome da loja' },
      { chave: 'cnpj', pergunta: 'CNPJ', dica: 'só números ou 00.000.000/0000-00' },
      { chave: 'email', pergunta: 'E-mail' },
    ],
    perguntaBusca: 'Digite o CNPJ ou o nome da loja',
    perguntaExclusao: 'Digite o CNPJ do vendedor que será excluído',
    mensagemCadastro: 'Vendedor cadastrado com sucesso!',
    mensagemExclusao: 'Vendedor excluído com sucesso!',
    formatadores: {},
  },
  produtos: {
    nome: 'Produtos',
    metodos: { cadastrar: 'cadastrarProduto', listar: 'listarProdutos', buscar: 'buscarProduto', excluir: 'excluirProduto' },
    campos: [
      { chave: 'nome', pergunta: 'Nome do produto' },
      { chave: 'preco', pergunta: 'Preço', tipo: 'numero', dica: 'ex.: 120,50' },
      { chave: 'categoria', pergunta: 'Categoria', tipo: 'opcao', opcoes: CATEGORIAS },
      { chave: 'vendedorCnpj', pergunta: 'CNPJ do vendedor que anuncia' },
      { chave: 'quantidade', pergunta: 'Quantidade em estoque', tipo: 'numero', padrao: 0, dica: 'Enter = 0' },
    ],
    perguntaBusca: 'Digite o id ou o nome do produto',
    perguntaExclusao: 'Digite o id do produto que será excluído',
    mensagemCadastro: 'Produto cadastrado com sucesso!',
    mensagemExclusao: 'Produto excluído com sucesso!',
    formatadores: { preco: (valor) => reais(valor) },
    tipoIdExclusao: 'id',
  },
  cupons: {
    nome: 'Cupons',
    metodos: { cadastrar: 'cadastrarCupom', listar: 'listarCupons', buscar: 'buscarCupom', excluir: 'excluirCupom' },
    campos: [
      { chave: 'codigo', pergunta: 'Código do cupom', dica: 'ex.: BEMVINDO10' },
      { chave: 'tipo', pergunta: 'Tipo', tipo: 'opcao', opcoes: TIPOS_CUPOM },
      { chave: 'valor', pergunta: 'Valor', tipo: 'numero', dica: 'percentual: 10 = 10% | fixo: em reais | frete: 0' },
      { chave: 'validade', pergunta: 'Validade', tipo: 'data', dica: 'DD/MM/AAAA' },
      { chave: 'valorMinimo', pergunta: 'Valor mínimo do pedido', tipo: 'numero', padrao: 0, dica: 'Enter = 0' },
      { chave: 'cumulativo', pergunta: 'Pode somar com outro cupom?', tipo: 'simnao', dica: 's/n' },
    ],
    perguntaBusca: 'Digite o código do cupom',
    perguntaExclusao: 'Digite o código do cupom que será excluído',
    mensagemCadastro: 'Cupom cadastrado com sucesso!',
    mensagemExclusao: 'Cupom excluído com sucesso!',
    formatadores: {
      valor: (valor, item) => (item.tipo === 'percentual' ? `${valor}%` : reais(valor)),
      valorMinimo: (valor) => reais(valor),
    },
  },
};

// Pergunta um campo e já converte o texto digitado.
async function perguntarCampo(campo, perguntar) {
  if (campo.tipo === 'opcao') {
    const lista = campo.opcoes.map((opcao, indice) => `${indice + 1}-${opcao}`).join(', ');
    const entrada = (await perguntar(`${campo.pergunta} [${lista}]: `)).trim();
    return (
      campo.opcoes.find((opcao) => opcao.toLowerCase() === entrada.toLowerCase())
      ?? campo.opcoes[Number(entrada) - 1]
      ?? entrada // inválido: o Zod recusa e explica
    );
  }

  const dica = campo.dica ? ` (${campo.dica})` : '';
  const entrada = await perguntar(`${campo.pergunta}${dica}: `);
  if (entrada.trim() === '' && campo.padrao !== undefined) return campo.padrao;

  const leitores = { numero: lerNumero, data: lerData, simnao: lerSimNao, id: lerId };
  return (leitores[campo.tipo] ?? ((texto) => texto.trim()))(entrada);
}

// Pergunta um campo de cada vez, em ordem, montando o objeto com reduce + spread.
const coletarDados = (campos, perguntar) =>
  campos.reduce(async (acumulado, campo) => {
    const dados = await acumulado;
    const valor = await perguntarCampo(campo, perguntar);
    return { ...dados, [campo.chave]: valor };
  }, Promise.resolve({}));

function telaEntidade(config, { servico, perguntar }) {
  const cadastrar = async () => {
    console.log('\nPreencha os dados. Se algum estiver errado, o sistema avisa e você tenta de novo.');
    const dados = await coletarDados(config.campos, perguntar);
    mostrarResposta(await servico[config.metodos.cadastrar](dados), config.mensagemCadastro);
  };

  const listar = async () => {
    const resposta = await servico[config.metodos.listar]();
    if (!mostrarResposta(resposta)) return;
    console.log(`\n${config.nome} cadastrados:`);
    tabela(paraLista(resposta.dados), config.formatadores);
  };

  const buscar = async () => {
    const termo = (await perguntar(`${config.perguntaBusca}: `)).trim();
    if (termo === '') {
      console.log('✖ Digite algo para buscar. Para ver tudo, use a opção "Listar".');
      return;
    }
    const resposta = await servico[config.metodos.buscar](config.tipoIdExclusao === 'id' ? termo : termo);
    if (!mostrarResposta(resposta)) return;
    tabela(paraLista(resposta.dados), config.formatadores);
  };

  const excluir = async () => {
    const entrada = (await perguntar(`${config.perguntaExclusao}: `)).trim();
    if (entrada === '') {
      console.log('✖ Você não digitou nada. Use "Listar" para ver o que pode ser excluído.');
      return;
    }
    if (!(await confirmar(perguntar, `Tem certeza que deseja excluir "${entrada}"?`))) {
      console.log('Exclusão cancelada. Nada foi apagado.');
      return;
    }
    const identificador = config.tipoIdExclusao === 'id' ? lerId(entrada) : entrada;
    mostrarResposta(await servico[config.metodos.excluir](identificador), config.mensagemExclusao);
  };

  return executarMenu({
    nome: config.nome,
    perguntar,
    opcoes: [
      { rotulo: 'Cadastrar', acao: cadastrar },
      { rotulo: 'Listar', acao: listar },
      { rotulo: 'Buscar', acao: buscar },
      { rotulo: 'Excluir', acao: excluir },
    ],
  });
}

export const telaClientes = (contexto) => telaEntidade(ENTIDADES.clientes, contexto);
export const telaVendedores = (contexto) => telaEntidade(ENTIDADES.vendedores, contexto);
export const telaProdutos = (contexto) => telaEntidade(ENTIDADES.produtos, contexto);
export const telaCupons = (contexto) => telaEntidade(ENTIDADES.cupons, contexto);

// Opcional: um submenu "Cadastros" que reúne as quatro telas.
export const telaCadastros = (contexto) =>
  executarMenu({
    nome: 'Cadastros',
    perguntar: contexto.perguntar,
    opcoes: [
      { rotulo: 'Clientes', acao: () => telaClientes(contexto) },
      { rotulo: 'Vendedores', acao: () => telaVendedores(contexto) },
      { rotulo: 'Produtos', acao: () => telaProdutos(contexto) },
      { rotulo: 'Cupons', acao: () => telaCupons(contexto) },
    ],
  });