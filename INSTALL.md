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

Linux e macOS:

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
./setup.sh
```

Windows (PowerShell):

```powershell
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
.\setup.ps1
```

O script confere os pré-requisitos, abre o login do Slack no navegador, faz o deploy e cria os 5
atalhos (Reservar, Liberar, Estender, Sair da fila, Status), imprimindo os links no final.

Pode rodar de novo à vontade: ele pula o login se você já estiver autenticado e **atualiza** os
atalhos existentes em vez de criar novos, então os links já fixados no canal continuam valendo.
Flags opcionais:

- `--app <APP_ID>` (`-App` no PowerShell): escolhe o app quando o Slack CLI conhece mais de um.
- `--locale <CÓDIGO>` (`-Locale` no PowerShell): idioma de mensagem, formulário e nome de atalho.
  Default `pt-BR`, disponíveis `pt-BR` e `en`, e o valor fica guardado entre execuções. Trocar
  depois (`./setup.sh --locale en`) preserva os links fixados: o script renomeia o atalho existente
  em vez de criar outro. Pra adicionar um idioma, veja
  [CONTRIBUTING.md](CONTRIBUTING.md#adicionando-um-idioma).
- `--yes` / `-y` (`-Yes` no PowerShell): apaga atalhos duplicados sem perguntar.

## Opção 2: passo a passo manual

```sh
git clone https://github.com/airton-soares/open-dibs-on-stuff.git
cd open-dibs-on-stuff
slack login
slack deploy
slack trigger create --trigger-def triggers/reserve_link.ts
slack trigger create --trigger-def triggers/release_link.ts
slack trigger create --trigger-def triggers/extend_link.ts
slack trigger create --trigger-def triggers/leave_queue_link.ts
slack trigger create --trigger-def triggers/status_link.ts
```

Cada `trigger create` devolve um link de atalho.

## Depois do deploy

Convide o app no canal onde o time vai usar:

```
/invite @open-dibs-on-stuff
```

Isso é obrigatório: o **Status**, o **Sair da fila** e os lembretes de expiração usam mensagem
efêmera (só a pessoa em questão enxerga), e o Slack só permite mensagem efêmera em canal do qual o
app é membro. Sem o convite, essas ações falham com `channel_not_found`.

Pegue os 5 links retornados e fixe (pin) nesse canal. A partir daí, é só clicar no atalho. Ninguém
mais precisa instalar nada.

Opcional: fuso horário e hora de fim de expediente têm default (`America/Sao_Paulo`, 18h). Pra
mudar:

```sh
slack env add DIBS_TIMEZONE America/Sao_Paulo
slack env add DIBS_BUSINESS_END_HOUR 18
```

## Atualizando para uma versão nova

```sh
git pull
./setup.sh
```

O script redeploya o código atual e reaproveita os atalhos existentes (`slack trigger update`), que
mantêm o mesmo ID e, portanto, o mesmo link. Não precisa refixar nada no canal nem avisar o time.

No fim, abra um dos atalhos e faça uma reserva pra confirmar que a versão nova está no ar.

Se uma execução anterior tiver sido interrompida no meio e deixado atalhos duplicados, o script
lista os sobrando e oferece apagar. Manualmente:

```sh
slack trigger list --app <APP_ID>
slack trigger delete --trigger-id <ID> --app <APP_ID>
```

## Problemas comuns

- **`get_status falhou: chat.postEphemeral falhou: channel_not_found`**: o app não é membro do
  canal. Rode `/invite @open-dibs-on-stuff` nele. Vale também para o `leave_queue`, para os
  lembretes de expiração e para os avisos do Reservar de quem já é dono ou já está na fila, que são
  efêmeros. O resto funciona sem o convite porque posta mensagem normal.
- **`tick falhou: chat.postEphemeral falhou: user_not_in_channel`**: o dono da reserva saiu do
  canal, então o Slack não entrega o lembrete efêmero para ele. A reserva não fica presa: o tick
  reagenda antes de mandar o lembrete, então a expiração automática segue funcionando.
- **`slack: command not found`**: instale o Slack CLI. Linux/macOS:
  `curl -fsSL
  https://downloads.slack-edge.com/slack-cli/install.sh | bash`. Windows (PowerShell):
  `irm
  https://downloads.slack-edge.com/slack-cli/install-windows.ps1 | iex`.
- **Windows recusa rodar `setup.ps1` (política de execução)**: rode
  `powershell -ExecutionPolicy
  Bypass -File .\setup.ps1` em vez de `.\setup.ps1` direto.
- **`runtime_not_found` / `invalid peer certificate: UnknownIssuer` no deploy**: sua rede intercepta
  TLS (proxy corporativo tipo Zscaler/Netskope) e o Deno não confia na CA que reassinou o HTTPS,
  então não baixa os hooks do SDK. Rode com a store do sistema:
  `DENO_TLS_CA_STORE=system slack deploy` (o `setup.sh`/`setup.ps1` já fazem isso). Pra deixar
  permanente, adicione `export DENO_TLS_CA_STORE=system` ao seu shell (`~/.zshrc`/`~/.bashrc`).
- **Workspace sem Run on Slack**: peça pro admin do workspace habilitar, ou use um sandbox do
  [Slack Developer Program](https://api.slack.com/developer-program) pra testar sem custo.
- **App parou de funcionar depois de mudar código**: rode `slack deploy` de novo e recrie os 5
  triggers (os comandos acima). O link muda a cada `trigger create`, então precisa refixar no canal.
