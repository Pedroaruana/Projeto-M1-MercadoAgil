// Classe principal do serviço. O menu só conversa com ela.
// Todo método público devolve sucesso(dados) ou falha(...erros) de utils/resposta.js.
// Cadastros (clientes, vendedores, produtos, cupons), pedidos e relatórios passam por aqui.
export class Marketplace {
  #clientes = []
  #vendedores = []
  #produtos = []
  #cupons = []
  #pedidos = []
}
