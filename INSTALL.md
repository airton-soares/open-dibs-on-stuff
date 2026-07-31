# Instalação

🇧🇷 Português | 🇺🇸 [English](INSTALL.en.md)

Guia rápido pra colocar o `open-dibs-on-stuff` rodando no seu workspace do Slack. Isso não é uma
instalação via App Directory (veja o porquê no [README](README.md#arquitetura)): é você, ou alguém
do time, rodando um deploy único. Depois disso, o resto do time só usa os atalhos, sem instalar
nada.

Leva uns 10 minutos.

## Pré-requisitos

- Um workspace do Slack com Run on Slack habilitado (plano pago) ou um sandbox do
  [Slack Developer Program](https://api.slack.com/developer-program).
- [Deno](https://deno.com/) 2.x instalado.
- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) instalado.

## Opção 1: script automático

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
./setup.sh
```

O script confere os pré-requisitos, abre o login do Slack no navegador, faz o deploy e cria os 4
atalhos (Reservar, Liberar, Estender, Status), imprimindo os links no final.

## Opção 2: passo a passo manual

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
slack login
slack deploy
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

Cada `trigger create` devolve um link de atalho.

## Depois do deploy

Pegue os 4 links retornados e fixe (pin) no canal onde o time vai usar o app. A partir daí, é só
clicar no atalho. Ninguém mais precisa instalar nada.

Opcional: fuso horário e hora de fim de expediente têm default (`America/Sao_Paulo`, 18h). Pra
mudar:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

## Problemas comuns

- **`slack: command not found`**: instale o Slack CLI
  (`curl -fsSL
  https://downloads.slack-edge.com/slack-cli/install.sh | bash`).
- **Workspace sem Run on Slack**: peça pro admin do workspace habilitar, ou use um sandbox do
  [Slack Developer Program](https://api.slack.com/developer-program) pra testar sem custo.
- **App parou de funcionar depois de mudar código**: rode `slack deploy` de novo e recrie os 4
  triggers (os comandos acima). O link muda a cada `trigger create`, então precisa refixar no canal.
