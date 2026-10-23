import { z } from 'zod'
import { validarCnpj } from '../utils/documentos.js'
import { validarDados } from './validarDados.js'

export const vendedorSchema = z.object({
  nome: z.string({
    error: 'O nome do vendedor deve ser um texto.'
  }).trim().min(1, {
    error: 'O nome do vendedor é obrigatório.'
  }),

  cnpj: z.string({
    error: 'O CNPJ deve ser um texto.'
  }).trim().min(1, {
    error: 'O CNPJ é obrigatório.'
  }).refine(validarCnpj, {
    error: 'CNPJ inválido.'
  }),

  email: z.string({
    error: 'O e-mail do vendedor deve ser um texto.'
  }).email({
    error: 'O e-mail do vendedor é inválido.'
  })
}, {
  error: 'Os dados do vendedor devem ser um objeto.'
})

export const validarVendedor = (dados) => validarDados(vendedorSchema, dados)