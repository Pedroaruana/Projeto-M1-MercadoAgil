// Guarda a quantidade de cada produto. Verifica, dá baixa e devolve.
// Verificação é tudo ou nada e lista todos os itens em falta.
/**
 * Controla a quantidade disponível de cada produto.
 *
 * AVISO PARA O AZUL (quem usa esta classe):
 * - Cada item do pedido tem `produtoId` e `quantidade`. O `nome` é opcional
 *   e serve só para a mensagem de falta: sem ele, a mensagem mostra o ID.
 * - O estoque identifica o produto SÓ pelo `produtoId` (nunca pelo nome).
 * - Itens repetidos com o mesmo `produtoId` no mesmo pedido são SOMADOS
 *   antes de verificar. Ex.: 2 linhas de 3 unidades viram 1 item de 6.
 * - O `produtoId` é comparado como texto, então 1 e "1" são o mesmo produto.
 * - Mensagem de falta: "Estoque insuficiente: Mouse (pedido 3, disponível 1)".
 * - Todo método devolve `{ ok, dados }` ou `{ ok, erros }`.
 */
export class Estoque {
  #quantidades = new Map();

  definirQuantidade(produtoId, quantidade) {
    if (!this.#idValido(produtoId) || !Number.isInteger(quantidade) || quantidade < 0) {
      return {
        ok: false,
        erros: [
          "Produto inválido ou quantidade inválida. Use um ID e uma quantidade inteira igual ou maior que zero.",
        ],
      };
    }

    this.#quantidades.set(this.#chave(produtoId), quantidade);

    return {
      ok: true,
      dados: { produtoId, quantidade },
    };
  }

  verificar(itens) {
    const resultado = this.#normalizarItens(itens);

    if (!resultado.ok) {
      return resultado;
    }

    const itensComDisponivel = resultado.dados.map((item) => ({
      ...item,
      disponivel: this.#disponivel(item.produtoId),
    }));

    // Lista TODOS os itens em falta, não só o primeiro.
    const erros = itensComDisponivel
      .filter((item) => item.quantidade > item.disponivel)
      .map(
        (item) =>
          `Estoque insuficiente: ${item.nome ?? item.produtoId} (pedido ${item.quantidade}, disponível ${item.disponivel})`,
      );

    if (erros.length > 0) {
      return { ok: false, erros };
    }

    return {
      ok: true,
      dados: { itens: itensComDisponivel },
    };
  }

  baixar(itens) {
    const resultado = this.verificar(itens);

    // Se qualquer item estiver em falta, nada é baixado.
    if (!resultado.ok) {
      return resultado;
    }

    return this.#aplicar(resultado.dados.itens, -1);
  }

  devolver(itens) {
    const resultado = this.#normalizarItens(itens);

    if (!resultado.ok) {
      return resultado;
    }

    return this.#aplicar(resultado.dados, 1);
  }

  consultar(produtoId) {
    if (!this.#idValido(produtoId)) {
      return {
        ok: false,
        erros: ["Informe um ID de produto válido."],
      };
    }

    return {
      ok: true,
      dados: {
        produtoId,
        quantidade: this.#disponivel(produtoId),
      },
    };
  }

  // Soma (sinal = 1) ou subtrai (sinal = -1) as quantidades dos itens.
  // Calcula tudo num Map novo e só troca o campo no final.
  #aplicar(itens, sinal) {
    const novasQuantidades = itens.reduce((quantidades, item) => {
      const chave = this.#chave(item.produtoId);
      const atual = quantidades.get(chave) ?? 0;
      quantidades.set(chave, atual + sinal * item.quantidade);
      return quantidades;
    }, new Map(this.#quantidades));

    this.#quantidades = novasQuantidades;

    return {
      ok: true,
      dados: {
        itens: itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          disponivel: this.#disponivel(item.produtoId),
        })),
      },
    };
  }

  #chave(produtoId) {
    return String(produtoId);
  }

  #idValido(produtoId) {
    return (
      produtoId !== undefined &&
      produtoId !== null &&
      String(produtoId).trim() !== ""
    );
  }

  #disponivel(produtoId) {
    return this.#quantidades.get(this.#chave(produtoId)) ?? 0;
  }

  #itemValido(item) {
    return (
      Boolean(item) &&
      this.#idValido(item.produtoId) &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0
    );
  }

  #normalizarItens(itens) {
    if (!Array.isArray(itens)) {
      return {
        ok: false,
        erros: ["Itens inválidos: informe uma lista de itens."],
      };
    }

    // Uma mensagem para cada item inválido.
    const erros = itens
      .map((item, indice) => ({ item, indice }))
      .filter(({ item }) => !this.#itemValido(item))
      .map(
        ({ indice }) =>
          `Item ${indice + 1} inválido: informe produtoId e uma quantidade inteira maior que zero.`,
      );

    if (erros.length > 0) {
      return { ok: false, erros };
    }

    // Soma itens repetidos com o mesmo produtoId.
    const agrupados = itens.reduce((mapa, item) => {
      const chave = this.#chave(item.produtoId);
      const existente = mapa.get(chave);
      const nome =
        typeof item.nome === "string" && item.nome.trim()
          ? item.nome.trim()
          : undefined;

      mapa.set(
        chave,
        existente
          ? {
              ...existente,
              nome: existente.nome ?? nome,
              quantidade: existente.quantidade + item.quantidade,
            }
          : { produtoId: item.produtoId, nome, quantidade: item.quantidade },
      );

      return mapa;
    }, new Map());

    return {
      ok: true,
      dados: [...agrupados.values()],
    };
  }
}