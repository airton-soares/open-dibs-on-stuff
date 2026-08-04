import type { Reservation, WaitlistEntry } from "./types.ts";

function when(epoch: number): string {
  return `<!date^${epoch}^{date_short_pretty} {time}|${new Date(epoch * 1000).toISOString()}>`;
}

export function reservedMsg(r: Reservation): string {
  const note = r.note ? ` (${r.note})` : "";
  return `:lock: <@${r.owner}> reservou *${r.resource}* até ${when(r.expires_at)}${note}.`;
}

function queuePosition(position: number, total: number): string {
  return `sua posição é a ${position} em uma fila de tamanho ${total}`;
}

export function enqueuedMsg(
  resource: string,
  user: string,
  position: number,
  total: number,
): string {
  return `:hourglass_flowing_sand: <@${user}> entrou na fila de *${resource}* (${
    queuePosition(position, total)
  }).`;
}

export function alreadyOwnerMsg(resource: string): string {
  return `:lock: Você já está com *${resource}* reservado, não precisa entrar na fila.`;
}

export function alreadyQueuedMsg(resource: string, position: number, total: number): string {
  return `:hourglass_flowing_sand: Você já está na fila de *${resource}* (${
    queuePosition(position, total)
  }).`;
}

export function leftQueueMsg(resource: string): string {
  return `:door: Você saiu da fila de *${resource}*.`;
}

export function notInQueueMsg(resource: string): string {
  return `:grey_question: Você não está na fila de *${resource}*.`;
}

export function releasedMsg(resource: string, user: string): string {
  return `:unlock: <@${user}> liberou *${resource}*.`;
}

export function expiredMsg(resource: string): string {
  return `:alarm_clock: A reserva de *${resource}* expirou e foi liberada.`;
}

export function promotedMsg(r: Reservation): string {
  return `:arrow_forward: <@${r.owner}> assumiu *${r.resource}* (da fila), até ${
    when(r.expires_at)
  }.`;
}

export function reminderMsg(r: Reservation, marker: number): string {
  return `:bell: Sua reserva de *${r.resource}* expira em ${marker} min. ` +
    `Para manter, use o atalho *Estender* informando ${r.service} / ${r.environment}.`;
}

export function extendedMsg(r: Reservation): string {
  return `:heavy_plus_sign: <@${r.owner}> estendeu *${r.resource}* até ${when(r.expires_at)}.`;
}

export function notOwnerMsg(resource: string): string {
  return `:no_entry: Apenas quem reservou *${resource}* pode gerenciar essa reserva.`;
}

export function notFoundMsg(resource: string): string {
  return `:grey_question: Não há reserva ativa para *${resource}*.`;
}

export function statusMsg(
  reservations: Reservation[],
  queues: Record<string, WaitlistEntry[]>,
): string {
  if (reservations.length === 0) return ":white_check_mark: Nenhum recurso reservado agora.";
  const lines = reservations
    .slice()
    .sort((a, b) => a.resource.localeCompare(b.resource))
    .map((r) => {
      const q = queues[r.resource] ?? [];
      const fila = q.length ? ` | fila: ${q.map((e) => `<@${e.user}>`).join(", ")}` : "";
      return `- *${r.resource}*: <@${r.owner}> até ${when(r.expires_at)}${fila}`;
    });
  return `:clipboard: *Reservas ativas*\n${lines.join("\n")}`;
}
