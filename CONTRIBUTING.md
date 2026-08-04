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

## Adicionando um idioma

Todo texto que o usuário lê sai de um catálogo em `functions/internals/i18n/locales/`. Traduzir não
exige mexer em nenhuma função, workflow, trigger ou no `setup.sh`. São três passos:

**1. Copie o catálogo de referência** e traduza só os valores. O `pt-BR.ts` é a referência: é ele
que define quais chaves existem.

```sh
cp functions/internals/i18n/locales/pt-BR.ts functions/internals/i18n/locales/es.ts
```

No arquivo novo, troque o `export const ptBR = {` por um nome próprio anotado com `Catalog`, que é o
que faz o compilador cobrar as chaves:

```ts
import type { Catalog } from "../catalog.ts";

export const es: Catalog = {
  "field.service": "Servicio",
  // ...
};
```

Não renomeie as chaves nem os `{placeholders}` — eles são preenchidos pelo código. O texto ao redor
do placeholder pode mudar de ordem à vontade (`{position} de {total}` ou `{total} … {position}`).

**2. Registre em `functions/internals/i18n/registry.ts`**: um import e uma linha no `CATALOGS`. O
código que você usar aqui é o mesmo que vai em `./setup.sh --locale <código>`.

```ts
import { es } from "./locales/es.ts";

export const CATALOGS = {
  "pt-BR": ptBR,
  "en": en,
  "es": es,
} satisfies Record<string, Catalog>;
```

**3. Rode o checklist do CI.** Ele é o seu revisor: chave faltando, chave a mais ou nome de chave
errado quebram no `deno check`, e os testes em `functions/internals/i18n/i18n_test.ts` reclamam de
tradução vazia, de placeholder perdido e de idioma não registrado.

```sh
deno task fmt && deno task lint && deno check manifest.ts triggers/*.ts && deno task test
```

Pra ver no Slack: `./setup.sh --locale es`.

Não precisa traduzir README, INSTALL ou este arquivo pra contribuir com um idioma — o catálogo é
suficiente.

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
do tipo, tipo `feat!:`) vira major. Commit fora do padrão simplesmente não gera release. O changelog
de cada versão fica na [aba Releases](https://github.com/airton-soares/open-dibs-on-stuff/releases)
do GitHub, não em um arquivo no repo.

## Pull requests

`main` é protegida: não aceita push direto, toda mudança entra via PR.

- Um PR por mudança lógica; evite misturar refactor com feature.
- Descreva o que mudou e por quê (o "porquê" importa mais que o "o quê", que já dá pra ver no diff).
- Garanta que o CI passa (fmt, lint, check, test) antes de pedir revisão.

## Reportando bugs e propondo features

Abra uma issue descrevendo o problema (ou a necessidade) e o contexto: passos pra reproduzir, no
caso de bug, ou o cenário de uso, no caso de feature.

## Licença

Este projeto é licenciado sob a [GPL-3.0](LICENSE). Ao contribuir, você concorda que sua
contribuição será licenciada sob os mesmos termos.
