// src/cli/dev/testeTelas.js
// Roda as telas com o Marketplace de mentira: node src/cli/dev/testeTelas.js
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { executarMenu } from '../ui.js';
import { criarServico } from '../adaptador.js';
import { criarMarketplaceMock } from './marketplaceMock.js';
import { telaClientes, telaVendedores, telaProdutos, telaCupons } from '../telas/cadastros.js';
import { telaPedidos } from '../telas/pedidos.js';
import { telaRelatorios } from '../telas/relatorios.js';

const rl = readline.createInterface({ input, output });
const perguntar = (texto) => rl.question(texto);
const contexto = { servico: criarServico(criarMarketplaceMock()), perguntar };

await executarMenu({
  nome: 'TESTE DAS TELAS (dados de mentira)',
  perguntar,
  opcoes: [
    { rotulo: 'Clientes', acao: () => telaClientes(contexto) },
    { rotulo: 'Vendedores', acao: () => telaVendedores(contexto) },
    { rotulo: 'Produtos', acao: () => telaProdutos(contexto) },
    { rotulo: 'Cupons', acao: () => telaCupons(contexto) },
    { rotulo: 'Pedidos', acao: () => telaPedidos(contexto) },
    { rotulo: 'Relatórios', acao: () => telaRelatorios(contexto) },
  ],
});

rl.close();