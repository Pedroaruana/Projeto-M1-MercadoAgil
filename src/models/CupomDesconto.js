// Código, tipo (percentual, fixo, frete), valor, validade, valor mínimo e se é cumulativo.
// Sabe dizer se está válido.
export class CupomDesconto {
    constructor(codigo, tipo, valor, validade, valorMinimo, cumulativo) {
        this.codigo = codigo;
        this.tipo = tipo;
        this.valor = valor;
        this.validade = validade;
        this.valorMinimo = valorMinimo;
        this.cumulativo = cumulativo;
    }

    estaValido() {
        return new Date(this.validade) > new Date();
    }
}
