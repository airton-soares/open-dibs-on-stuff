import type { Catalog } from "../catalog.ts";

export const en: Catalog = {
  "app.description": "Reserve services in staging/production",

  "action.reserve": "Reserve resource",
  "action.reserve.submit": "Reserve",
  "action.reserve.description": "Reserve a service in staging/production",
  "action.release": "Release resource",
  "action.release.submit": "Release",
  "action.release.description": "Release one of your reservations",
  "action.extend": "Extend resource",
  "action.extend.submit": "Extend",
  "action.extend.description": "Extend the time of one of your reservations",
  "action.leaveQueue": "Leave queue",
  "action.leaveQueue.submit": "Leave queue",
  "action.leaveQueue.description": "Takes you off a service's waitlist",
  "action.status": "Reservation status",
  "action.status.description": "Shows what is reserved right now",
  "action.tick": "Reservation tick",

  "fn.createReservation": "Create reservation",
  "fn.releaseReservation": "Release reservation",
  "fn.extendReservation": "Extend reservation",
  "fn.getStatus": "Reservation status",
  "fn.leaveQueue": "Leave queue",
  "fn.tick": "Reservation tick",

  "field.service": "Service",
  "field.environment": "Environment",
  "field.duration": "Duration",
  "field.extraTime": "Extra time",
  "field.note": "Note (optional)",

  "duration.30m": "30 min",
  "duration.1h": "1 hour",
  "duration.2h": "2 hours",
  "duration.4h": "4 hours",
  "duration.eob": "Until end of business day",
  "extra.30m": "+30 min",
  "extra.1h": "+1 hour",
  "extra.2h": "+2 hours",

  "msg.reserved": ":lock: <@{owner}> reserved *{resource}* until {when}{note}.",
  "msg.queue.position": "you are number {position} in a queue of {total}",
  "msg.queue.joined":
    ":hourglass_flowing_sand: <@{user}> joined the queue for *{resource}* ({position}).",
  "msg.queue.alreadyOwner": ":lock: You already hold *{resource}*, no need to join the queue.",
  "msg.queue.alreadyQueued":
    ":hourglass_flowing_sand: You are already in the queue for *{resource}* ({position}).",
  "msg.queue.left": ":door: You left the queue for *{resource}*.",
  "msg.queue.notIn": ":grey_question: You are not in the queue for *{resource}*.",
  "msg.released": ":unlock: <@{user}> released *{resource}*.",
  "msg.expired": ":alarm_clock: The reservation for *{resource}* expired and was released.",
  "msg.promoted":
    ":arrow_forward: <@{owner}> took over *{resource}* (from the queue), until {when}.",
  "msg.reminder": ":bell: Your reservation for *{resource}* expires in {minutes} min. " +
    "To keep it, use the *{shortcut}* shortcut with {service} / {environment}.",
  "msg.extended": ":heavy_plus_sign: <@{owner}> extended *{resource}* until {when}.",
  "msg.notOwner": ":no_entry: Only whoever reserved *{resource}* can manage that reservation.",
  "msg.notFound": ":grey_question: There is no active reservation for *{resource}*.",
  "msg.status.empty": ":white_check_mark: No resource reserved right now.",
  "msg.status.header": ":clipboard: *Active reservations*",
  "msg.status.line": "- *{resource}*: <@{owner}> until {when}{queue}",
  "msg.status.queue": "\n   :busts_in_silhouette: queue ({count}): {users}",
  "msg.status.queue.empty": "\n   :busts_in_silhouette: empty queue",
  "msg.status.queue.entry": "{position}. <@{user}>",
};
