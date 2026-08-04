# open-dibs-on-stuff

[![CI](https://github.com/airton-soares/open-dibs-on-stuff/actions/workflows/ci.yml/badge.svg)](https://github.com/airton-soares/open-dibs-on-stuff/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/airton-soares/open-dibs-on-stuff)](https://github.com/airton-soares/open-dibs-on-stuff/releases/latest)

🇧🇷 Português | 🇺🇸 [English](README.en.md)

App de Slack **open source** para reservar o uso de recursos compartilhados (serviços em ambientes
de `development`, `staging` ou `production`), com fila de espera, auto-expiração e lembretes. Ajuda
times de desenvolvimento e profissionais de TI em geral a organizar o uso coletivo de ambientes sem
pisar no pé um do outro. Roda 100% na infraestrutura do Slack (Run on Slack / ROSI): o Slack hospeda
o código (Deno) e o banco (Datastore), sem servidor nem custo de nuvem próprio.

**Quer só instalar no seu workspace, sem mexer no código?** Vai direto pro
[guia de instalação](INSTALL.md).

## Como funciona

A interação é por **link triggers** (atalhos fixados no canal) que abrem um formulário:

- **Reservar**: serviço + ambiente + duração (30m, 1h, 2h, 4h, até o fim do expediente) + nota
  opcional. Se o recurso estiver livre, cria a reserva; se estiver ocupado, coloca você na fila e
  diz sua posição. Quem já é dono do recurso ou já está na fila dele não entra na fila de novo — só
  recebe um aviso efêmero.
- **Liberar**: serviço + ambiente. Só o dono libera. Ao liberar, o próximo da fila é promovido
  automaticamente.
- **Estender**: serviço + ambiente + tempo extra (+30m, +1h, +2h). Só o dono.
- **Sair da fila**: serviço + ambiente. Tira você da fila daquele recurso; a confirmação é efêmera
  (só você vê). Se você não estiver na fila, o app só avisa isso.
- **Status**: lista o que está reservado, por quem, até quando, e as filas.

O recurso é identificado por `serviço-sufixo`, onde o sufixo é `dev`, `stg` ou `prod` (ex:
`cards-stg`, `billing-prod`).

Cada reserva agenda um `trigger` pontual (`once`) que dispara lembretes ao dono a 60, 30 e 10
minutos do fim e, no vencimento, expira a reserva e promove o próximo da fila. Quem é promovido da
fila recebe o recurso **até o fim do expediente**.

Os lembretes são efêmeros: só o dono da reserva vê. Como mensagem efêmera desaparece quando o Slack
recarrega e não gera notificação, o lembrete é melhor tratado como um empurrão, não como garantia de
aviso. Expiração e promoção continuam públicas no canal, porque interessam a todo mundo.

## Configuração

Fuso e horário de fim de expediente são configuráveis por variáveis de ambiente do ROSI (com
defaults):

| Variável                 | Default             | Descrição                                     |
| ------------------------ | ------------------- | --------------------------------------------- |
| `DIBS_TIMEZONE`          | `America/Sao_Paulo` | Fuso usado no cálculo de "fim de expediente". |
| `DIBS_BUSINESS_END_HOUR` | `18`                | Hora (0-23) do fim de expediente.             |

Definir no app publicado:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

### Idioma

O idioma **não** é variável de ambiente: é escolhido na instalação, com uma opção única no setup.

```sh
./setup.sh --locale en     # .\setup.ps1 -Locale en no Windows
```

O default é `pt-BR`, e o valor fica guardado entre execuções (`./setup.sh` sem a flag mantém o que
já está). Uma única constante (`functions/internals/i18n/locale.ts`) manda em mensagem, rótulo de
formulário e nome de atalho, então não tem como o app ficar meio traduzido. Trocar exige rodar o
setup de novo, porque formulário e atalho são resolvidos no deploy — em troca, não existe env var de
idioma pra ficar fora de sincronia.

Os links já fixados no canal continuam valendo depois de trocar: o setup encontra o atalho instalado
pelo nome em qualquer idioma registrado e renomeia no lugar, em vez de criar um segundo.

Idiomas disponíveis: `pt-BR`, `en`. Adicionar o seu é um arquivo mais uma linha — veja
[CONTRIBUTING.md](CONTRIBUTING.md#adicionando-um-idioma).

## Pré-requisitos

- [Deno](https://deno.com/) 2.x. Recomendado via [asdf](https://asdf-vm.com/):

  ```sh
  asdf plugin add deno https://github.com/asdf-community/asdf-deno.git
  asdf install deno 2.1.4
  asdf local deno 2.1.4
  ```

- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) logada (`slack login`).
- Um workspace com Run on Slack habilitado (plano pago) ou um sandbox do
  [Slack Developer Program](https://api.slack.com/developer-program).

## Desenvolvimento

Rodar localmente (hot reload contra o Slack):

```sh
slack run
```

Criar os link triggers (copie o shortcut link retornado e fixe no canal onde o seu time vai usar o
app):

```sh
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/leave_queue_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

## Deploy

```sh
slack deploy
```

Depois do deploy, recrie os triggers no app publicado (mesmo comando acima) e configure as variáveis
de ambiente (seção Configuração).

## Testes e qualidade

```sh
deno task test      # testes unitarios (deno test --allow-read)
deno task lint      # deno lint
deno task fmt       # formata
deno task fmt:check # confere formatacao (usado no CI)
```

O CI (GitHub Actions) roda `deno fmt --check`, `deno lint`, `deno check manifest.ts triggers/*.ts` e
`deno test --allow-read`.

## Estrutura

```text
manifest.ts            # datastores, functions, workflows, escopos e icone
slack.json             # hooks da Slack CLI
datastores/            # reservations (PK resource) e waitlist (PK id)
functions/             # custom functions (cascas finas) + testes co-localizados
  internals/           # nucleo puro de dominio + IO (testado sem rede)
    i18n/locales/      # catalogos de texto (pt-BR e a referencia das chaves)
workflows/             # reserve, release, extend, leave_queue, status, tick
triggers/              # link triggers dos atalhos
scripts/               # utilitarios usados pelo setup (nome do atalho por idioma)
assets/icon.png        # icone do app (usado pelo manifest)
assets/icon.svg        # fonte vetorial do icone
```

## Arquitetura

"Núcleo puro + casca fina": toda a lógica de decisão fica em módulos puros em `functions/internals/`
(recebem dados simples e retornam decisões, testados exaustivamente com `deno test` sem rede). As
custom functions são cascas finas que leem/escrevem no Datastore e postam mensagens, delegando as
decisões ao núcleo. Cada function expõe um `handleX(client, inputs, opts?)` testável com um `client`
stub, além do `SlackFunction` padrão.

O ROSI só oferece triggers recorrentes com granularidade horária ou maior, então os lembretes e a
expiração usam triggers `once` pontuais reagendados em cadeia, com um `token` por reserva para
ignorar disparos obsoletos.
