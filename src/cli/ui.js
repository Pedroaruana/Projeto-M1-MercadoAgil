// src/cli/ui.js
// Funções de apoio para o terminal: títulos, tabelas, leitura de dados e menus.
// Aqui NÃO existe regra de negócio, só ler do teclado e mostrar na tela.
import { formatarReais } from '../utils/dinheiro.js';

export const linha = (caractere = '─', tamanho = 52) => caractere.repeat(tamanho);

export function titulo(texto) {
  console.log(`\n${linha('═')}\n  ${texto}\n${linha('═')}`);
}

// Formata dinheiro em R$ (ex.: R$ 1.234,50). Se o valor não for número, mostra "-".
export const reais = (valor) =>
  Number.isFinite(Number(valor)) ? formatarReais(Number(valor)) : '-';

// Devolve o primeiro campo que existir no objeto (aceita nomes alternativos).
export const pegar = (objeto, ...chaves) =>
  chaves.map((chave) => objeto?.[chave]).find((valor) => valor !== undefined);

// Garante que o dado vire uma lista (a busca pode devolver 1 item ou vários).
export const paraLista = (dados) => {
  if (dados === undefined || dados === null) return [];
  return Array.isArray(dados) ? dados : [dados];
};

// Mostra o resultado de uma chamada ao Marketplace.
// Retorna true se deu certo, false se deu erro (e já imprime os erros).
export function mostrarResposta(resposta, mensagemSucesso) {
  if (!resposta || typeof resposta.ok !== 'boolean') {
    console.log('✖ O serviço respondeu num formato inesperado. Avise o grupo responsável pelo Marketplace.');
    return false;
  }
  if (resposta.ok) {
    if (mensagemSucesso) console.log(`✔ ${mensagemSucesso}`);
    return true;
  }
  const erros = Array.isArray(resposta.erros)
    ? resposta.erros
    : [String(resposta.erros ?? 'Erro desconhecido.')];
  console.log(erros.map((erro) => `✖ ${erro}`).join('\n'));
  return false;
}

export function formatarValor(valor) {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (valor === null || valor === undefined) return '-';
  if (valor instanceof Date) return valor.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  if (Array.isArray(valor)) return valor.map((item) => formatarValor(item)).join(', ');
  if (typeof valor === 'object') return JSON.stringify(valor);
  return valor;
}

// Mostra uma lista de objetos como tabela.
// formatadores: { campo: (valor, item) => texto } para campos especiais (ex.: preço em R$).
export function tabela(lista, formatadores = {}) {
  if (!Array.isArray(lista) || lista.length === 0) {
    console.log('Nenhum registro encontrado.');
    return;
  }
  const linhas = lista.map((item) =>
    Object.fromEntries(
      Object.entries(item).map(([chave, valor]) => [
        chave,
        formatadores[chave] ? formatadores[chave](valor, item) : formatarValor(valor),
      ]),
    ),
  );
  console.table(linhas);
}

// ---------- leitura de dados digitados ----------
// Se o texto não for número, devolve o texto original para o Zod recusar com mensagem clara.
export const lerNumero = (texto) => {
  const limpo = String(texto).trim().replace(',', '.');
  const numero = Number(limpo);
  return limpo === '' || Number.isNaN(numero) ? String(texto).trim() : numero;
};

export const lerId = (texto) => {
  const limpo = String(texto).trim();
  return /^\d+$/.test(limpo) ? Number(limpo) : limpo;
};

export const lerSimNao = (texto) => ['s', 'sim', 'y'].includes(String(texto).trim().toLowerCase());

// Aceita 31/12/2027 e converte para 2027-12-31.
export const lerData = (texto) => {
  const limpo = String(texto).trim();
  const partes = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : limpo;
};

export async function confirmar(perguntar, pergunta) {
  return lerSimNao(await perguntar(`${pergunta} (s/n): `));
}

// ---------- menu genérico ----------
// opcoes: [{ rotulo: 'Cadastrar', acao: async () => {...} }]
// O while só mantém o menu aberto (permitido). Opção inválida nunca fecha o programa.
export async function executarMenu({ nome, opcoes, perguntar }) {
  let continuar = true;
  while (continuar) {
    console.log(`\n── ${nome} ──`);
    console.log(opcoes.map((opcao, indice) => `${indice + 1}. ${opcao.rotulo}`).join('\n'));
    console.log('0. Voltar');

    const entrada = (await perguntar('Escolha uma opção: ')).trim();
    const opcao = /^\d+$/.test(entrada) ? opcoes[Number(entrada) - 1] : undefined;

    if (entrada === '0') {
      continuar = false;
    } else if (!opcao) {
      console.log(`✖ Opção inválida: "${entrada}". Digite um número de 0 a ${opcoes.length}.`);
    } else {
      try {
        await opcao.acao();
      } catch (erro) {
        console.log(`✖ Algo inesperado aconteceu (${erro.message}). Tente de novo ou avise o grupo.`);
      }
    }
  }
}