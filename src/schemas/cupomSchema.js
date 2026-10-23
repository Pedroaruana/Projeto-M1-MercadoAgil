import { z } from 'zod'
import { validarDados } from './validarDados.js'

export const cupomSchema = z.object({
  codigo: z.string({
    error: 'O código do cupom deve ser um texto.'
  }).trim().min(1, {
    error: 'O código do cupom é obrigatório.'
  }),

  tipo: z.enum(['percentual', 'fixo', 'frete'], {
    error: 'O tipo de cupom é inválido.'
  }),

  valor: z.number({
    error: 'O valor do cupom deve ser um número.'
  }).nonnegative({
    error: 'O valor do cupom não pode ser negativo.'
  }),

  validade: z.coerce.date({
    error: 'A validade do cupom deve ser uma data válida.'
  }).refine((data) => data > new Date(), {
    error: 'A validade do cupom deve ser uma data futura.'
  }),

  valorMinimo: z.number({
    error: 'O valor mínimo deve ser um número.'
  }).nonnegative({
    error: 'O valor mínimo do cupom não pode ser negativo.'
  }),

  cumulativo: z.boolean({
    error: 'O campo cumulativo deve ser verdadeiro ou falso.'
  })
}, {
  error: 'Os dados do cupom devem ser um objeto.'
}).refine(
  ({ tipo, valor }) => tipo !== 'percentual' || valor <= 100,
  {
    error: 'O valor de um cupom percentual não pode passar de 100.',
    path: ['valor']
  }
)

export const validarCupom = (dados) => validarDados(cupomSchema, dados)