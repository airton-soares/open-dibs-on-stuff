// Catalogo de referencia: e ele que define as chaves que todo idioma precisa ter.
// Para adicionar um idioma, copie este arquivo, traduza os valores e registre em ../registry.ts.
// Ver CONTRIBUTING.md, secao "Adicionando um idioma".
export const ptBR = {
  "app.description": "Reserva de serviços em staging/production",

  "action.reserve": "Reservar recurso",
  "action.reserve.submit": "Reservar",
  "action.reserve.description": "Reserva um serviço em staging/production",
  "action.release": "Liberar recurso",
  "action.release.submit": "Liberar",
  "action.release.description": "Libera uma reserva sua de um serviço",
  "action.extend": "Estender recurso",
  "action.extend.submit": "Estender",
  "action.extend.description": "Estende o tempo de uma reserva sua",
  "action.leaveQueue": "Sair da fila",
  "action.leaveQueue.submit": "Sair da fila",
  "action.leaveQueue.description": "Tira você da fila de espera de um serviço",
  "action.status": "Status das reservas",
  "action.status.description": "Mostra o que está reservado agora",
  "action.tick": "Tick de reserva",

  "fn.createReservation": "Criar reserva",
  "fn.releaseReservation": "Liberar reserva",
  "fn.extendReservation": "Estender reserva",
  "fn.getStatus": "Status das reservas",
  "fn.leaveQueue": "Sair da fila",
  "fn.tick": "Tick de reserva",

  "field.service": "Serviço",
  "field.environment": "Ambiente",
  "field.duration": "Duração",
  "field.extraTime": "Tempo extra",
  "field.note": "Nota (opcional)",

  "duration.30m": "30 min",
  "duration.1h": "1 hora",
  "duration.2h": "2 horas",
  "duration.4h": "4 horas",
  "duration.eob": "Até o fim do expediente",
  "extra.30m": "+30 min",
  "extra.1h": "+1 hora",
  "extra.2h": "+2 horas",

  "msg.reserved": ":lock: <@{owner}> reservou *{resource}* até {when}{note}.",
  "msg.queue.position": "sua posição é a {position} em uma fila de tamanho {total}",
  "msg.queue.joined":
    ":hourglass_flowing_sand: <@{user}> entrou na fila de *{resource}* ({position}).",
  "msg.queue.alreadyOwner":
    ":lock: Você já está com *{resource}* reservado, não precisa entrar na fila.",
  "msg.queue.alreadyQueued":
    ":hourglass_flowing_sand: Você já está na fila de *{resource}* ({position}).",
  "msg.queue.left": ":door: Você saiu da fila de *{resource}*.",
  "msg.queue.notIn": ":grey_question: Você não está na fila de *{resource}*.",
  "msg.released": ":unlock: <@{user}> liberou *{resource}*.",
  "msg.expired": ":alarm_clock: A reserva de *{resource}* expirou e foi liberada.",
  "msg.promoted": ":arrow_forward: <@{owner}> assumiu *{resource}* (da fila), até {when}.",
  "msg.reminder": ":bell: Sua reserva de *{resource}* expira em {minutes} min. " +
    "Para manter, use o atalho *{shortcut}* informando {service} / {environment}.",
  "msg.extended": ":heavy_plus_sign: <@{owner}> estendeu *{resource}* até {when}.",
  "msg.notOwner": ":no_entry: Apenas quem reservou *{resource}* pode gerenciar essa reserva.",
  "msg.notFound": ":grey_question: Não há reserva ativa para *{resource}*.",
  "msg.status.empty": ":white_check_mark: Nenhum recurso reservado agora.",
  "msg.status.header": ":clipboard: *Reservas ativas*",
  "msg.status.line": "- *{resource}*: <@{owner}> até {when}{queue}",
  "msg.status.queue": "\n   :busts_in_silhouette: fila ({count}): {users}",
  "msg.status.queue.empty": "\n   :busts_in_silhouette: fila vazia",
  "msg.status.queue.entry": "{position}. <@{user}>",
} as const;
