import { MarketplaceTeste } from './MarketplaceTeste.js'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
//createInterface: cria a comunicação com o terminal.
//stdin: entrada — o que você digita.
//stdout: saída — o que aparece na tela.

export const iniciarMenu = async () => {
  // Cria o serviço de teste usado pelo menu.
  const marketplace = new MarketplaceTeste()
  const terminal = createInterface({
    input: stdin,
    output: stdout
  });

  console.log(' ===== ♥ Bem Vindo ao MercadoÁgil ♥ =====');

  let opcao = ''

  while (opcao !== '0') {
    try {
      // try - Tenta executar esta rodada do menu.
      //let permite atualizar a variável a cada resposta.
      //!== significa “diferente em valor ou tipo”.
      //'0' está entre aspas porque a leitura do teclado devolve texto.

      console.log('1 - Clientes');
      console.log('2 - Vendedores');
      console.log('3 - Produtos');
      console.log('4 - Cupons');
      console.log('5 - Pedidos');
      console.log('6 - Relatórios');
      console.log('0 - Sair ');

      opcao = await terminal.question('Escolha somente uma opção: ');

      if (opcao === '0') {
          console.log('Encerrando o MercadoÁgil...')
        } else if (opcao === '1') {
          const resposta = await marketplace.listarClientes()

          if (resposta.ok) {
            console.table(resposta.dados)
          } else {
            console.log(resposta.erros.join('\n'))
          }
        } else if (opcao === '2') {
          const resposta = await marketplace.listarVendedores()

          if (resposta.ok) {
            console.table(resposta.dados)
          } else {
            console.log(resposta.erros.join('\n'))
          }
        } else if (['3', '4', '5', '6'].includes(opcao)) {
          console.log('Você escolheu:', opcao)
        } else {
          console.log('Opção inválida. Digite um número de 0 a 6.')
        }

      //if: se a condição for verdadeira, executa aquele bloco.
      //else if: verifica outra condição.
      //includes(opcao): verifica se o texto digitado está na lista.
      // === (igual)
      //else: atende os demais casos, incluindo 7, letras e Enter vazio.
    } catch (erro) {
      console.log('Não foi possível concluir a operação:', erro.message)
      // Catch - Captura um erro ocorrido no try para tratá-lo.

      if (terminal.closed) {
        break
        //if (terminal.closed) --  Verifica se a leitura do terminal já foi encerrada.
        // break - Sai do while para não tentar ler de um terminal fechado.
      }
    }
  }

  terminal.close();
  //question() mostra a pergunta.
  //await espera você digitar e apertar Enter.
  //opcao guarda o texto digitado.
  //terminal.close() encerra a leitura, permitindo finalizar o programa.
}