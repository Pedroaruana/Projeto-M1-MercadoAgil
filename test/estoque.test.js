import assert from "node:assert/strict";
import { Estoque } from "../src/models/Estoque.js";

const estoque = new Estoque();

estoque.definirQuantidade(1, 1); // Mouse: 1 disponível
estoque.definirQuantidade(2, 2); // Livro: 2 disponíveis

// Deve listar os dois itens em falta e não baixar nenhum.
const pedidoInsuficiente = estoque.baixar([
  { produtoId: 1, nome: "Mouse", quantidade: 3 },
  { produtoId: 2, nome: "Livro", quantidade: 4 },
]);

assert.equal(pedidoInsuficiente.ok, false);
assert.equal(pedidoInsuficiente.erros.length, 2);
assert.equal(estoque.consultar(1).dados.quantidade, 1);
assert.equal(estoque.consultar(2).dados.quantidade, 2);

// Deve baixar quando há quantidade suficiente.
const pedidoValido = estoque.baixar([
  { produtoId: 1, nome: "Mouse", quantidade: 1 },
  { produtoId: 2, nome: "Livro", quantidade: 2 },
]);

assert.equal(pedidoValido.ok, true);
assert.equal(estoque.consultar(1).dados.quantidade, 0);
assert.equal(estoque.consultar(2).dados.quantidade, 0);

// Deve devolver as quantidades ao estoque.
const devolucao = estoque.devolver([
  { produtoId: 1, nome: "Mouse", quantidade: 1 },
  { produtoId: 2, nome: "Livro", quantidade: 2 },
]);

assert.equal(devolucao.ok, true);
assert.equal(estoque.consultar(1).dados.quantidade, 1);
assert.equal(estoque.consultar(2).dados.quantidade, 2);

console.log("Testes passaram: falta de estoque, baixa tudo-ou-nada e devolução.");
