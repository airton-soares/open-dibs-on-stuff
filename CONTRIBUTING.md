# Contribuindo

🇧🇷 Português | 🇺🇸 [English](CONTRIBUTING.en.md)

Obrigado por considerar contribuir com o `open-dibs-on-stuff`. Este documento explica como preparar
o ambiente, quais checagens rodar antes de abrir um PR e as convenções usadas no projeto.

## Preparando o ambiente

- [Deno](https://deno.com/) 2.x, de preferência via [asdf](https://asdf-vm.com/) (a versão exata
  fica pinada em `.tool-versions`):

  ```sh
  asdf plugin add deno https://github.com/asdf-community/asdf-deno.git
  asdf install
  ```

- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) logada (`slack login`). Só é necessária se
  você for testar contra um workspace real do Slack (`slack run` / `slack deploy`); pra rodar
  lint/fmt/testes basta o Deno.

## Rodando localmente

```sh
slack run
```

## Checklist antes de abrir um PR

O CI roda estes comandos nesta ordem; rode todos localmente antes de enviar:

```sh
deno task fmt         # formata (ou `deno task fmt:check` só pra conferir)
deno task lint
deno check manifest.ts triggers/*.ts
deno task test
```

## Arquitetura

O projeto segue o padrão "núcleo puro + casca fina": decisões de negócio ficam em módulos puros e
testáveis em `functions/internals/`, sem rede nem client do Slack. Custom functions em
`functions/*.ts` são cascas finas que delegam a decisão ao núcleo e cuidam de IO (Datastore,
mensagens). Veja [CLAUDE.md](CLAUDE.md) (em inglês) pra mais detalhes de como os módulos se
encaixam.

Ao adicionar comportamento novo, prefira:

- Escrever a lógica de decisão em `functions/internals/`, com testes co-localizados (`*_test.ts`)
  que não dependem de rede.
- Manter as custom functions como cascas finas, sem lógica de decisão direto na function.
- Cobrir o caso novo com teste antes de considerar a mudança pronta.

## Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
`refactor:`, `test:`, `chore:`, etc.), com a descrição em português, no imperativo e curta. Dá uma
olhada no `git log` pra ver exemplos.

Isso não é só estilo: o release em `main` é automatizado por
[semantic-release](https://semantic-release.gitbook.io/), que lê esses prefixos pra decidir a
próxima versão. `fix:` vira patch, `feat:` vira minor, e um rodapé `BREAKING CHANGE:` (ou `!` depois
do tipo, tipo `feat!:`) vira major. Commit fora do padrão simplesmente não gera release. O
`CHANGELOG.md` também é gerado a partir disso — não edite ele à mão.

## Pull requests

- Um PR por mudança lógica; evite misturar refactor com feature.
- Descreva o que mudou e por quê (o "porquê" importa mais que o "o quê", que já dá pra ver no diff).
- Garanta que o CI passa (fmt, lint, check, test) antes de pedir revisão.

## Reportando bugs e propondo features

Abra uma issue descrevendo o problema (ou a necessidade) e o contexto: passos pra reproduzir, no
caso de bug, ou o cenário de uso, no caso de feature.

## Licença

Este projeto é licenciado sob a [GPL-3.0](LICENSE). Ao contribuir, você concorda que sua
contribuição será licenciada sob os mesmos termos.
