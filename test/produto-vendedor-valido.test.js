import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Marketplace } from '../src/services/Marketplace.js'
import { carregarSeed } from '../src/data/seed.js'

test('recusa produto com vendedor inexistente', () => {
  // Cria um Marketplace vazio, sem vendedores cadastrados.
  const marketplace = new Marketplace()

  // Tenta cadastrar um produto do vendedor 999.
  const resposta = marketplace.cadastrarProduto({
    nome: 'Mouse',
    preco: 120,
    categoria: 'eletronicos',
    vendedorId: 999,
    quantidade: 1
  })

  // Confere se o cadastro foi recusado com a mensagem esperada.
  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'Vendedor não encontrado. Cadastre o vendedor antes do produto.'
  ])

  // Confere se nenhum produto foi cadastrado.
  assert.equal(marketplace.listarProdutos().dados.length, 0)
})

test('recusa preço em texto', () => {
  const marketplace = new Marketplace()

  // Carrega os vendedores e produtos de exemplo.
  const carga = carregarSeed(marketplace)
  assert.equal(carga.ok, true)

  const vendedor = marketplace.listarVendedores().dados[0]
  const quantidadeAntes = marketplace.listarProdutos().dados.length

  const resposta = marketplace.cadastrarProduto({
    nome: 'Mouse de teste',
    preco: 'abc',
    categoria: 'eletronicos',
    vendedorId: vendedor.id,
    quantidade: 1
  })

  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'O preço deve ser um número.'
  ])

  // A tentativa inválida não deve adicionar um produto.
  assert.equal(
    marketplace.listarProdutos().dados.length,
    quantidadeAntes
  )
})

test('recusa preço negativo', () => {
  const marketplace = new Marketplace()
  const carga = carregarSeed(marketplace)
  assert.equal(carga.ok, true)

  const vendedor = marketplace.listarVendedores().dados[0]
  const quantidadeAntes = marketplace.listarProdutos().dados.length

  const resposta = marketplace.cadastrarProduto({
    nome: 'Mouse de teste',
    preco: -10,
    categoria: 'eletronicos',
    vendedorId: vendedor.id,
    quantidade: 1
  })

  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'O preço deve ser maior que zero.'
  ])

  assert.equal(
    marketplace.listarProdutos().dados.length,
    quantidadeAntes
  )
})

test('recusa preço zero', () => {
  const marketplace = new Marketplace()
  const carga = carregarSeed(marketplace)
  assert.equal(carga.ok, true)

  const vendedor = marketplace.listarVendedores().dados[0]
  const quantidadeAntes = marketplace.listarProdutos().dados.length

  const resposta = marketplace.cadastrarProduto({
    nome: 'Mouse de teste',
    preco: 0,
    categoria: 'eletronicos',
    vendedorId: vendedor.id,
    quantidade: 1
  })

  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'O preço deve ser maior que zero.'
  ])

  assert.equal(
    marketplace.listarProdutos().dados.length,
    quantidadeAntes
  )
})

test('recusa quantidade em texto', () => {
  const marketplace = new Marketplace()
  const carga = carregarSeed(marketplace)
  assert.equal(carga.ok, true)

  const vendedor = marketplace.listarVendedores().dados[0]
  const quantidadeAntes = marketplace.listarProdutos().dados.length

  const resposta = marketplace.cadastrarProduto({
    nome: 'Mouse de teste',
    preco: 120,
    categoria: 'eletronicos',
    vendedorId: vendedor.id,
    quantidade: 'abc'
  })

  assert.equal(resposta.ok, false)
  assert.deepEqual(resposta.erros, [
    'A quantidade deve ser um número inteiro igual ou maior que zero.'
  ])

  assert.equal(
    marketplace.listarProdutos().dados.length,
    quantidadeAntes
  )
})