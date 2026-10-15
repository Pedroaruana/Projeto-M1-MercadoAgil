// Todas as regras de negócio em um só lugar. Mudou a regra, muda aqui.

// Frete = taxa da região + FRETE_POR_UNIDADE por unidade de produto
export const FRETE_POR_REGIAO = {
  Norte: 35,
  Nordeste: 25,
  'Centro-Oeste': 30,
  Sudeste: 20,
  Sul: 22,
}
export const FRETE_POR_UNIDADE = 1.5
// Frete grátis quando o valor já com descontos chega a este valor
export const FRETE_GRATIS_A_PARTIR_DE = 300

// Tributos aproximados (informativo, não soma no total). Base: itens antes dos descontos
export const ALIQUOTAS_TRIBUTOS = {
  eletronicos: 0.12,
  livros: 0,
  alimentos: 0.05,
  vestuario: 0.08,
  casa: 0.1,
}

// Comissão do marketplace por categoria. Base: itens antes dos descontos
export const COMISSOES = {
  eletronicos: 0.08,
  livros: 0.15,
  alimentos: 0.1,
  vestuario: 0.12,
  casa: 0.1,
}

export const CATEGORIAS = Object.keys(COMISSOES)
export const REGIOES = Object.keys(FRETE_POR_REGIAO)

// Cupons
export const MAX_CUPONS_POR_PEDIDO = 2
// Soma dos descontos nunca passa de 30% do subtotal
export const TETO_DESCONTO = 0.3
// Ordem de aplicação dos cupons: primeiro percentual, depois fixo, por último frete
export const ORDEM_CUPONS = ['percentual', 'fixo', 'frete']

export const STATUS_PEDIDO = {
  ABERTO: 'aberto',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
}
