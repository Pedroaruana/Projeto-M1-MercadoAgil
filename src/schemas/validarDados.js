js
import { sucesso, falha } from '../utils/resposta.js'

export function validarDados(schema, dados) {
  const resultado = schema.safeParse(dados)

  if (resultado.success) {
    return sucesso(resultado.data)
  }

  const erros = resultado.error.issues.map(({ message }) => message)

  return falha(erros)
}