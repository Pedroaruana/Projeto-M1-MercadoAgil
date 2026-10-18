// Schema Zod do produto.
import { z } from "zod";
import { CATEGORIAS } from "../config/regras.js";

export const produtoSchema = z.object({
    nome: z.string().trim().min(1, { message: "O nome é obrigatório."}),
    preco: z.number({
        error: "O preço deve ser um número"
    }).positive({
        message: "O preço deve ser maior que zero."
    }),
    categoria: z.enum(CATEGORIAS, { message: "Essa categoria é inválida."}),
    vendedorId: z.number({
        error: "O ID do vendedor deve ser um número."
    }).int({
        message: "O ID do vendedor deve ser inteiro."
    }).positive({
        message: "O ID do vendedor deve ser maior que zero."
    })
});
