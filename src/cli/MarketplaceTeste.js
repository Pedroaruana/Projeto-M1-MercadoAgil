// Simula respostas do serviço para testar o menu.
import { sucesso, falha } from '../utils/resposta.js'

export class MarketplaceTeste {
  listarClientes() {
    return sucesso([
      { id: 1, nome: 'Cliente de teste' }
    ])
  }

  listarVendedores() {
    return falha('Não foi possível listar os vendedores de teste.')
  }
}