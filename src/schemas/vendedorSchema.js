// Schema Zod do vendedor com validação de CNPJ
import { z } from "zod";
import { validarCnpj } from "../utils/documentos.js";

export const vendedorSchema = z.object({
    nome: z.string().trim().min(1, { message: "O nome é obrigatório."}),
    cnpj: z.string()
        .trim()
        .min(1, { message: "O CNPJ é obrigatório."})
        .refine(validarCnpj, { message: "CNPJ inválido" }),
    email: z.string().email({ message: "Esse formato de e-mail é inválido."}),
})
