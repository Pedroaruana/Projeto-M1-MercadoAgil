// Schema Zod do cupom. Validação de data futura prevista para ser criada na issue #14.
import { z } from "zod";

export const cupomSchema = z.object({
    codigo: z.string().trim().min(1, { message: "O codigo do cupom é obrigatório."}),
    tipo: z.enum(["percentual", "fixo", "frete"], { message: "O tipo de cupom é inválido."}),
    valor: z.number({
        error: "O valor do cupom deve ser um número."
    }).nonnegative({
        message: "O valor do cupom não pode ser negativo."
    }),
    validade: z.coerce.date({
        error: "A validade do cupom deve ser uma data válida."
    }),
    valorMinimo: z.number({
        error: "O valor mínimo deve ser um número."
    }).nonnegative({
        message: "O valor mínimo não pode ser negativo."
    }),

    cumulativo: z.boolean({
        error: "O campo cumulativo deve ser verdadeiro ou falso."
    })
});
