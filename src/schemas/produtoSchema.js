import { z } from 'zod'
import { CATEGORIAS } from '../config/regras.js'
import { validarDados } from './validarDados.js'

export const produtoSchema = z.object({
  nome: z.string({
    error: 'O nome do produto deve ser um texto.'
  }).trim().min(1, {
    error: 'O nome do produto é obrigatório.'
  }),

  preco: z.number({
    error: 'O preço deve ser um número.'
  }).positive({
    error: 'O preço deve ser maior que zero.'
  }),

  categoria: z.enum(CATEGORIAS, {
    error: 'A categoria do produto é inválida.'
  }),

  vendedorId: z.number({
    error: 'O ID do vendedor deve ser um número.'
  }).int({
    error: 'O ID do vendedor deve ser inteiro.'
  }).positive({
    error: 'O ID do vendedor deve ser maior que zero.'
  })
}, {
  error: 'Os dados do produto devem ser um objeto.'
})

export const validarProduto = (dados) => validarDados(produtoSchema, dados)