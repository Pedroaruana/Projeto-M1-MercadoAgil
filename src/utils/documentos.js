// Valida CPF e CNPJ pelo formato e pelos dígitos verificadores.
export function validarCpf(cpf) {
    if (typeof cpf !== "string") {
        return false;
    }

    const numeros = cpf.replace(/\D/g, "");

    if (numeros.length !== 11) {
        return false;
    }

    if (/^(\d)\1+$/.test(numeros)) {
        return false;
    }

    // calcula a soma ponderada dos nove primeiros digitos do cpf
    const somaPrimeiroDigito = numeros
        .slice(0, 9)
        .split("")
        .reduce((total, numero, indice) => {
            return total + Number(numero) * (10 - indice);
        }, 0);

    const restoPrimeiroDigito = somaPrimeiroDigito % 11;
    const primeiroDigito = restoPrimeiroDigito < 2
        ? 0
        : 11 - restoPrimeiroDigito;

    // Calcula a soma ponderada dos dez primeiros dígitos do cpf
    const somaSegundoDigito = numeros
        .slice(0, 10)
        .split("")
        .reduce((total, numero, indice) => {
            return total + Number(numero) * (11 - indice);
        }, 0);

    // Calcula o segundo dígito verificador
    const restoSegundoDigito = somaSegundoDigito % 11;
    const segundoDigito = restoSegundoDigito < 2
        ? 0
        : 11 - restoSegundoDigito;

    return primeiroDigito === Number(numeros[9]) && segundoDigito === Number(numeros[10]);
}

// Valida CNPJ pelo formato e pelos dígitos verificadores.
export function validarCnpj(cnpj) {
    if (typeof cnpj !== "string") {
        return false;
    }

    const numeros = cnpj.replace(/\D/g, "");

    if (numeros.length !== 14) {
        return false;
    }

    if (/^(\d)\1+$/.test(numeros)) {
        return false;
    }

    const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Calcula a soma ponderada dos doze primeiros dígitos.
    const somaPrimeiroDigito = numeros
        .slice(0, 12)
        .split("")
        .reduce((total, numero, indice) => {
            return total + Number(numero) * pesosPrimeiroDigito[indice];
        }, 0);

    const restoPrimeiroDigito = somaPrimeiroDigito % 11;
    const primeiroDigito = restoPrimeiroDigito < 2
        ? 0
        : 11 - restoPrimeiroDigito;

    // Calcula a soma ponderada dos treze primeiros dígitos.
    const somaSegundoDigito = numeros
        .slice(0, 13)
        .split("")
        .reduce((total, numero, indice) => {
            return total + Number(numero) * pesosSegundoDigito[indice];
        }, 0);

    const restoSegundoDigito = somaSegundoDigito % 11;
    const segundoDigito = restoSegundoDigito < 2
        ? 0
        : 11 - restoSegundoDigito;

    return primeiroDigito === Number(numeros[12]) &&
        segundoDigito === Number(numeros[13]);
}
