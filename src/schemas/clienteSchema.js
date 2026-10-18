// Schema Zod do cliente. Validação dos dígitos do CPF prevista pra a issue #13.
import { z } from "zod";
import { REGIOES } from "../config/regras.js";

export const clienteSchema = z.object({
    nome: z.string().trim().min(1, { message: "O nome é obrigatório." }),
    email: z.string().email({ message: "Esse formato de e-mail é inválido."}),
    cpf: z.string().trim().min(1, { message: "O CPF é obrigatório."}),
    regiao: z.enum(REGIOES, { message: "Essa região é inválida."}),
    })
