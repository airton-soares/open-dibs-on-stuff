// Imprime o nome de um link trigger em todos os idiomas registrados, o atual primeiro.
// O setup usa isso para achar o atalho ja instalado mesmo quando ele foi criado em outro idioma,
// e assim atualizar em vez de criar um segundo shortcut (que invalidaria o link fixado no canal).
//
//   deno run -q --allow-read scripts/trigger_names.ts reserve_link.ts
import { LOCALE, LOCALES, type MessageKey, t } from "../functions/internals/i18n/mod.ts";

export const TRIGGER_NAME_KEYS: Record<string, MessageKey> = {
  "reserve_link.ts": "action.reserve",
  "release_link.ts": "action.release",
  "extend_link.ts": "action.extend",
  "leave_queue_link.ts": "action.leaveQueue",
  "status_link.ts": "action.status",
};

if (import.meta.main) {
  const file = Deno.args[0] ?? "";
  const key = TRIGGER_NAME_KEYS[file];
  if (!key) {
    console.error(
      `sem chave de nome para triggers/${file}; adicione em scripts/trigger_names.ts`,
    );
    Deno.exit(1);
  }
  for (const locale of [LOCALE, ...LOCALES.filter((l) => l !== LOCALE)]) {
    console.log(t(key, {}, locale));
  }
}
