// Id, nome, preço, categoria e o vendedor que o anuncia.
export class Produto {
    constructor(id, nome, preco, categoria, vendedorId) {
        this.id = id;
        this.nome = nome;
        this.preco = preco;
        this.categoria = categoria;
        this.vendedorId = vendedorId;
    }

}
