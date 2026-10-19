// Schema Zod do cliente com validação de CPF
import { z } from "zod";
import { REGIOES } from "../config/regras.js";
import { validarCpf } from "../utils/documentos.js";

export const clienteSchema = z.object({
    nome: z.string().trim().min(1, { message: "O nome é obrigatório." }),
    email: z.string().email({ message: "Esse formato de e-mail é inválido."}),
    cpf: z.string()
        .trim()
        .min(1, { message: "O CPF é obrigatório." })
        .refine(validarCpf, { message: "CPF inválido" }),
    regiao: z.enum(REGIOES, { message: "Essa região é inválida."}),
})
