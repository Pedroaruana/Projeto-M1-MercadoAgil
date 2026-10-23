import { z } from 'zod'
import { REGIOES } from '../config/regras.js'
import { validarCpf } from '../utils/documentos.js'
import { validarDados } from './validarDados.js'

export const clienteSchema = z.object({
  nome: z.string({
    error: 'O nome do cliente deve ser um texto.'
  }).trim().min(1, {
    error: 'O nome do cliente é obrigatório.'
  }),

  email: z.string({
    error: 'O e-mail do cliente deve ser um texto.'
  }).email({
    error: 'O e-mail do cliente é inválido.'
  }),

  cpf: z.string({
    error: 'O CPF deve ser um texto.'
  }).trim().min(1, {
    error: 'O CPF é obrigatório.'
  }).refine(validarCpf, {
    error: 'CPF inválido.'
  }),

  regiao: z.enum(REGIOES, {
    error: 'A região de entrega é inválida.'
  })
}, {
  error: 'Os dados do cliente devem ser um objeto.'
})

export const validarCliente = (dados) => validarDados(clienteSchema, dados)