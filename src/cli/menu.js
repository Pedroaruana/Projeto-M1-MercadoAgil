// Menu principal: só lê do teclado e mostra na tela.
// Cria o Marketplace real, carrega os dados de exemplo e abre as telas.
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { Marketplace } from '../services/Marketplace.js'
import { carregarSeed } from '../data/seed.js'
import { criarServico } from './adaptador.js'
import { executarMenu, titulo } from './ui.js'
import { telaClientes, telaVendedores, telaProdutos, telaCupons } from './telas/cadastros.js'
import { telaPedidos } from './telas/pedidos.js'
import { telaRelatorios } from './telas/relatorios.js'

export const iniciarMenu = async () => {
  const marketplace = new Marketplace()
  const resultado = carregarSeed(marketplace)

  const terminal = createInterface({ input: stdin, output: stdout })
  const perguntar = (texto) => terminal.question(texto)
  const contexto = { servico: criarServico(marketplace), perguntar }

  titulo('Bem-vindo ao MercadoÁgil')

  if (!resultado.ok) {
    console.log(`Não foi possível carregar os dados de exemplo:\n${resultado.erros.join('\n')}`)
  }

  await executarMenu({
    nome: 'MercadoÁgil (0 = sair)',
    perguntar,
    opcoes: [
      { rotulo: 'Clientes', acao: () => telaClientes(contexto) },
      { rotulo: 'Vendedores', acao: () => telaVendedores(contexto) },
      { rotulo: 'Produtos', acao: () => telaProdutos(contexto) },
      { rotulo: 'Cupons', acao: () => telaCupons(contexto) },
      { rotulo: 'Pedidos', acao: () => telaPedidos(contexto) },
      { rotulo: 'Relatórios', acao: () => telaRelatorios(contexto) },
    ],
  })

  console.log('Encerrando o MercadoÁgil...')
  terminal.close()
}
