// Schema Zod do vendedor. Validação dos dígitos do CNPJ prevista para issue #13.
import { z } from "zod";

export const vendedorSchema = z.object({
    nome: z.string().trim().min(1, { message: "O nome é obrigatório."}),
    cnpj: z.string().trim().min(1, { message: "O CNPJ é obrigatório."}),
    email: z.string().email({ message: "Esse formato de e-mail é inválido."}),
})