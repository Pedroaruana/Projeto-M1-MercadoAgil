// Dados de exemplo carregados ao iniciar.
// Mínimo: 3 clientes, 3 vendedores, 8 produtos de 3 categorias, 3 cupons com validade futura.
// Incluir os dados do pedido de exemplo do enunciado (Mouse R$ 120 e Livro de JavaScript R$ 80, cliente do Nordeste).

export const seed = {
  clientes: [
    {
      id: 1,
      nome: 'Maria Oliveira',
      email: 'maria@example.com',
      cpf: '52998224725',
      regiao: 'Nordeste',
    },
    {
      id: 2,
      nome: 'João Santos',
      email: 'joao@example.com',
      cpf: '11144477735',
      regiao: 'Sudeste',
    },
    {
      id: 3,
      nome: 'Ana Costa',
      email: 'ana@example.com',
      cpf: '93541134780',
      regiao: 'Sul',
    },
  ],

  vendedores: [
    {
      id: 1,
      nome: 'TechBahia',
      cnpj: '11222333000181',
      email: 'contato.techbahia@example.com',
    },
    {
      id: 2,
      nome: 'Livraria Sol',
      cnpj: '45723174000110',
      email: 'contato.livraria@example.com',
    },
    {
      id: 3,
      nome: 'Casa Prática',
      cnpj: '12345678000195',
      email: 'contato.casapratica@example.com',
    },
  ],

  produtos: [
    {
      id: 1,
      nome: 'Mouse',
      preco: 120,
      categoria: 'eletronicos',
      vendedorId: 1,
    },
    {
      id: 2,
      nome: 'Livro de JavaScript',
      preco: 80,
      categoria: 'livros',
      vendedorId: 2,
    },
    {
      id: 3,
      nome: 'Teclado Mecânico',
      preco: 250,
      categoria: 'eletronicos',
      vendedorId: 1,
    },
    {
      id: 4,
      nome: 'Livro de Algoritmos',
      preco: 95,
      categoria: 'livros',
      vendedorId: 2,
    },
    {
      id: 5,
      nome: 'Cadeira de Escritório',
      preco: 450,
      categoria: 'casa',
      vendedorId: 3,
    },
    {
      id: 6,
      nome: 'Luminária de Mesa',
      preco: 110,
      categoria: 'casa',
      vendedorId: 3,
    },
    {
      id: 7,
      nome: 'Fone de Ouvido',
      preco: 90,
      categoria: 'eletronicos',
      vendedorId: 1,
    },
    {
      id: 8,
      nome: 'Livro de Estruturas de Dados',
      preco: 100,
      categoria: 'livros',
      vendedorId: 2,
    },
  ],

  cupons: [
    {
      codigo: 'BEMVINDO10',
      tipo: 'percentual',
      valor: 10,
      validade: '2027-12-31',
      valorMinimo: 100,
      cumulativo: false,
    },
    {
      codigo: 'DESCONTO20',
      tipo: 'fixo',
      valor: 20,
      validade: '2027-12-31',
      valorMinimo: 150,
      cumulativo: false,
    },
    {
      codigo: 'FRETEZERO',
      tipo: 'frete',
      valor: 0,
      validade: '2027-12-31',
      valorMinimo: 0,
      cumulativo: true,
    },
  ],
}

