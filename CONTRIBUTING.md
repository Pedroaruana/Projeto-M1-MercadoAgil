# Como contribuir

## Fluxo

1. Clone o repositório e rode `npm install`
2. Atualize a `main`: `git pull origin main`
3. Crie uma branch para a sua tarefa: `git checkout -b feat/nome-da-tarefa`
4. Faça commits pequenos e frequentes
5. Envie a branch: `git push -u origin feat/nome-da-tarefa`
6. Abra um Pull Request para a `main` e preencha o formulário
7. Outra parceria revisa. Só depois disso o PR é aprovado e mesclado

Nunca faça push direto na `main`.

## Nomes de branch

- `feat/` funcionalidade nova (`feat/pedido-cupons`)
- `fix/` correção de bug (`fix/arredondamento-frete`)
- `docs/` documentação (`docs/readme`)

## Commits

Em português, curtos, com prefixo:

- `feat: aplica teto de desconto`
- `fix: corrige arredondamento do frete`
- `chore: atualiza dependências`
- `docs: adiciona instruções de instalação`
- `refactor: separa cálculo de frete`
- `test: adiciona teste do pedido de exemplo`

## Regras

- Cada pessoa é dona dos seus arquivos. Duas pessoas não editam o mesmo arquivo ao mesmo tempo
- Nunca suba `.env`, `.env.*` ou `node_modules`
- Regras de negócio (taxas, alíquotas, comissões, teto) ficam em `src/config/regras.js`
- A lógica fica nas classes. O menu só lê do teclado e mostra na tela
- Sem `for` e `while` para processar listas. Use `map`, `filter`, `find`, `findIndex` e `reduce`
- Todo método público do `Marketplace` devolve `{ ok, dados }` ou `{ ok, erros }`
- Use `arredondar()` de `src/utils/dinheiro.js` em contas com dinheiro

## Revisão de PR

- Todo PR é revisado por alguém de outra parceria
- Teste o código antes de aprovar
- Comente o que não ficou claro. Quem fez precisa saber explicar o código

## Travou?

Avise no grupo no mesmo dia. Mostre o erro e o que já tentou.
