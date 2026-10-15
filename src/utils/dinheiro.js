// Use arredondar() nas contas para evitar erros como 14.399999
export const arredondar = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100

// 1234.5 -> "R$ 1.234,50"
export const formatarReais = (valor) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
